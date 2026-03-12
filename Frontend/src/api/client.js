// API client module — all communication with the backend goes through here.
// The base URL is read from the VITE_API_BASE_URL environment variable so it
// can be configured per-environment (dev / staging / prod) without code changes.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

/**
 * Internal helper that performs a GET request and parses the JSON response.
 * Throws a descriptive Error if the server returns a non-2xx status so callers
 * can catch it and show a user-friendly message.
 *
 * @param {string} path - URL path + query string (e.g. "/api/geocode?q=Seattle")
 * @returns {Promise<object>} Parsed JSON response body
 */
async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  const data = await res.json()
  if (!res.ok) {
    // Prefer the server's error message when available, fall back to HTTP status
    throw new Error(data?.error?.message || `Request failed: ${res.status}`)
  }
  return data
}

/**
 * Geocode a place name to geographic coordinates.
 * Used by the SearchBar to fly the map to a typed location.
 *
 * @param {string} q - Human-readable place name (e.g. "Tokyo", "Central Park")
 * @returns {Promise<{ place: { displayName: string, lat: number, lng: number, bbox: object } }>}
 */
export async function geocodePlace(q) {
  return apiFetch(`/api/geocode?q=${encodeURIComponent(q)}`)
}

/**
 * Fetch YouTube videos whose location falls within a map bounding box.
 * Optional filter parameters narrow the results by keyword, date, or sort order.
 *
 * @param {object} params
 * @param {number} params.north  - Northern latitude bound
 * @param {number} params.south  - Southern latitude bound
 * @param {number} params.east   - Eastern longitude bound
 * @param {number} params.west   - Western longitude bound
 * @param {string} [params.q]            - Keyword / topic filter
 * @param {string} [params.sort]         - Sort order: "relevance" | "date" | "viewCount"
 * @param {string} [params.publishedAfter]  - ISO 8601 date — return videos published after this date
 * @param {string} [params.publishedBefore] - ISO 8601 date — return videos published before this date
 * @returns {Promise<{ videos: object[], meta: object }>}
 */
export async function fetchVideos({ north, south, east, west, q, sort, publishedAfter, publishedBefore }) {
  // Build query string from required bounds params
  const params = new URLSearchParams({ north, south, east, west })
  // Append optional filter params only when they have a value
  if (q) params.set('q', q)
  if (sort) params.set('sort', sort)
  if (publishedAfter) params.set('publishedAfter', publishedAfter)
  if (publishedBefore) params.set('publishedBefore', publishedBefore)
  return apiFetch(`/api/videos?${params}`)
}
