import './VideoCard.css'

function formatViews(n) {
  if (!n && n !== 0) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`
  return `${n} views`
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function VideoCard({ video, selected, onClick }) {
  return (
    <div
      className={`video-card${selected ? ' video-card--selected' : ''}`}
      onClick={() => onClick(video)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(video)}
      aria-label={`Open video: ${video.title}`}
    >
      <div className="video-card__thumb">
        <img src={video.thumbnail} alt="" loading="lazy" />
        <span className="video-card__play">▶</span>
      </div>
      <div className="video-card__info">
        <p className="video-card__title">{video.title}</p>
        <p className="video-card__channel">{video.channelTitle}</p>
        <p className="video-card__meta">
          {formatViews(video.viewCount)}
          {video.viewCount && video.publishedAt ? ' · ' : ''}
          {formatDate(video.publishedAt)}
        </p>
      </div>
    </div>
  )
}
