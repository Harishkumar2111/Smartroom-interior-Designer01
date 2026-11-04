import sys
import logging
from pathlib import Path

# Add backend directory to sys.path so 'import app...' works in all run modes
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.schemas import HealthResponse
from app.routes import (
    upload,
    room_analysis,
    recommendations,
    furniture,
    projects,
    design_generation
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smartroom.backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down backend services...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent AI Smart Room Interior Designer REST API backend built with FastAPI, SQLAlchemy, and Computer Vision.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Confirms backend is operational and reports service statuses.
    """
    ai_vision_status = "configured" if settings.GEMINI_API_KEY else "fallback_mode (no API key)"
    image_gen_status = "configured" if settings.IMAGE_GEN_API_KEY else "fallback_mode (conceptual preview only)"

    return HealthResponse(
        status="ok",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        services={
            "database": "connected (SQLite SQLAlchemy)",
            "ai_vision": ai_vision_status,
            "image_generation": image_gen_status,
            "image_processing": "available (Pillow & OpenCV)",
            "pdf_engine": "available (ReportLab)"
        }
    )

# Backward-compatible proxy for existing Three.js frontend
@app.post("/api/gemini", tags=["Gemini Proxy"])
async def gemini_proxy(body: dict):
    """Secure proxy for Gemini API requests matching the frontend payload format."""
    import requests
    from fastapi import HTTPException
    
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on backend")
    
    model = body.get("model", "gemini-2.5-flash")
    payload = body.get("payload")
    if not payload:
        raise HTTPException(status_code=400, detail="payload is required")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    resp = requests.post(url, json=payload, timeout=30)
    return resp.json()

# Include API Routers
app.include_router(upload.router, prefix=settings.API_PREFIX)
app.include_router(room_analysis.router, prefix=settings.API_PREFIX)
app.include_router(recommendations.router, prefix=settings.API_PREFIX)
app.include_router(furniture.router, prefix=settings.API_PREFIX)
app.include_router(projects.router, prefix=settings.API_PREFIX)
app.include_router(design_generation.router, prefix=settings.API_PREFIX)

# Static file mounts for development uploads and generated previews
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/generated", StaticFiles(directory=str(settings.GENERATED_DIR)), name="generated")

# Serve frontend if frontend directory exists
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.is_dir() and (frontend_dir / "index.html").is_file():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
    logger.info("Mounted frontend static files from %s", frontend_dir)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, app_dir=str(backend_dir))

