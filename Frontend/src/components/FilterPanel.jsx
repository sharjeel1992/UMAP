// FilterPanel — sidebar controls for narrowing the video results shown on the map.
// Exposes keyword search, a time-range preset selector, and a sort-order selector.
// All state is lifted to the parent (App); this component is purely presentational.
import './FilterPanel.css'

// Preset time-range options shown in the dropdown.
// The empty string value means "no time filter" (any time).
const TIME_RANGES = [
  { label: 'Any time', value: '' },
  { label: 'Past week', value: 'week' },
  { label: 'Past month', value: 'month' },
  { label: 'Past year', value: 'year' },
]

// Sort order options forwarded to the backend YouTube search.
const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Most recent', value: 'date' },
  { label: 'Most viewed', value: 'viewCount' },
]

/**
 * Converts a human-readable time-range preset into ISO 8601 date strings
 * suitable for the API's `publishedAfter` / `publishedBefore` parameters.
 *
 * @param {string} range - One of: '' | 'week' | 'month' | 'year'
 * @returns {{ publishedAfter: string|undefined, publishedBefore: string|undefined }}
 */
function timeRangeToDate(range) {
  // Empty string means "any time" — clear both date filters
  if (!range) return { publishedAfter: undefined, publishedBefore: undefined }

  const now = new Date()
  const after = new Date(now)

  // Roll the date back by the chosen amount
  if (range === 'week') after.setDate(after.getDate() - 7)
  else if (range === 'month') after.setMonth(after.getMonth() - 1)
  else if (range === 'year') after.setFullYear(after.getFullYear() - 1)

  // publishedBefore is left undefined — we always want videos up to now
  return { publishedAfter: after.toISOString(), publishedBefore: undefined }
}

/**
 * @param {object}        props
 * @param {object}        props.filters     - Current filter state { q, sort, timeRange, publishedAfter, publishedBefore }
 * @param {function}      props.onChange    - Called with the next complete filter object on any change
 * @param {number|null}   props.videoCount  - Number of videos currently loaded; null means not yet loaded
 * @param {boolean}       props.loading     - Whether a video fetch is in progress
 */
export default function FilterPanel({ filters, onChange, videoCount, loading }) {
  /**
   * Merges a single filter key update into the full filter object and calls onChange.
   * Special-cases 'timeRange' to also derive the corresponding ISO date strings.
   */
  function update(key, value) {
    if (key === 'timeRange') {
      // Derive publishedAfter / publishedBefore from the preset label
      const dates = timeRangeToDate(value)
      onChange({ ...filters, timeRange: value, ...dates })
    } else {
      onChange({ ...filters, [key]: value })
    }
  }

  // Restores every filter field to its default value
  function reset() {
    onChange({ q: '', sort: 'relevance', timeRange: '', publishedAfter: undefined, publishedBefore: undefined })
  }

  return (
    <aside className="filter-panel">
      <div className="filter-panel__header">
        <span className="filter-panel__title">Filters</span>
        <button className="filter-reset" onClick={reset} type="button">Reset</button>
      </div>

      {/* Keyword / topic text filter — passed to the backend as the `q` param */}
      <label className="filter-label">
        Topic / Keyword
        <input
          type="text"
          className="filter-input"
          placeholder="e.g. food, hiking…"
          value={filters.q}
          onChange={e => update('q', e.target.value)}
        />
      </label>

      {/* Time-range preset — converted to ISO dates before hitting the API */}
      <label className="filter-label">
        Time range
        <select
          className="filter-select"
          value={filters.timeRange}
          onChange={e => update('timeRange', e.target.value)}
        >
          {TIME_RANGES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      {/* Sort order — maps directly to YouTube Data API sort values */}
      <label className="filter-label">
        Sort by
        <select
          className="filter-select"
          value={filters.sort}
          onChange={e => update('sort', e.target.value)}
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>

      {/* Result count footer — shows a loading indicator or a pluralised count */}
      <div className="filter-panel__results">
        {loading ? (
          <span className="results-loading">Loading videos…</span>
        ) : (
          <span className="results-count">
            {/* null means the initial fetch hasn't run yet (no bounds reported) */}
            {videoCount === null ? 'Pan or search to load videos' : `${videoCount} video${videoCount !== 1 ? 's' : ''} found`}
          </span>
        )}
      </div>
    </aside>
  )
}
