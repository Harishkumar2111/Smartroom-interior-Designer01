import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file reliably from root and backend
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")


class Settings:
    PROJECT_NAME: str = "Smart Room AI Interior Designer"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    
    # Storage paths
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(BACKEND_DIR / "uploads")))
    GENERATED_DIR: Path = Path(os.getenv("GENERATED_DIR", str(BACKEND_DIR / "generated")))
    
    # Upload constraints
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "15"))
    ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp"}
    ALLOWED_MIME_TYPES: set[str] = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/pjpeg",
    }
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'smartroom.db'}")
    
    # External AI Services
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GIMINI_API", os.getenv("AI_API_KEY", "")))
    IMAGE_GEN_API_KEY: str = os.getenv("IMAGE_GEN_API_KEY", "")
    
    # CORS
    _origins_env = os.getenv("ALLOWED_ORIGINS", "")
    if _origins_env:
        ALLOWED_ORIGINS: list[str] = [orig.strip() for orig in _origins_env.split(",") if orig.strip()]
    else:
        ALLOWED_ORIGINS: list[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "null",
        ]

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.GENERATED_DIR.mkdir(parents=True, exist_ok=True)
