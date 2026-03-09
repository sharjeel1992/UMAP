const cache = new Map();

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

const setCache = (key, data, ttlMs = 5 * 60 * 1000) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
};

module.exports = { getCache, setCache };