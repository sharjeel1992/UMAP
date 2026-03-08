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
