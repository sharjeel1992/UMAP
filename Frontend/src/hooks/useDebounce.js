import { useState, useEffect } from 'react'

/**
 * Custom hook that returns a debounced version of `value`.
 *
 * The returned value only updates after the specified `delay` has elapsed
 * with no further changes to `value`. This prevents expensive operations
 * (e.g. API calls) from firing on every keystroke while the user is still
 * typing — they only fire once the user pauses.
 *
 * How it works:
 *  1. On every render where `value` or `delay` changed, a new timeout is scheduled.
 *  2. The cleanup function from the previous render clears the old timeout, so only
 *     the most recent timer survives.
 *  3. When the timer fires, the debounced state is updated to the latest `value`.
 *
 * @template T
 * @param {T} value - The value to debounce
 * @param {number} [delay=400] - Debounce delay in milliseconds
 * @returns {T} The debounced value
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    // Schedule the state update after the delay
    const id = setTimeout(() => setDebounced(value), delay)
    // Cancel the previous timeout if value/delay changed before it fired
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
