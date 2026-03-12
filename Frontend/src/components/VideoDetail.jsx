// VideoDetail — floating panel that appears over the map when a video is selected.
// Shows an expanded thumbnail, metadata, description, and a link to watch on YouTube.
// Rendered as a dialog for accessibility; closed via the × button or by deselecting
// the video in the list / map.
import './VideoDetail.css'

/**
 * Formats a raw view count with M / K suffix abbreviations.
 * Returns "" when the value is missing.
 *
 * @param {number|null|undefined} n
 * @returns {string}
 */
function formatViews(n) {
  if (!n && n !== 0) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`
  return `${n} views`
}

/**
 * Formats an ISO 8601 date string into a long locale-aware date.
 * Uses 'long' month format (e.g. "March 5, 2025") rather than the
 * abbreviated form used in VideoCard, because there is more space here.
 *
 * @param {string|null|undefined} iso
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

/**
 * @param {object}   props
 * @param {object|null} props.video   - Selected video object; null renders nothing
 * @param {function} props.onClose    - Called when the user clicks the close button
 */
export default function VideoDetail({ video, onClose }) {
  // Guard: render nothing when no video is selected
  if (!video) return null

  return (
    <div className="video-detail" role="dialog" aria-label="Video details">
      {/* Close button — dismisses the panel without deselecting in the list */}
      <button className="video-detail__close" onClick={onClose} aria-label="Close">×</button>

      {/* Thumbnail preview with an overlaid play link that opens YouTube */}
      <div className="video-detail__preview">
        <img src={video.thumbnail} alt={video.title} />
        {/* Opens the video directly on YouTube in a new tab.
            rel="noopener noreferrer" prevents the opened tab from accessing
            window.opener and leaking the referrer URL. */}
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

      {/* Text body — title, channel, metadata, optional description, watch button */}
      <div className="video-detail__body">
        <h2 className="video-detail__title">{video.title}</h2>
        <p className="video-detail__channel">{video.channelTitle}</p>
        {/* Metadata line — separator dot only rendered when both values exist */}
        <p className="video-detail__meta">
          {formatViews(video.viewCount)}
          {video.viewCount && video.publishedAt ? ' · ' : ''}
          {formatDate(video.publishedAt)}
        </p>
        {/* Description is optional — only rendered when the API returns one */}
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
