const searchPlace = async (query) => {
    const trimmed = query?.trim();
  
    if (!trimmed) {
      throw new Error("Query is required");
    }
  
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
  
    const response = await fetch(url, {
      headers: {
        "User-Agent": "UMAP/1.0 (student project)",
        Accept: "application/json",
      },
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch geocode data");
    }
  
    const results = await response.json();
  
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }
  
    const place = results[0];
  
    return {
      displayName: place.display_name,
      lat: Number(place.lat),
      lng: Number(place.lon),
      bbox: {
        south: Number(place.boundingbox[0]),
        north: Number(place.boundingbox[1]),
        west: Number(place.boundingbox[2]),
        east: Number(place.boundingbox[3]),
      },
    };
  };
  
  module.exports = { searchPlace };