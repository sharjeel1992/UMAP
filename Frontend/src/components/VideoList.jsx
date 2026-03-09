import VideoCard from './VideoCard.jsx'
import './VideoList.css'

export default function VideoList({ videos, selectedVideo, onVideoClick, loading, error }) {
  if (error) {
    return (
      <div className="video-list video-list--state">
        <p className="state-icon">⚠</p>
        <p className="state-text">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="video-list video-list--state">
        <p className="state-icon loading-spinner">⟳</p>
        <p className="state-text">Loading videos…</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="video-list video-list--state">
        <p className="state-icon">🎬</p>
        <p className="state-text">No videos found here.<br />Try panning the map or changing filters.</p>
      </div>
    )
  }

  return (
    <div className="video-list">
      {videos.map(video => (
        <VideoCard
          key={video.id}
          video={video}
          selected={selectedVideo?.id === video.id}
          onClick={onVideoClick}
        />
      ))}
    </div>
  )
}
