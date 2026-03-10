const cache = new Map();
const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;

const getCache = (key) => {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const isExpired = Date.now() > entry.expiresAt;

  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
};

const setCache = (key, data, ttlMs = DEFAULT_CACHE_TTL_MS) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
};

module.exports = { getCache, setCache };
