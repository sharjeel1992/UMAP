const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const statusRoutes = require("./routes/statusRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");
const videoRoutes = require("./routes/videoRoutes");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// routes
app.use("/", healthRoutes);
app.use("/api", statusRoutes);
app.use("/api", geocodeRoutes);
app.use("/api", videoRoutes);

module.exports = app;