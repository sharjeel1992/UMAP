import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import './MapView.css'

// Fix default icon URLs broken by Vite's asset hashing
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const VIDEO_ICON = L.divIcon({
  className: 'video-pin',
  html: `<div class="video-pin__inner">▶</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
})

const VIDEO_ICON_SELECTED = L.divIcon({
  className: 'video-pin video-pin--selected',
  html: `<div class="video-pin__inner">▶</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
})

function getBounds(map) {
  const b = map.getBounds()
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  }
}

/** Inner component that fires onBoundsChange when map moves */
function BoundsWatcher({ onBoundsChange, flyTo }) {
  const map = useMap()
  // Use a ref so the moveend handler always calls the latest onBoundsChange
  // even though useMapEvents captures the closure only once at mount
  const cbRef = useRef(onBoundsChange)
  cbRef.current = onBoundsChange

  // Fire initial bounds once the map is ready
  useEffect(() => {
    cbRef.current(getBounds(map))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useMapEvents({
    moveend() {
      cbRef.current(getBounds(map))
    },
  })

  useEffect(() => {
    if (!flyTo) return
    if (flyTo.bbox) {
      map.fitBounds([
        [flyTo.bbox.south, flyTo.bbox.west],
        [flyTo.bbox.north, flyTo.bbox.east],
      ], { maxZoom: 14 })
    } else {
      map.setView([flyTo.lat, flyTo.lng], flyTo.zoom || 13)
    }
  }, [flyTo, map])

  return null
}

/** Manages the marker cluster layer imperatively */
function ClusterLayer({ videos, selectedVideo, onVideoClick }) {
  const map = useMap()
  const clusterRef = useRef(null)
  const markersRef = useRef(new Map()) // videoId → marker

  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
      })
      map.addLayer(clusterRef.current)
    }
  }, [map])

  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return

    // Clear old markers
    cluster.clearLayers()
    markersRef.current.clear()

    videos.forEach(video => {
      if (video.lat == null || video.lng == null) return
      const isSelected = selectedVideo?.id === video.id
      const icon = isSelected ? VIDEO_ICON_SELECTED : VIDEO_ICON
      const marker = L.marker([video.lat, video.lng], { icon })
      marker.bindTooltip(video.title, { direction: 'top', offset: [0, -30] })
      marker.on('click', () => onVideoClick(video))
      markersRef.current.set(video.id, marker)
      cluster.addLayer(marker)
    })
  }, [videos, selectedVideo, onVideoClick, map])

  // Update icon for selected without re-rendering all markers
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(selectedVideo?.id === id ? VIDEO_ICON_SELECTED : VIDEO_ICON)
    })
  }, [selectedVideo])

  return null
}

const DEFAULT_CENTER = [47.6062, -122.3321] // Seattle fallback
const DEFAULT_ZOOM = 11
const MIN_ZOOM = 2

export default function MapView({
  videos,
  selectedVideo,
  onVideoClick,
  onBoundsChange,
  flyTo,
  showSearchAreaButton,
  onSearchArea,
  searchAreaLoading,
}) {
  return (
    <div className="map-wrapper">
      {showSearchAreaButton && (
        <button
          type="button"
          className="search-area-button"
          onClick={onSearchArea}
          disabled={searchAreaLoading}
        >
          {searchAreaLoading ? 'Loading…' : 'Search this area'}
        </button>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        className="leaflet-map"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <BoundsWatcher onBoundsChange={onBoundsChange} flyTo={flyTo} />
        <ClusterLayer
          videos={videos}
          selectedVideo={selectedVideo}
          onVideoClick={onVideoClick}
        />
      </MapContainer>
    </div>
  )
}
