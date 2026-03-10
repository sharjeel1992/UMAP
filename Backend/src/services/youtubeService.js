const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

const ALLOWED_SORTS = new Set(["date", "relevance", "viewCount"]);

class YoutubeApiError extends Error {
  constructor(message, { statusCode = 502, code = "YOUTUBE_API_ERROR" } = {}) {
    super(message);
    this.name = "YoutubeApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const parseErrorBody = async (response) => {
  try {
    return await response.json();
  } catch {
    try {
      const text = await response.text();
      if (!text) return null;

      try {
        return JSON.parse(text);
      } catch {
        return { rawText: text };
      }
    } catch {
      return null;
    }
  }
};

const isQuotaExceededError = (payload) => {
  const reasons = payload?.error?.errors
    ?.map((entry) => entry?.reason)
    .filter(Boolean);
  return Array.isArray(reasons) && reasons.includes("quotaExceeded");
};

const throwYoutubeResponseError = async (response, operationLabel) => {
  const payload = await parseErrorBody(response);

  if (response.status === 403 && isQuotaExceededError(payload)) {
    throw new YoutubeApiError(
      "YouTube API daily quota has been reached. Please try again after midnight Pacific Time.",
      { statusCode: 429, code: "YOUTUBE_QUOTA_EXCEEDED" }
    );
  }

  const upstreamMessage =
    payload?.error?.message ||
    payload?.rawText ||
    `Request failed with status ${response.status}`;

  throw new YoutubeApiError(`${operationLabel} failed: ${upstreamMessage}`);
};

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
    await throwYoutubeResponseError(searchResponse, "YouTube search");
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
    await throwYoutubeResponseError(videosResponse, "YouTube videos.list");
  }

  const videosData = await videosResponse.json();
  return videosData.items || [];
};

module.exports = { searchVideosByLocation };
