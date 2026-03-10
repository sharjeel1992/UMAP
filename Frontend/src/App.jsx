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

const INITIAL_FILTERS = {
  q: '',
  sort: 'relevance',
  timeRange: '',
  publishedAfter: undefined,
  publishedBefore: undefined,
}

export default function App() {
  const [showLocationModal, setShowLocationModal] = useState(true)
  const [flyTo, setFlyTo] = useState(null)

  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState(null)
  const [videoCount, setVideoCount] = useState(null)

  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const debouncedFilters = useDebounce(filters, 500)

  const boundsRef = useRef(null)
  const fetchControllerRef = useRef(null)

  // ── Location modal ──────────────────────────────────────────────
  function handleUseLocation() {
    setShowLocationModal(false)
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

  // ── Place search ─────────────────────────────────────────────────
  async function handleSearch(query) {
    setSearchError(null)
    setSearchLoading(true)
    try {
      const { place } = await geocodePlace(query)
      setFlyTo({ lat: place.lat, lng: place.lng, bbox: place.bbox })
    } catch (err) {
      setSearchError(err.message || 'Place not found.')
    } finally {
      setSearchLoading(false)
    }
  }

  // ── Video fetch ───────────────────────────────────────────────────
  const loadVideos = useCallback(async (bounds, activeFilters) => {
    if (!bounds) return

    // Cancel any in-flight request
    if (fetchControllerRef.current) fetchControllerRef.current.abort()
    const controller = new AbortController()
    fetchControllerRef.current = controller

    setVideoLoading(true)
    setVideoError(null)

    try {
      const { videos: vids } = await fetchVideos({
        ...bounds,
        q: activeFilters.q || undefined,
        sort: activeFilters.sort || undefined,
        publishedAfter: activeFilters.publishedAfter,
        publishedBefore: activeFilters.publishedBefore,
      })
      if (controller.signal.aborted) return
      setVideos(vids)
      setVideoCount(vids.length)
      setSelectedVideo(prev => (prev && vids.find(v => v.id === prev.id)) || null)
    } catch (err) {
      if (controller.signal.aborted) return
      setVideoError(err.message || 'Failed to load videos.')
      setVideos([])
      setVideoCount(0)
    } finally {
      if (!controller.signal.aborted) setVideoLoading(false)
    }
  }, [])

  // Trigger video fetch when debounced filters change (if we have bounds)
  useEffect(() => {
    if (boundsRef.current) {
      loadVideos(boundsRef.current, debouncedFilters)
    }
  }, [debouncedFilters, loadVideos])

  // Map bounds changed
  const handleBoundsChange = useCallback(bounds => {
    boundsRef.current = bounds
    loadVideos(bounds, debouncedFilters)
  }, [debouncedFilters, loadVideos])

  // ── Video selection ───────────────────────────────────────────────
  function handleVideoClick(video) {
    setSelectedVideo(prev => (prev?.id === video.id ? null : video))
  }

  function handleCloseDetail() {
    setSelectedVideo(null)
  }

  return (
    <div className="app">
      {showLocationModal && (
        <LocationModal onUseLocation={handleUseLocation} onSkip={handleSkipLocation} />
      )}

      {/* Top bar */}
      <header className="app-topbar">
        <div className="app-logo">UMAP</div>
        <SearchBar onSearch={handleSearch} loading={searchLoading} />
        {searchError && <span className="topbar-error">{searchError}</span>}
      </header>

      {/* Content */}
      <div className="app-content">
        {/* Left sidebar */}
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

        {/* Map area */}
        <div className="app-map">
          <MapView
            videos={videos}
            selectedVideo={selectedVideo}
            onVideoClick={handleVideoClick}
            onBoundsChange={handleBoundsChange}
            flyTo={flyTo}
          />
          {selectedVideo && (
            <VideoDetail video={selectedVideo} onClose={handleCloseDetail} />
          )}
        </div>
      </div>
    </div>
  )
}
