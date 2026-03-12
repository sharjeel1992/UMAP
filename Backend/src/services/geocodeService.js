const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 7000;

class GeocodeServiceError extends Error {
  constructor(
    message,
    { statusCode = 502, code = "GEOCODE_SERVICE_ERROR" } = {}
  ) {
    super(message);
    this.name = "GeocodeServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const parseUpstreamError = async (response) => {
  try {
    return await response.json();
  } catch {
    try {
      const text = await response.text();
      return text ? { rawText: text } : null;
    } catch {
      return null;
    }
  }
};

const searchPlace = async (query) => {
  const trimmed = query?.trim();

  if (!trimmed) {
    throw new GeocodeServiceError("Query is required", {
      statusCode: 400,
      code: "GEOCODE_INVALID_QUERY",
    });
  }

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "UMAP/1.0 (student project)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new GeocodeServiceError(
        "Geocoding request timed out. Please try again.",
        { statusCode: 504, code: "GEOCODE_TIMEOUT" }
      );
    }

    throw new GeocodeServiceError("Failed to fetch geocode data", {
      statusCode: 502,
      code: "GEOCODE_NETWORK_ERROR",
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const upstreamError = await parseUpstreamError(response);

    if (response.status === 429) {
      throw new GeocodeServiceError(
        "Geocoding service rate limit reached. Please wait a moment and try again.",
        { statusCode: 429, code: "GEOCODE_RATE_LIMIT" }
      );
    }

    const upstreamMessage =
      upstreamError?.error ||
      upstreamError?.message ||
      upstreamError?.rawText ||
      `status ${response.status}`;

    throw new GeocodeServiceError(
      `Failed to fetch geocode data: ${upstreamMessage}`,
      { statusCode: 502, code: "GEOCODE_UPSTREAM_ERROR" }
    );
  }

  let results;
  try {
    results = await response.json();
  } catch {
    throw new GeocodeServiceError(
      "Geocoding service returned invalid JSON data",
      { statusCode: 502, code: "GEOCODE_INVALID_RESPONSE" }
    );
  }

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const place = results[0];
  const lat = toNumber(place.lat);
  const lng = toNumber(place.lon);
  const bboxValues = Array.isArray(place.boundingbox)
    ? place.boundingbox.map(toNumber)
    : [];

  if (
    lat === null ||
    lng === null ||
    bboxValues.length < 4 ||
    bboxValues.some((value) => value === null)
  ) {
    throw new GeocodeServiceError(
      "Geocoding service returned incomplete location data",
      { statusCode: 502, code: "GEOCODE_INVALID_RESPONSE" }
    );
  }

  return {
    displayName: place.display_name || trimmed,
    lat,
    lng,
    bbox: {
      south: bboxValues[0],
      north: bboxValues[1],
      west: bboxValues[2],
      east: bboxValues[3],
    },
  };
};

module.exports = { searchPlace, GeocodeServiceError };
