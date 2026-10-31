from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from app.config import settings
from app.schemas import DesignGenerationRequest, DesignGenerationResponse
from app.services.ai_service import generate_design_image

router = APIRouter(tags=["AI Design Generation"])

@router.post("/generate-design", response_model=DesignGenerationResponse)
async def generate_design(req: DesignGenerationRequest):
    """
    AI Design Generation & Redesign Conceptual Preview.
    Accepts room image reference, style, wall color, and preferences.
    If external image diffusion API is configured, generates AI visual redesign.
    If not configured, generates high-fidelity non-AI architectural color overlay preview
    via Pillow and transparently reports honest configuration status.
    """
    try:
        response = generate_design_image(
            image_id_or_url=req.image_id or req.image_url,
            style=req.style,
            wall_color=req.wall_color or "#E8ECE9",
            ceiling_color=req.ceiling_color or "#FFFFFF",
            accent_color=req.accent_color,
            ceiling_preferences=req.ceiling_preferences or "Minimal Cove with Warm LED",
            furniture_preferences=req.furniture_preferences,
            prompt_instructions=req.prompt_instructions
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Design generation failed: {str(e)}"
        )

@router.get("/generated/{filename}")
async def get_generated_image(filename: str):
    """Safely serves generated design images with path traversal prevention."""
    cleaned = Path(filename).name
    file_path = settings.GENERATED_DIR / cleaned
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated design image not found")
    
    ext = file_path.suffix.lower()
    mime = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
    return FileResponse(file_path, media_type=mime)
