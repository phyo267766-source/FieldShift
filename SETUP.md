# FieldShift — Setup & Run Guide

**Adapting Farms with NASA Data** | NASA Space Apps Challenge 2026

---

## Quick Start

### 1. Backend Setup

```bash
cd fieldshift/backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
python -m pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Meteomatics credentials (optional)

# Run the server
python app.py
```

The backend runs at `http://127.0.0.1:5001` by default. Set `PORT` before `python app.py` to override it.

### 2. Frontend Setup

```bash
cd fieldshift

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs at `http://localhost:5173`.

---

## Environment Variables (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `FLASK_ENV` | No | `development` or `production` |
| `FLASK_DEBUG` | No | `true` or `false` (never `true` in production) |
| `SECRET_KEY` | Yes | Change from default for production |
| `DATABASE_PATH` | No | SQLite DB path (default: `database/fieldshift.db`) |
| `CORS_ORIGINS` | No | Allowed frontend URLs |
| `CLIMATE_CACHE_HOURS` | No | How long to cache NASA POWER data (default: 24) |
| `METEOMATICS_USERNAME` | No* | Meteomatics API username |
| `METEOMATICS_PASSWORD` | No* | Meteomatics API password |
| `METEOMATICS_TIMEOUT` | No | API timeout in seconds (default: 20) |

*Meteomatics credentials are optional. Without them, the app runs in offline/sample mode for current weather. NASA POWER historical data works without any API key.

---

## Features

### Core Features
- **Multi-farm management** — Add, edit, delete, and switch between farms
- **Myanmar location system** — Complete administrative hierarchy with GPS coordinates
- **Interactive map** — Leaflet-based farm visualization

### Weather & Climate
- **Current weather** (Meteomatics API) — Temperature, humidity, precipitation, wind
- **Historical climate** (NASA POWER API) — Free, no key required
- **Year-to-year comparison** — Compare 2021–2026 climate data
- **Detailed analysis** — Custom date ranges, statistical summaries

### Crop Intelligence
- **Smart crop rotation** — Rule-based recommendations with confidence levels
- **Pest & disease info** — Common threats for Myanmar crops
- **Missing data disclosure** — Clear about what information affects recommendations

### Data Transparency
- All data sources clearly labeled (NASA POWER, Meteomatics, Sample Data)
- Confidence levels on recommendations
- Incomplete 2026 data flagged as partial
- No fabricated observations

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/farms` | GET/POST | List or create farms |
| `/api/farms/<id>` | GET/PUT/DELETE | Farm CRUD |
| `/api/climate/farm/<id>` | GET | Climate data for farm |
| `/api/climate/history/<id>` | GET | Historical climate data |
| `/api/climate/summary/<id>` | GET | Climate summary with risks |
| `/api/weather/status` | GET | Check Meteomatics config |
| `/api/weather/current` | GET | Current weather (lat, lon) |
| `/api/weather/forecast/hourly` | GET | Hourly forecast |
| `/api/weather/forecast/daily` | GET | Daily forecast |
| `/api/rotation/generate` | POST | Generate rotation plan |
| `/api/rotation/compare` | POST | Compare rotation plans |
| `/api/rotation/selection` | GET/POST | Retrieve or save a comparison plan selection for exact farm conditions |
| `/api/reports` | POST | Generate a farm report from saved farm and NASA POWER data |
| `/api/reports/farm/<id>` | GET | List saved reports for a farm |
| `/api/reports/<id>` | GET | Retrieve a saved report |
| `/api/reports/<id>/pdf` | GET | Download a generated report as PDF |

---

## Technology Stack

- **Frontend**: React 18 + Vite 6, Tailwind CSS 3, Recharts, Leaflet
- **Backend**: Python Flask 3.1, SQLite, Flask-CORS
- **APIs**: NASA POWER (free), Meteomatics (paid, optional)
- **Languages**: English + Myanmar ( မြန်မာ)

---

## Security Notes

- API credentials stored in `.env` (never in frontend code)
- Meteomatics calls proxied through Flask backend
- Input validation on all API endpoints
- CORS restricted to configured origins
- Flask debug mode disabled in production
- Parameterized SQL queries (no SQL injection)

---

## Troubleshooting

**pip blocked by Application Control (Windows)**
→ Use `python -m pip install -r requirements.txt` or run as Administrator

**"ModuleNotFoundError: No module named 'flask'"**
→ Make sure you're in the virtual environment (`source venv/bin/activate`)

**Backend not connecting**
→ Ensure you're in `fieldshift/backend/` directory when running `python app.py`

**Weather shows "not configured"**
→ Add Meteomatics credentials to `.env`. The app works without them (sample data mode).

**npm install fails**
→ Ensure Node.js 18+ is installed. Try `npm install --legacy-peer-deps` if needed.
