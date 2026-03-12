// App — root component and central state manager for the UMAP application.
//
// Responsibilities:
//  - Owns all shared state: videos, selected video, filters, map flyTo target,
//    location modal visibility, and loading / error flags.
//  - Fetches videos from the backend whenever the map bounds or filters change.
//  - Geocodes place-name searches and instructs the map to fly to the result.
//  - Passes data and callbacks down to child components; no child manages
//    cross-component state directly.
import { useState, useCallback, useRef, useEffect } from 'react'
import SearchBar from './components/SearchBar.jsx'
import FilterPanel from './components/FilterPanel.jsx'
import MapView from './components/MapView.jsx'
import VideoList from './components/VideoList.jsx'
import VideoDetail from './components/VideoDetail.jsx'
import LocationModal from './components/LocationModal.jsx'
import { geocodePlace, fetchVideos } from './api/client.js'
import { useDebounce } from './hooks/useDebounce.js'
import './App.css'

// Default filter values used on first render and when the user hits "Reset"
const INITIAL_FILTERS = {
  q: '',              // Keyword / topic search term
  sort: 'relevance',  // YouTube sort order
  timeRange: '',      // Human-readable preset ('week' | 'month' | 'year' | '')
  publishedAfter: undefined,   // ISO 8601 — derived from timeRange
  publishedBefore: undefined,  // ISO 8601 — unused for now (always open-ended)
}

export default function App() {
  // ── Modal / map navigation state ────────────────────────────────────────────
  // Show the location permission modal on first load
  const [showLocationModal, setShowLocationModal] = useState(true)
  // Imperative signal telling MapView to animate to a new position.
  // Set to { lat, lng, zoom? } or { lat, lng, bbox } then cleared by MapView.
  const [flyTo, setFlyTo] = useState(null)

  // ── Video data state ─────────────────────────────────────────────────────────
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)  // Video whose detail panel is open
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState(null)
  const [videoCount, setVideoCount] = useState(null)  // null = not yet loaded (no bounds yet)

  // ── Geocoding (place search) state ───────────────────────────────────────────
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  // Debounced copy of filters — video fetch only fires 500 ms after the user
  // stops typing, preventing a request on every keystroke
  const debouncedFilters = useDebounce(filters, 500)

  // ── Refs ─────────────────────────────────────────────────────────────────────
  // Stores the latest map bounds so the filter-change effect can re-use them
  // without needing bounds in its dependency array (which would cause stale closures)
  const boundsRef = useRef(null)
  // Holds the AbortController for the in-flight video fetch, allowing it to be
  // cancelled if the bounds or filters change before the response arrives
  const fetchControllerRef = useRef(null)

  // ── Location modal handlers ──────────────────────────────────────────────────

  function handleUseLocation() {
    setShowLocationModal(false)
    // Request the browser's Geolocation API.
    // On success: fly the map to the user's coordinates at zoom 13.
    // On failure (permission denied, timeout, etc.): silently fall through to
    //   the default Seattle view — no error is shown since the user can still
    //   search manually.
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setFlyTo({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 13 })
      },
      () => {
        // Permission denied or error — stay on default (Seattle)
      }
    )
  }

  function handleSkipLocation() {
    setShowLocationModal(false)
  }

  // ── Place search handler ─────────────────────────────────────────────────────

  async function handleSearch(query) {
    setSearchError(null)
    setSearchLoading(true)
    try {
      // Geocode the typed place name via the backend (which proxies to Nominatim)
      const { place } = await geocodePlace(query)
      // Pass a flyTo target; if the API returned a bounding box use fitBounds,
      // otherwise fall back to a single point + default zoom
      setFlyTo({ lat: place.lat, lng: place.lng, bbox: place.bbox })
    } catch (err) {
      setSearchError(err.message || 'Place not found.')
    } finally {
      setSearchLoading(false)
    }
  }

  // ── Video fetch ──────────────────────────────────────────────────────────────

  /**
   * Fetches videos for the given map bounds + filters and updates state.
   * Wrapped in useCallback so its stable identity can be listed as a dependency
   * in effects without triggering infinite loops.
   */
  const loadVideos = useCallback(async (bounds, activeFilters) => {
    if (!bounds) return

    // Abort any previous in-flight request before starting a new one.
    // This prevents stale responses from overwriting newer results.
    if (fetchControllerRef.current) fetchControllerRef.current.abort()
    const controller = new AbortController()
    fetchControllerRef.current = controller

    setVideoLoading(true)
    setVideoError(null)

    try {
      const { videos: vids } = await fetchVideos({
        ...bounds,
        q: activeFilters.q || undefined,          // Omit empty strings from the query
        sort: activeFilters.sort || undefined,
        publishedAfter: activeFilters.publishedAfter,
        publishedBefore: activeFilters.publishedBefore,
      })

      // If this request was aborted while awaiting, discard the result entirely
      if (controller.signal.aborted) return

      setVideos(vids)
      setVideoCount(vids.length)
      // Keep the currently selected video selected if it still appears in the new
      // result set; otherwise clear the detail panel
      setSelectedVideo(prev => (prev && vids.find(v => v.id === prev.id)) || null)
    } catch (err) {
      if (controller.signal.aborted) return
      setVideoError(err.message || 'Failed to load videos.')
      setVideos([])
      setVideoCount(0)
    } finally {
      // Only clear the loading flag if this request wasn't superseded
      if (!controller.signal.aborted) setVideoLoading(false)
    }
  }, [])

  // Re-fetch when debounced filters change, using the most recent bounds
  useEffect(() => {
    if (boundsRef.current) {
      loadVideos(boundsRef.current, debouncedFilters)
    }
  }, [debouncedFilters, loadVideos])

  // Re-fetch whenever the user pans or zooms the map
  const handleBoundsChange = useCallback(bounds => {
    boundsRef.current = bounds  // Cache bounds for filter-change re-fetches
    loadVideos(bounds, debouncedFilters)
  }, [debouncedFilters, loadVideos])

  // ── Video selection handlers ─────────────────────────────────────────────────

  // Toggle: clicking the already-selected video deselects it
  function handleVideoClick(video) {
    setSelectedVideo(prev => (prev?.id === video.id ? null : video))
  }

  function handleCloseDetail() {
    setSelectedVideo(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      {/* Location permission modal — only visible on first load */}
      {showLocationModal && (
        <LocationModal onUseLocation={handleUseLocation} onSkip={handleSkipLocation} />
      )}

      {/* Top bar — logo + search input */}
      <header className="app-topbar">
        <div className="app-logo">UMAP</div>
        <SearchBar onSearch={handleSearch} loading={searchLoading} />
        {/* Inline error shown next to the search bar on geocoding failure */}
        {searchError && <span className="topbar-error">{searchError}</span>}
      </header>

      {/* Main content area — sidebar on the left, map on the right */}
      <div className="app-content">
        {/* Left sidebar: filter controls + scrollable video list */}
        <div className="app-sidebar">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            videoCount={videoCount}
            loading={videoLoading}
          />
          <VideoList
            videos={videos}
            selectedVideo={selectedVideo}
            onVideoClick={handleVideoClick}
            loading={videoLoading}
            error={videoError}
          />
        </div>

        {/* Map area: the Leaflet map + the floating detail panel */}
        <div className="app-map">
          <MapView
            videos={videos}
            selectedVideo={selectedVideo}
            onVideoClick={handleVideoClick}
            onBoundsChange={handleBoundsChange}
            flyTo={flyTo}
          />
          {/* VideoDetail is overlaid on the map when a video is selected */}
          {selectedVideo && (
            <VideoDetail video={selectedVideo} onClose={handleCloseDetail} />
          )}
        </div>
      </div>
    </div>
  )
}
