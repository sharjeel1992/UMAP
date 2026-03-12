// VideoList — scrollable sidebar list of VideoCard items.
// Handles the three possible non-list states (error, loading, empty) before
// rendering the actual list so the happy path stays clean.
import VideoCard from './VideoCard.jsx'
import './VideoList.css'

/**
 * @param {object}      props
 * @param {object[]}    props.videos        - Array of video objects to display
 * @param {object|null} props.selectedVideo - Currently selected video (or null)
 * @param {function}    props.onVideoClick  - Called with the video object when a card is clicked
 * @param {boolean}     props.loading       - Whether a fetch is in progress
 * @param {string|null} props.error         - Error message to display, or null
 */
export default function VideoList({ videos, selectedVideo, onVideoClick, loading, error }) {
  // Error state — show a warning icon and the error message from the API
  if (error) {
    return (
      <div className="video-list video-list--state">
        <p className="state-icon">⚠</p>
        <p className="state-text">{error}</p>
      </div>
    )
  }

  // Loading state — show a spinner while the fetch is in flight
  if (loading) {
    return (
      <div className="video-list video-list--state">
        <p className="state-icon loading-spinner">⟳</p>
        <p className="state-text">Loading videos…</p>
      </div>
    )
  }

  // Empty state — no videos in the current map view, prompt the user to pan / filter
  if (videos.length === 0) {
    return (
      <div className="video-list video-list--state">
        <p className="state-icon">🎬</p>
        <p className="state-text">No videos found here.<br />Try panning the map or changing filters.</p>
      </div>
    )
  }

  // Happy path — render one VideoCard per video
  return (
    <div className="video-list">
      {videos.map(video => (
        <VideoCard
          key={video.id}          // Stable key prevents unnecessary DOM reconciliation
          video={video}
          selected={selectedVideo?.id === video.id}  // Highlight the active video
          onClick={onVideoClick}
        />
      ))}
    </div>
  )
}
