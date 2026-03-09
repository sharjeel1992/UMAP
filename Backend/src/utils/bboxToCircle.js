const toRadians = (deg) => (deg * Math.PI) / 180;

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const bboxToCircle = ({ north, south, east, west }) => {
  const centerLat = (north + south) / 2;
  const centerLng = (east + west) / 2;

  const corners = [
    { lat: north, lng: west },
    { lat: north, lng: east },
    { lat: south, lng: west },
    { lat: south, lng: east },
  ];

  let radiusKm = 0;

  for (const corner of corners) {
    const distance = haversineKm(centerLat, centerLng, corner.lat, corner.lng);
    radiusKm = Math.max(radiusKm, distance);
  }

  radiusKm = Math.min(Math.max(radiusKm * 1.1, 1), 1000);

  return {
    centerLat,
    centerLng,
    radiusKm,
  };
};

module.exports = { bboxToCircle };