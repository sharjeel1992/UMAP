const test = require('node:test');
const assert = require('node:assert/strict');

const { bboxToCircle } = require('../src/utils/bboxToCircle');

test('bboxToCircle computes center and positive radius', () => {
  const result = bboxToCircle({
    north: 40,
    south: 39,
    east: -73,
    west: -74,
  });

  assert.equal(result.centerLat, 39.5);
  assert.equal(result.centerLng, -73.5);
  assert.ok(result.radiusKm >= 1);
  assert.ok(result.radiusKm <= 1000);
});

test('bboxToCircle clamps very large bbox radius to 1000 km', () => {
  const result = bboxToCircle({
    north: 90,
    south: -90,
    east: 180,
    west: -180,
  });

  assert.equal(result.radiusKm, 1000);
});
