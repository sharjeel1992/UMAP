const { bboxToCircle } = require("../utils/bboxToCircle");
const { searchVideosByLocation } = require("../services/youtubeService.js");
const { getCache, setCache } = require("../services/cacheService.js");

const ALLOWED_SORTS = new Set(["date", "relevance", "viewCount"]);

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isValidLatitude = (value) => value >= -90 && value <= 90;
const isValidLongitude = (value) => value >= -180 && value <= 180;

const isValidDateString = (value) => {
  if (!value) return true;
  const time = new Date(value).getTime();
  return !Number.isNaN(time);
};

const getVideos = async (req, res) => {
  try {
    const north = parseNumber(req.query.north);
    const south = parseNumber(req.query.south);
    const east = parseNumber(req.query.east);
    const west = parseNumber(req.query.west);

    const { q, sort, publishedAfter, publishedBefore } = req.query;

    // Required numeric params
    if (
      north === null ||
      south === null ||
      east === null ||
      west === null
    ) {
      return res.status(400).json({
        error: {
          message:
            "north, south, east, and west are required numeric query parameters",
        },
      });
    }

    // Latitude range checks
    if (!isValidLatitude(north) || !isValidLatitude(south)) {
      return res.status(400).json({
        error: {
          message: "north and south must be valid latitudes between -90 and 90",
        },
      });
    }

    // Longitude range checks
    if (!isValidLongitude(east) || !isValidLongitude(west)) {
      return res.status(400).json({
        error: {
          message: "east and west must be valid longitudes between -180 and 180",
        },
      });
    }

    // Shape checks
    if (south >= north) {
      return res.status(400).json({
        error: {
          message: "Invalid bounding box: south must be less than north",
        },
      });
    }

    if (west >= east) {
      return res.status(400).json({
        error: {
          message:
            "Invalid bounding box: west must be less than east for this MVP",
        },
      });
    }

    if (north === south) {
      return res.status(400).json({
        error: {
          message: "Invalid bounding box: north and south cannot be equal",
        },
      });
    }

    if (east === west) {
      return res.status(400).json({
        error: {
          message: "Invalid bounding box: east and west cannot be equal",
        },
      });
    }

    // Sort validation
    if (sort && !ALLOWED_SORTS.has(sort)) {
      return res.status(400).json({
        error: {
          message: "sort must be one of: date, relevance, viewCount",
        },
      });
    }

    // Date validation
    if (!isValidDateString(publishedAfter)) {
      return res.status(400).json({
        error: {
          message: "publishedAfter must be a valid date string",
        },
      });
    }

    if (!isValidDateString(publishedBefore)) {
      return res.status(400).json({
        error: {
          message: "publishedBefore must be a valid date string",
        },
      });
    }

    if (publishedAfter && publishedBefore) {
      const afterTime = new Date(publishedAfter).getTime();
      const beforeTime = new Date(publishedBefore).getTime();

      if (afterTime >= beforeTime) {
        return res.status(400).json({
          error: {
            message: "publishedAfter must be earlier than publishedBefore",
          },
        });
      }
    }

    const cacheKey = JSON.stringify({
      north,
      south,
      east,
      west,
      q: q || "",
      sort: sort || "",
      publishedAfter: publishedAfter || "",
      publishedBefore: publishedBefore || "",
    });

    const cachedData = getCache(cacheKey);

    if (cachedData) {
      return res.json({
        ...cachedData,
        meta: {
          ...cachedData.meta,
          cached: true,
        },
      });
    }

    const { centerLat, centerLng, radiusKm } = bboxToCircle({
      north,
      south,
      east,
      west,
    });

    const rawVideos = await searchVideosByLocation({
      centerLat,
      centerLng,
      radiusKm,
      q,
      sort,
      publishedAfter,
      publishedBefore,
    });

    const videos = rawVideos
      .filter((video) => video.recordingDetails?.location)
      .map((video) => ({
        id: video.id,
        title: video.snippet?.title || "",
        description: video.snippet?.description || "",
        thumbnail:
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.medium?.url ||
          video.snippet?.thumbnails?.default?.url ||
          "",
        channelTitle: video.snippet?.channelTitle || "",
        publishedAt: video.snippet?.publishedAt || null,
        lat: video.recordingDetails.location.latitude,
        lng: video.recordingDetails.location.longitude,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        viewCount: Number(video.statistics?.viewCount || 0),
      }));

    const responseData = {
      videos,
      meta: {
        count: videos.length,
        cached: false,
        query: {
          north,
          south,
          east,
          west,
          q: q || null,
          sort: sort || null,
          publishedAfter: publishedAfter || null,
          publishedBefore: publishedBefore || null,
        },
      },
    };

    setCache(cacheKey, responseData);

    return res.json(responseData);
  } catch (error) {
    return res.status(500).json({
      error: {
        message: error.message || "Internal server error",
      },
    });
  }
};

module.exports = { getVideos };
