# SmartRoom AI — Interior Designer

SmartRoom AI is a full-stack interior-design assistant that turns a room photo and a few design preferences into practical room analysis, measurements, furniture recommendations, colour concepts, saved projects, and downloadable PDF reports.

The application combines a responsive browser interface with a FastAPI backend, SQLite persistence, computer-vision utilities, and optional Google Gemini Vision integration. It also remains useful without external AI keys by providing deterministic fallback analysis and conceptual previews.

## Highlights

- **Single Room Upload & Centralized Image Pipeline**: Upload once in AI Room Analyzer; seamlessly transfers to Paint & Ceiling Studio and Furniture Catalog.
- **Paint & Ceiling Studio**: Precision wall coloring, accent walls, and false ceiling designs with real-time transfer to the Furniture Catalog.
- **Office Furniture Catalog**: Expanded catalog featuring Modern office desks, Wooden desks, Computer desks with drawers, Laptops, Office workstations, Single office chairs, Ergonomic mesh chairs, and Adjustable computer chairs.
- **Interactive Live Room Workspace**: Place furniture directly onto the final painted room image with boundary collision clamping preventing pieces from spilling outside the room walls.
- **Dynamic Sizing & Rotation**: Interactive corner drag handles, quick enlargement/shrinking (+/- 10%), 90-degree rotations, and precise dimension inputs.
- **Multi-Level Undo, Redo & Reset**: Full history snapshots allow reversing movements, resizing, rotations, additions, and removals, plus safe reset preserving room backgrounds.
- **Save & Reopen Complete Designs**: Persist final painted designs with complete furniture arrangements both locally and to SQLite; reopen saved designs with one click.
- **Professional PDF Download Only**: Direct generation of comprehensive interior design PDF reports containing the high-res final room preview, color scheme, placed furniture schedule, and estimated investment.
- **Robust Fallbacks & Offline Capability**: Works reliably with FastAPI backend or frontend-only deployment.

## Technology

| Layer | Technologies |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript, responsive UI |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| Data | SQLite, SQLAlchemy 2.0 |
| Vision and images | Google Gemini Vision (optional), Pillow, OpenCV |
| Reports | ReportLab |
| Testing | Pytest, FastAPI TestClient |

## Repository layout

```text
.
├── README.md
├── smartroom-ai/
│   ├── frontend/                 # Browser UI and paint studio
│   ├── backend/
│   │   ├── app/
│   │   │   ├── routes/            # Upload, analysis, furniture, projects, generation APIs
│   │   │   └── services/          # Image, AI, measurement, recommendation, and report logic
│   │   ├── tests/                 # Automated API tests
│   │   └── requirements.txt
│   ├── .env.example
│   └── .gitignore
├── generated/                    # Existing conceptual assets
└── uploads/                      # Existing sample room assets
```

## Quick start on Windows

Open PowerShell in the `smartroom-ai` directory:

```powershell
cd smartroom-ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
Copy-Item .env.example .env
```

Edit `.env` if you want external AI services. The application works in fallback mode when `GEMINI_API_KEY` and `IMAGE_GEN_API_KEY` are not set.

Start the development server:

```powershell
python -m uvicorn app.main:app --reload --app-dir backend
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) for the web application.

Useful development URLs:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

## Configuration

Copy `smartroom-ai/.env.example` to `smartroom-ai/.env` and configure values as needed:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy database URL; SQLite is the default |
| `UPLOAD_DIR` | Storage directory for validated room images |
| `GENERATED_DIR` | Storage directory for conceptual previews |
| `MAX_UPLOAD_SIZE_MB` | Maximum accepted upload size |
| `GEMINI_API_KEY` | Optional Google Gemini Vision key |
| `IMAGE_GEN_API_KEY` | Optional image-generation provider key |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

Never commit `.env` or real API keys. The project ignore rules exclude environment files, virtual environments, databases, caches, and runtime-generated files.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service and dependency status |
| `POST` | `/api/upload` | Validate and upload a room image |
| `POST` | `/api/analyze-room` | Analyse a room image |
| `POST` | `/api/measure-room` | Calculate room measurements |
| `POST` | `/api/recommendations` | Generate design recommendations |
| `GET` | `/api/furniture` | Search and filter furniture |
| `POST` | `/api/generate-design` | Create a conceptual preview |
| `GET/POST/PUT/DELETE` | `/api/projects` | Manage saved projects |
| `GET` | `/api/projects/{id}/report` | Download a project PDF report |

The full interactive API reference is available at `/docs` while the server is running.

## Tests

Run the backend test suite from `smartroom-ai`:

```powershell
python -m pytest backend\tests -v
```

The tests cover health checks, image validation, measurements, recommendations, furniture filtering, AI fallback behaviour, design generation, project CRUD, PDF generation, and CORS handling.

## Security and data handling

- Uploaded files are validated by MIME type, file content, and configured size limits.
- Filenames are generated by the application rather than trusted from user input.
- API keys are read from environment variables and are not exposed in frontend code.
- Local SQLite, uploaded files, generated previews, and development artifacts are runtime data; keep production storage and credentials outside source control.

## Project status

SmartRoom AI is a development-ready prototype suitable for demonstrating AI-assisted interior planning. Before production deployment, add authentication and authorization, object storage, database migrations, rate limiting, structured monitoring, and a production web server configuration.

## License

No license has been declared yet. Add a `LICENSE` file before distributing or reusing this project publicly.
