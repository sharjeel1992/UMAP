const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

const ALLOWED_SORTS = new Set(["date", "relevance", "viewCount"]);

const searchVideosByLocation = async ({
  centerLat,
  centerLng,
  radiusKm,
  q,
  sort,
  publishedAfter,
  publishedBefore,
}) => {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY in environment");
  }

  const order = ALLOWED_SORTS.has(sort) ? sort : "relevance";

  const searchUrl = new URL(SEARCH_URL);
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "25");
  searchUrl.searchParams.set("location", `${centerLat},${centerLng}`);
  searchUrl.searchParams.set("locationRadius", `${radiusKm.toFixed(2)}km`);
  searchUrl.searchParams.set("order", order);

  if (q && q.trim()) {
    searchUrl.searchParams.set("q", q.trim());
  }

  if (publishedAfter) {
    searchUrl.searchParams.set("publishedAfter", publishedAfter);
  }

  if (publishedBefore) {
    searchUrl.searchParams.set("publishedBefore", publishedBefore);
  }

  const searchResponse = await fetch(searchUrl);

  if (!searchResponse.ok) {
    const text = await searchResponse.text();
    throw new Error(`YouTube search failed: ${text}`);
  }

  const searchData = await searchResponse.json();
  const items = searchData.items || [];

  const ids = items.map((item) => item.id?.videoId).filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  const videosUrl = new URL(VIDEOS_URL);
  videosUrl.searchParams.set("key", apiKey);
  videosUrl.searchParams.set("part", "snippet,statistics,recordingDetails");
  videosUrl.searchParams.set("id", ids.join(","));

  const videosResponse = await fetch(videosUrl);

  if (!videosResponse.ok) {
    const text = await videosResponse.text();
    throw new Error(`YouTube videos.list failed: ${text}`);
  }

  const videosData = await videosResponse.json();
  return videosData.items || [];
};

module.exports = { searchVideosByLocation };