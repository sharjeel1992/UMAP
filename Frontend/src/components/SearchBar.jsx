// SearchBar — lets the user type a city or place name and navigate the map there.
// On submit the trimmed query is passed to the parent via `onSearch`; the parent
// is responsible for geocoding and flying the map to the result.
import { useState } from 'react'
import './SearchBar.css'

/**
 * @param {object}   props
 * @param {function} props.onSearch - Called with the trimmed query string on submit
 * @param {boolean}  props.loading  - When true, the input and submit button are disabled
 */
export default function SearchBar({ onSearch, loading }) {
  // Local state for the controlled text input
  const [query, setQuery] = useState('')

  // Prevent default form submission (page reload) and forward the trimmed query
  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    // Ignore empty / whitespace-only submissions
    if (trimmed) onSearch(trimmed)
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      {/* Decorative location icon — hidden from screen readers */}
      <span className="search-icon" aria-hidden="true">⊙</span>

      <input
        type="text"
        className="search-input"
        placeholder="Search city or place…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Search city or place"
        disabled={loading}
      />

      {/* Clear button — only rendered when there is text to clear */}
      {query && (
        <button
          type="button"
          className="search-clear"
          onClick={() => setQuery('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}

      {/* Submit button — disabled while a search is in flight or the field is empty */}
      <button
        type="submit"
        className="search-submit"
        disabled={loading || !query.trim()}
        aria-label="Search"
      >
        {/* Show an ellipsis spinner while geocoding is in progress */}
        {loading ? '…' : 'Q'}
      </button>
    </form>
  )
}
