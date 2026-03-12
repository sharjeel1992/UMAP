// VideoCard — compact, clickable card shown in the sidebar video list.
// Displays the video thumbnail, title, channel name, view count, and publish date.
import './VideoCard.css'

/**
 * Formats a raw view count into a human-readable string with M / K suffixes.
 * Returns an empty string for null / undefined values so callers don't need
 * to guard against missing data.
 *
 * @param {number|null|undefined} n - Raw view count
 * @returns {string} e.g. "1.2M views", "340K views", "892 views", or ""
 */
function formatViews(n) {
  if (!n && n !== 0) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`
  return `${n} views`
}

/**
 * Formats an ISO 8601 date string into a short locale-aware date.
 * Returns an empty string when the date is missing or invalid.
 *
 * @param {string|null|undefined} iso - ISO 8601 date string
 * @returns {string} e.g. "Mar 5, 2025" (locale-dependent)
 */
function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

/**
 * @param {object}  props
 * @param {object}  props.video    - Video data object (id, title, thumbnail, channelTitle, viewCount, publishedAt)
 * @param {boolean} props.selected - When true, the card is styled as active / selected
 * @param {function} props.onClick - Called with the video object when the card is activated
 */
export default function VideoCard({ video, selected, onClick }) {
  return (
    // The div acts as an interactive button.
    // role="button" + tabIndex + onKeyDown ensures keyboard accessibility
    // (Enter key fires the same action as a click).
    <div
      className={`video-card${selected ? ' video-card--selected' : ''}`}
      onClick={() => onClick(video)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(video)}
      aria-label={`Open video: ${video.title}`}
    >
      {/* Thumbnail section — lazy-loaded image with an overlaid play icon */}
      <div className="video-card__thumb">
        {/* alt="" intentional: thumbnail is decorative; title is in the card body */}
        <img src={video.thumbnail} alt="" loading="lazy" />
        <span className="video-card__play">▶</span>
      </div>

      {/* Text info section */}
      <div className="video-card__info">
        <p className="video-card__title">{video.title}</p>
        <p className="video-card__channel">{video.channelTitle}</p>
        {/* Metadata line — separator dot is only rendered when both values are present */}
        <p className="video-card__meta">
          {formatViews(video.viewCount)}
          {video.viewCount && video.publishedAt ? ' · ' : ''}
          {formatDate(video.publishedAt)}
        </p>
      </div>
    </div>
  )
}
