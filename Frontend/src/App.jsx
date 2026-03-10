import { useState, useCallback, useRef } from 'react'
import SearchBar from './components/SearchBar.jsx'
import FilterPanel from './components/FilterPanel.jsx'
import MapView from './components/MapView.jsx'
import VideoList from './components/VideoList.jsx'
import VideoDetail from './components/VideoDetail.jsx'
import LocationModal from './components/LocationModal.jsx'
import { geocodePlace, fetchVideos } from './api/client.js'
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
  const [hasBounds, setHasBounds] = useState(false)
  const [needsSearchArea, setNeedsSearchArea] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

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
      setNeedsSearchArea(true)
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
      if (controller.signal.aborted) return false
      setVideos(vids)
      setVideoCount(vids.length)
      setSelectedVideo(prev => (prev && vids.find(v => v.id === prev.id)) || null)
      return true
    } catch (err) {
      if (controller.signal.aborted) return false

      const isQuotaExceeded = err?.status === 429 || err?.code === 'YOUTUBE_QUOTA_EXCEEDED'
      if (isQuotaExceeded) {
        setVideoError(
          err.message ||
          'YouTube API daily quota has been reached. Please try again after midnight Pacific Time.'
        )
        return false
      }

      setVideoError(err.message || 'Failed to load videos.')
      setVideos([])
      setVideoCount(0)
      return false
    } finally {
      if (!controller.signal.aborted) setVideoLoading(false)
    }
  }, [])

  const handleFiltersChange = useCallback(nextFilters => {
    setFilters(nextFilters)
    setNeedsSearchArea(true)
  }, [])

  // Map bounds changed
  const handleBoundsChange = useCallback(bounds => {
    boundsRef.current = bounds
    setHasBounds(true)
    setNeedsSearchArea(true)
  }, [])

  const handleSearchArea = useCallback(async () => {
    if (!boundsRef.current || videoLoading) return

    setNeedsSearchArea(false)
    const didSucceed = await loadVideos(boundsRef.current, filters)
    setHasLoadedOnce(true)

    if (!didSucceed) {
      setNeedsSearchArea(true)
    }
  }, [filters, loadVideos, videoLoading])

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
        <button type="button" className="app-logo" aria-label="UMAP">
          <span className="app-logo__icon" aria-hidden="true" />
          <span className="app-logo__text">UMAP</span>
        </button>
        <SearchBar onSearch={handleSearch} loading={searchLoading} />
        {searchError && <span className="topbar-error">{searchError}</span>}
      </header>

      {/* Content */}
      <div className="app-content">
        {/* Left sidebar */}
        <div className="app-sidebar">
          <FilterPanel
            filters={filters}
            onChange={handleFiltersChange}
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
            showSearchAreaButton={hasBounds && (!hasLoadedOnce || needsSearchArea)}
            onSearchArea={handleSearchArea}
            searchAreaLoading={videoLoading}
          />
          {selectedVideo && (
            <VideoDetail video={selectedVideo} onClose={handleCloseDetail} />
          )}
        </div>
      </div>
    </div>
  )
}
