# AI Smart Room Interior Designer — Python Backend

A complete, production-ready backend for the **AI Smart Room Interior Designer** built with **FastAPI**, **SQLAlchemy**, **Pillow**, **OpenCV**, **ReportLab**, and **Google Gemini Vision AI**.

---

## 1. Technology Stack

- **Python**: 3.11+ / 3.14 compatible
- **Web Framework**: FastAPI (High-performance async REST API)
- **Dev Server**: Uvicorn with auto-reload
- **Request Validation & Data Parsing**: Pydantic v2
- **Image Processing**: Pillow & OpenCV (`opencv-python-headless`)
- **Database & ORM**: SQLite with SQLAlchemy 2.0
- **File Uploads**: `python-multipart` with MIME and byte-level validation
- **PDF Report Generation**: ReportLab
- **Vision AI**: Google Gemini Vision multimodal API integration with deterministic architectural fallback
- **Automated Testing**: Pytest with FastAPI TestClient

---

## 2. Project Architecture

```text
smartroom-ai/
├── .env.example                # Template for environment configuration
├── .gitignore                  # Ignores .venv, .env, DBs, caches, uploads
├── README.md                   # Complete architectural and usage guide
├── frontend/                   # Modern interior studio web application
│   ├── index.html              # HTML5 responsive user interface
│   ├── style.css               # Modern glassmorphism dark-mode styles
│   └── script.js               # Frontend fetch controller connecting to FastAPI
└── backend/
    ├── requirements.txt        # Python backend dependencies
    ├── uploads/                # Directory for validated room photos (.gitkeep)
    ├── generated/              # Directory for AI / conceptual overlays (.gitkeep)
    ├── tests/
    │   ├── conftest.py         # Pytest configuration
    │   └── test_api.py         # Complete automated test suite
    └── app/
        ├── __init__.py
        ├── main.py             # FastAPI entrypoint, CORS, static mounts
        ├── config.py           # Settings management via python-dotenv
        ├── database.py         # SQLAlchemy engine and session dependency
        ├── models.py           # Project DB model with JSON serialization
        ├── schemas.py          # Pydantic request/response schemas
        ├── routes/
        │   ├── __init__.py
        │   ├── upload.py             # POST /api/upload & safe serving
        │   ├── room_analysis.py      # POST /api/analyze-room & /api/measure-room
        │   ├── recommendations.py    # POST /api/recommendations
        │   ├── furniture.py          # GET /api/furniture & /api/furniture/{id}
        │   ├── projects.py           # Full CRUD /api/projects & PDF report
        │   └── design_generation.py  # POST /api/generate-design
        └── services/
            ├── __init__.py
            ├── image_service.py           # Image validation, security, Pillow tint
            ├── measurement_service.py     # Area, volume, paint liters, unit conversion
            ├── recommendation_service.py  # Rich rule-based multi-style engine
            ├── ai_service.py              # Gemini Vision client & honest fallback
            └── report_service.py          # Professional PDF report generator
```

---

## 3. Quickstart & Installation (Windows PowerShell)

Open PowerShell in the `smartroom-ai` project directory:

```powershell
# 1. Create Python virtual environment
python -m venv .venv

# 2. Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Upgrade pip
python -m pip install --upgrade pip

# 4. Install backend dependencies
python -m pip install -r backend\requirements.txt

# 5. Configure environment variables (copy from template)
Copy-Item .env.example backend\.env
```

---

## 4. Running the Development Server

Start the Uvicorn development server from the `smartroom-ai` root:

```powershell
python -m uvicorn app.main --reload --app-dir backend
```

- **Application Web UI**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **API Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and services status health check |
| `POST` | `/api/upload` | Validates & uploads room images (JPEG, PNG, WebP) |
| `GET` | `/api/uploads/{filename}` | Safely serves uploaded room images |
| `POST` | `/api/measure-room` | Calculates floor, net wall, volume, & paint in feet/meters/inches |
| `POST` | `/api/analyze-room` | Multimodal room photo critique, palette, & lighting plan |
| `POST` | `/api/recommendations` | Personalized finishes, false ceilings, lighting, & furniture |
| `GET` | `/api/furniture` | Filterable furniture catalog (category, price, style, search) |
| `GET` | `/api/furniture/{id}` | Detailed specifications for a single furniture item |
| `POST` | `/api/generate-design` | Conceptual color overlay & diffusion design generation |
| `GET` | `/api/generated/{filename}` | Serves generated design preview images |
| `POST` | `/api/projects` | Creates and persists an interior design project |
| `GET` | `/api/projects` | Lists all saved room design projects |
| `GET` | `/api/projects/{id}` | Retrieves full details of a saved project |
| `PUT` | `/api/projects/{id}` | Updates room dimensions, style, or furniture selections |
| `DELETE` | `/api/projects/{id}` | Deletes a project from SQLite database |
| `GET` | `/api/projects/{id}/report` | Generates & downloads a formatted PDF report |

---

## 6. Running Automated Tests

Run the full pytest suite with verbose output:

```powershell
python -m pytest backend/tests/test_api.py -v
```

All 12 automated tests verify:
- Health check status
- Valid image uploads and rejection of invalid / corrupt files
- Geometric measurements and unit conversions
- Rule-based multi-style recommendation generation
- Furniture catalog filtering and search
- AI room analysis and transparent fallback behavior
- Conceptual redesign rendering
- Full SQLite project lifecycle (Create, Read, Update, Delete)
- ReportLab PDF generation with binary verification
- CORS preflight headers
