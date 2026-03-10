const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed: ${res.status}`)
  }
  return data
}

/**
 * Geocode a place name.
 * @param {string} q - Place name
 * @returns {{ place: { displayName, lat, lng, bbox } }}
 */
export async function geocodePlace(q) {
  return apiFetch(`/api/geocode?q=${encodeURIComponent(q)}`)
}

/**
 * Fetch videos for a map bounding box with optional filters.
 * @param {{ north, south, east, west, q?, sort?, publishedAfter?, publishedBefore? }} params
 * @returns {{ videos: Video[], meta: object }}
 */
export async function fetchVideos({ north, south, east, west, q, sort, publishedAfter, publishedBefore }) {
  const params = new URLSearchParams({ north, south, east, west })
  if (q) params.set('q', q)
  if (sort) params.set('sort', sort)
  if (publishedAfter) params.set('publishedAfter', publishedAfter)
  if (publishedBefore) params.set('publishedBefore', publishedBefore)
  return apiFetch(`/api/videos?${params}`)
}
