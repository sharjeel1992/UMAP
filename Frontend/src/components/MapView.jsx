// MapView — Leaflet map with marker clustering for geolocated YouTube videos.
//
// Architecture notes:
//  - MapContainer is the react-leaflet root; all child components that use
//    useMap() / useMapEvents() must be rendered inside it.
//  - BoundsWatcher is a renderless child that watches map movement and
//    reports the current bounding box back to the parent via onBoundsChange.
//  - ClusterLayer is a renderless child that manages the leaflet.markercluster
//    layer imperatively (direct DOM/Leaflet API calls) instead of through React
//    rendering, which is necessary because markercluster is not a React component.
import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import './MapView.css'

// Vite rewrites asset URLs during the build step which breaks Leaflet's internal
// _getIconUrl method that generates marker image paths. Deleting the method and
// explicitly providing CDN URLs restores the default pin icons.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom divIcon for video markers — uses CSS class "video-pin" for styling.
// iconAnchor positions the bottom-center of the 32×32 icon on the coordinate.
// popupAnchor offsets any popup/tooltip so it appears above the icon tip.
const VIDEO_ICON = L.divIcon({
  className: 'video-pin',
  html: `<div class="video-pin__inner">▶</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
})

// Slightly larger version of the icon used for the currently selected video,
// providing a clear visual distinction on the map.
const VIDEO_ICON_SELECTED = L.divIcon({
  className: 'video-pin video-pin--selected',
  html: `<div class="video-pin__inner">▶</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
})

/**
 * Extracts the four cardinal bounds from a Leaflet map instance into a plain
 * object that can be serialised and sent to the API.
 *
 * @param {L.Map} map
 * @returns {{ north: number, south: number, east: number, west: number }}
 */
function getBounds(map) {
  const b = map.getBounds()
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  }
}

/**
 * Renderless child component that:
 *  1. Reports the initial map bounds to the parent on mount.
 *  2. Reports new bounds every time the map finishes a pan or zoom ("moveend").
 *  3. Reacts to the `flyTo` prop and animates the map to the new position.
 *
 * Must be rendered inside <MapContainer> to access the map context via useMap().
 */
function BoundsWatcher({ onBoundsChange, flyTo }) {
  const map = useMap()

  // Store the callback in a ref so the useMapEvents handler always calls the
  // latest version even though the event handler closure is only created once
  // at mount time (stale closure prevention pattern).
  const cbRef = useRef(onBoundsChange)
  cbRef.current = onBoundsChange

  // Report bounds once immediately after the map is mounted and ready
  useEffect(() => {
    cbRef.current(getBounds(map))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])  // `map` is stable after mount; the ref ensures the latest cb is called

  // Subscribe to the 'moveend' event which fires after every pan or zoom animation
  useMapEvents({
    moveend() {
      cbRef.current(getBounds(map))
    },
  })

  // React to flyTo changes: use fitBounds when a bounding box is supplied
  // (typically from a geocoded place name), or setView for a single point
  // (typically from the Geolocation API).
  useEffect(() => {
    if (!flyTo) return
    if (flyTo.bbox) {
      // Fit the map to the place's bounding box; cap zoom to avoid landing
      // too far in on very small places
      map.fitBounds([
        [flyTo.bbox.south, flyTo.bbox.west],
        [flyTo.bbox.north, flyTo.bbox.east],
      ], { maxZoom: 14 })
    } else {
      map.setView([flyTo.lat, flyTo.lng], flyTo.zoom || 13)
    }
  }, [flyTo, map])

  return null  // No DOM output — this is a side-effect-only component
}

/**
 * Renderless child component that manages a leaflet.markercluster layer
 * imperatively.  Cluster groups nearby markers into a single cluster bubble
 * at lower zoom levels, keeping the map readable.
 *
 * Why imperative instead of declarative?
 *   leaflet.markercluster does not have a react-leaflet wrapper, so we
 *   interact with it directly via the Leaflet API inside useEffect hooks.
 *
 * Must be rendered inside <MapContainer>.
 */
function ClusterLayer({ videos, selectedVideo, onVideoClick }) {
  const map = useMap()
  const clusterRef = useRef(null)          // The L.markerClusterGroup instance
  const markersRef = useRef(new Map())     // Maps videoId → L.Marker for fast lookups

  // Create the cluster group once and add it to the map.
  // This only runs once because `map` is stable after mount.
  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,  // Don't draw a polygon around clustered points on hover
        maxClusterRadius: 60,        // Pixels radius within which markers are grouped
      })
      map.addLayer(clusterRef.current)
    }
  }, [map])

  // Re-build all markers whenever the video list or selection changes.
  // Clearing and re-adding is simpler than diffing; the cluster group handles
  // the DOM efficiently.
  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return

    // Remove all existing markers from the cluster and clear our lookup map
    cluster.clearLayers()
    markersRef.current.clear()

    videos.forEach(video => {
      // Skip videos without valid coordinates — they can't be placed on the map
      if (video.lat == null || video.lng == null) return

      const isSelected = selectedVideo?.id === video.id
      const icon = isSelected ? VIDEO_ICON_SELECTED : VIDEO_ICON

      const marker = L.marker([video.lat, video.lng], { icon })
      // Tooltip appears above the pin on hover, showing the video title
      marker.bindTooltip(video.title, { direction: 'top', offset: [0, -30] })
      marker.on('click', () => onVideoClick(video))

      markersRef.current.set(video.id, marker)
      cluster.addLayer(marker)
    })
  }, [videos, selectedVideo, onVideoClick, map])

  // Efficiently update only the selected marker's icon without rebuilding
  // the entire cluster.  This runs whenever the selection changes but the
  // video list stays the same (e.g. clicking a card in the sidebar).
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(selectedVideo?.id === id ? VIDEO_ICON_SELECTED : VIDEO_ICON)
    })
  }, [selectedVideo])

  return null  // No DOM output — all rendering is done by Leaflet
}

// Default map center and zoom used before the user's location is known.
// Seattle is chosen as a sensible, video-rich fallback city.
const DEFAULT_CENTER = [47.6062, -122.3321]
const DEFAULT_ZOOM = 11

/**
 * Top-level map component.
 *
 * @param {object}      props
 * @param {object[]}    props.videos         - Geolocated video objects to plot
 * @param {object|null} props.selectedVideo  - Currently selected video (or null)
 * @param {function}    props.onVideoClick   - Called when a map marker is clicked
 * @param {function}    props.onBoundsChange - Called with { north, south, east, west } on map move
 * @param {object|null} props.flyTo          - Target position/bounds to animate the map to
 */
export default function MapView({ videos, selectedVideo, onVideoClick, onBoundsChange, flyTo }) {
  return (
    <div className="map-wrapper">
      {/* MapContainer initialises Leaflet and provides context to all children.
          center / zoom are only used for the initial render; subsequent position
          changes are handled imperatively inside BoundsWatcher. */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="leaflet-map"
        zoomControl={true}
      >
        {/* OpenStreetMap tile layer — free, open-source base map */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Watches map movement and handles flyTo animations */}
        <BoundsWatcher onBoundsChange={onBoundsChange} flyTo={flyTo} />

        {/* Renders and clusters video markers on the Leaflet map */}
        <ClusterLayer
          videos={videos}
          selectedVideo={selectedVideo}
          onVideoClick={onVideoClick}
        />
      </MapContainer>
    </div>
  )
}
