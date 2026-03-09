const { searchPlace } = require("../services/geocodeService.js");

const getGeocode = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        error: {
          message: "Query parameter 'q' is required",
        },
      });
    }

    const place = await searchPlace(q);

    if (!place) {
      return res.status(404).json({
        error: {
          message: "No matching place found",
        },
      });
    }

    return res.json({ place });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: error.message || "Internal server error",
      },
    });
  }
};

module.exports = { getGeocode };
