import './FilterPanel.css'

const TIME_RANGES = [
  { label: 'Any time', value: '' },
  { label: 'Past week', value: 'week' },
  { label: 'Past month', value: 'month' },
  { label: 'Past year', value: 'year' },
]

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Most recent', value: 'date' },
  { label: 'Most viewed', value: 'viewCount' },
]

function timeRangeToDate(range) {
  if (!range) return { publishedAfter: undefined, publishedBefore: undefined }
  const now = new Date()
  const after = new Date(now)
  if (range === 'week') after.setDate(after.getDate() - 7)
  else if (range === 'month') after.setMonth(after.getMonth() - 1)
  else if (range === 'year') after.setFullYear(after.getFullYear() - 1)
  return { publishedAfter: after.toISOString(), publishedBefore: undefined }
}

export default function FilterPanel({ filters, onChange, videoCount, loading }) {
  function update(key, value) {
    if (key === 'timeRange') {
      const dates = timeRangeToDate(value)
      onChange({ ...filters, timeRange: value, ...dates })
    } else {
      onChange({ ...filters, [key]: value })
    }
  }

  function reset() {
    onChange({ q: '', sort: 'relevance', timeRange: '', publishedAfter: undefined, publishedBefore: undefined })
  }

  return (
    <aside className="filter-panel">
      <div className="filter-panel__header">
        <span className="filter-panel__title">Filters</span>
        <button className="filter-reset" onClick={reset} type="button">Reset</button>
      </div>

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

      <div className="filter-panel__results">
        {loading ? (
          <span className="results-loading">Loading videos…</span>
        ) : (
          <span className="results-count">
            {videoCount === null ? 'Pan or search to load videos' : `${videoCount} video${videoCount !== 1 ? 's' : ''} found`}
          </span>
        )}
      </div>
    </aside>
  )
}
