import { useState } from 'react'
import './SearchBar.css'

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) onSearch(trimmed)
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
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
      <button
        type="submit"
        className="search-submit"
        disabled={loading || !query.trim()}
        aria-label="Search"
      >
        {loading ? '…' : 'Q'}
      </button>
    </form>
  )
}
