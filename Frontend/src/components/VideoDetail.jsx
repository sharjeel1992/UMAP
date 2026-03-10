import './VideoDetail.css'

function formatViews(n) {
  if (!n && n !== 0) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`
  return `${n} views`
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function VideoDetail({ video, onClose }) {
  if (!video) return null

  return (
    <div className="video-detail" role="dialog" aria-label="Video details">
      <button className="video-detail__close" onClick={onClose} aria-label="Close">×</button>

      <div className="video-detail__preview">
        <img src={video.thumbnail} alt={video.title} />
        <a
          className="video-detail__play-btn"
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Watch on YouTube"
        >
          ▶
        </a>
      </div>

      <div className="video-detail__body">
        <h2 className="video-detail__title">{video.title}</h2>
        <p className="video-detail__channel">{video.channelTitle}</p>
        <p className="video-detail__meta">
          {formatViews(video.viewCount)}
          {video.viewCount && video.publishedAt ? ' · ' : ''}
          {formatDate(video.publishedAt)}
        </p>
        {video.description && (
          <p className="video-detail__description">{video.description}</p>
        )}
        <a
          className="video-detail__watch-btn"
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ Watch on YouTube
        </a>
      </div>
    </div>
  )
}
