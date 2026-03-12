const test = require('node:test');
const assert = require('node:assert/strict');

const { getGeocode } = require('../src/controllers/geocodeController');

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

test('getGeocode returns 400 when q is missing', async () => {
  const req = { query: {} };
  const res = createMockRes();

  await getGeocode(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error.message, /Query parameter 'q' is required/);
});

test('getGeocode returns 400 when q is blank', async () => {
  const req = { query: { q: '   ' } };
  const res = createMockRes();

  await getGeocode(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error.message, /Query parameter 'q' is required/);
});

test('getGeocode returns 429 when geocode provider rate limit is hit', async () => {
  const previousFetch = global.fetch;

  global.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: 'Rate limit exceeded' }),
    text: async () => 'Rate limit exceeded',
  });

  const req = { query: { q: 'Seattle' } };
  const res = createMockRes();

  try {
    await getGeocode(req, res);
  } finally {
    global.fetch = previousFetch;
  }

  assert.equal(res.statusCode, 429);
  assert.equal(res.payload.error.code, 'GEOCODE_RATE_LIMIT');
  assert.match(res.payload.error.message, /rate limit/i);
});

test('getGeocode returns 504 when geocode request times out', async () => {
  const previousFetch = global.fetch;

  global.fetch = async () => {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    throw error;
  };

  const req = { query: { q: 'Seattle' } };
  const res = createMockRes();

  try {
    await getGeocode(req, res);
  } finally {
    global.fetch = previousFetch;
  }

  assert.equal(res.statusCode, 504);
  assert.equal(res.payload.error.code, 'GEOCODE_TIMEOUT');
  assert.match(res.payload.error.message, /timed out/i);
});
