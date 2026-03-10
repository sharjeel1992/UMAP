const test = require('node:test');
const assert = require('node:assert/strict');

const { getVideos } = require('../src/controllers/videoController');
const { setCache } = require('../src/services/cacheService.js');

const createMockRes = () => ({
  statusCode: 200,
  payload: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  },
});

test('getVideos returns 400 when bbox params are missing', async () => {
  const req = { query: {} };
  const res = createMockRes();

  await getVideos(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(
    res.payload.error.message,
    /north, south, east, and west are required numeric/
  );
});

test('getVideos returns 400 for invalid sort', async () => {
  const req = {
    query: {
      north: '40',
      south: '39',
      east: '-73',
      west: '-74',
      sort: 'popular',
    },
  };
  const res = createMockRes();

  await getVideos(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error.message, /sort must be one of/);
});

test('getVideos returns cached response when cache key matches', async () => {
  const query = {
    north: '40',
    south: '39',
    east: '-73',
    west: '-74',
    q: 'cache-hit-case',
  };

  const cacheKey = JSON.stringify({
    north: 40,
    south: 39,
    east: -73,
    west: -74,
    q: 'cache-hit-case',
    sort: '',
    publishedAfter: '',
    publishedBefore: '',
  });

  const cachedData = {
    videos: [{ id: 'abc123' }],
    meta: {
      count: 1,
      cached: false,
      query: {
        north: 40,
        south: 39,
        east: -73,
        west: -74,
        q: 'cache-hit-case',
        sort: null,
        publishedAfter: null,
        publishedBefore: null,
      },
    },
  };

  setCache(cacheKey, cachedData, 60_000);

  const req = { query };
  const res = createMockRes();

  await getVideos(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.meta.cached, true);
  assert.equal(res.payload.videos.length, 1);
  assert.equal(res.payload.videos[0].id, 'abc123');
});

test('getVideos cache key rounds bbox coordinates to reduce duplicate API calls', async () => {
  const query = {
    north: '40.004',
    south: '39.004',
    east: '-73.004',
    west: '-74.004',
    q: ' rounded-hit-case ',
  };

  const cacheKey = JSON.stringify({
    north: 40,
    south: 39,
    east: -73,
    west: -74,
    q: 'rounded-hit-case',
    sort: '',
    publishedAfter: '',
    publishedBefore: '',
  });

  const cachedData = {
    videos: [{ id: 'rounded123' }],
    meta: {
      count: 1,
      cached: false,
      query: {
        north: 40,
        south: 39,
        east: -73,
        west: -74,
        q: 'rounded-hit-case',
        sort: null,
        publishedAfter: null,
        publishedBefore: null,
      },
    },
  };

  setCache(cacheKey, cachedData, 60_000);

  const req = { query };
  const res = createMockRes();

  await getVideos(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.meta.cached, true);
  assert.equal(res.payload.videos.length, 1);
  assert.equal(res.payload.videos[0].id, 'rounded123');
});

test('getVideos returns 429 with friendly code when YouTube quota is exceeded', async () => {
  const previousApiKey = process.env.YOUTUBE_API_KEY;
  const previousFetch = global.fetch;

  process.env.YOUTUBE_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: false,
    status: 403,
    json: async () => ({
      error: {
        message: 'quota exceeded',
        errors: [{ reason: 'quotaExceeded' }],
      },
    }),
    text: async () => '{"error":{"message":"quota exceeded"}}',
  });

  const req = {
    query: {
      north: '40',
      south: '39',
      east: '-73',
      west: '-74',
      q: 'quota-hit-case',
    },
  };
  const res = createMockRes();

  try {
    await getVideos(req, res);
  } finally {
    global.fetch = previousFetch;

    if (previousApiKey === undefined) {
      delete process.env.YOUTUBE_API_KEY;
    } else {
      process.env.YOUTUBE_API_KEY = previousApiKey;
    }
  }

  assert.equal(res.statusCode, 429);
  assert.equal(res.payload.error.code, 'YOUTUBE_QUOTA_EXCEEDED');
  assert.match(res.payload.error.message, /quota/i);
});

test('getVideos returns 500 with clear message when YOUTUBE_API_KEY is missing', async () => {
  const previous = process.env.YOUTUBE_API_KEY;
  process.env.YOUTUBE_API_KEY = '';

  const req = {
    query: {
      north: '40',
      south: '39',
      east: '-73',
      west: '-74',
      q: 'no-cache-no-key-case',
    },
  };
  const res = createMockRes();

  await getVideos(req, res);

  if (previous === undefined) {
    delete process.env.YOUTUBE_API_KEY;
  } else {
    process.env.YOUTUBE_API_KEY = previous;
  }

  assert.equal(res.statusCode, 500);
  assert.match(res.payload.error.message, /Missing YOUTUBE_API_KEY/);
});
