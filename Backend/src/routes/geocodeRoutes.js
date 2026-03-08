const express = require("express");
const router = express.Router();
const { getGeocode } = require("../controllers/geocodeController");

router.get("/geocode", getGeocode);

module.exports = router;