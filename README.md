# UMAP — YouTube Map Explorer

Discover location-based YouTube videos on an interactive map. Search any city, pan/zoom to explore, and filter by topic, recency, and sort order.

**Stack:** React + Vite (frontend) · Node.js/Express (backend) · Leaflet + OpenStreetMap · YouTube Data API v3 · Nominatim Geocoding

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A YouTube Data API v3 key ([get one here](https://console.cloud.google.com/))

---

## 1. Clone the repository

```bash
git clone https://github.com/sharjeel1992/UMAP.git
cd UMAP
```

---

## 2. Set up the Backend

```bash
cd Backend
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your YouTube API key:

```
PORT=3001
CORS_ORIGIN=http://localhost:5173
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Start the backend server

```bash
npm run dev
```

The backend will be running at **http://localhost:3001**.

You can verify it's working by visiting http://localhost:3001/health — you should see `{"ok":true}`.

---

## 3. Set up the Frontend

Open a **new terminal** and navigate to the Frontend folder:

```bash
cd Frontend
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

```bash
cp .env.example .env
```

The default `.env` already points to the backend:

```
VITE_API_BASE_URL=http://localhost:3001
```

No changes needed unless your backend runs on a different port.

### Start the frontend dev server

```bash
npm run dev
```

The app will be running at **http://localhost:5173**. Open that URL in your browser.

---

## 4. Using the app

| Feature | How to use |
|---|---|
| **Enable location** | Click "Use My Location" on the popup to center the map on your current location, or click "Skip for now" to start from Seattle |
| **Search a place** | Type a city or place name in the top search bar and press Enter or click the search button |
| **Browse videos** | Pan and zoom the map — video pins load automatically for the visible area |
| **Cluster markers** | Click a numbered cluster bubble to zoom in and reveal individual video pins |
| **Open a video** | Click any pin on the map or any card in the left sidebar |
| **Filter results** | Use the left sidebar to filter by keyword/topic, time range (past week/month/year), and sort order |
| **Watch on YouTube** | Click "Watch on YouTube" in the video detail panel to open the video in a new tab |
| **Reset filters** | Click the "Reset" button at the top of the sidebar |

---

## 5. API endpoints (backend reference)

| Endpoint | Description |
|---|---|
| `GET /health` | Health check — returns `{"ok":true}` |
| `GET /api/status` | Status check — returns `{"api":"up"}` |
| `GET /api/geocode?q=Tokyo` | Geocode a place name → returns `lat`, `lng`, and bounding box |
| `GET /api/videos?north=&south=&east=&west=` | Fetch YouTube videos for a map bounding box. Optional: `q`, `sort`, `publishedAfter`, `publishedBefore` |

---

## 6. Project structure

```
UMAP/
├── Backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── controllers/      # geocodeController, videoController
│   │   ├── routes/           # geocodeRoutes, videoRoutes, healthRoutes
│   │   ├── services/         # geocodeService, youtubeService, cacheService
│   │   └── utils/            # bboxToCircle
│   ├── .env.example
│   └── package.json
│
└── Frontend/
    ├── src/
    │   ├── App.jsx            # Main layout and state
    │   ├── api/client.js      # geocodePlace(), fetchVideos()
    │   ├── hooks/useDebounce.js
    │   └── components/
    │       ├── SearchBar      # Top search input
    │       ├── FilterPanel    # Keyword, time range, sort filters
    │       ├── VideoList      # Scrollable video card list
    │       ├── VideoCard      # Individual video row
    │       ├── VideoDetail    # Overlay detail panel
    │       ├── MapView        # Leaflet map with pins and clusters
    │       └── LocationModal  # First-load geolocation prompt
    ├── .env.example
    └── package.json
```

---

## Notes

- The YouTube Data API free tier allows **10,000 units/day**. Each video search costs ~100 units, so avoid refreshing excessively.
- Only videos that have location coordinates tagged by the uploader will appear as pins. This is typically 5–15% of videos.
- The map uses OpenStreetMap tiles (free, no API key required).
- Geocoding uses Nominatim (free, no API key required). It is rate-limited to 1 request/second — the app handles this automatically.
