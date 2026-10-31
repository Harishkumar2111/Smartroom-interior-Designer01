from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from app.config import settings
from app.schemas import UploadResponse
from app.services.image_service import save_uploaded_image, get_image_path

router = APIRouter(tags=["Image Upload"])

@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_room_image(file: UploadFile = File(...)):
    """
    Accepts JPG, JPEG, PNG, and WebP images.
    Validates file type and size.
    Saves image with safe unique filename and returns image identifier and preview URL.
    """
    try:
        content = await file.read()
        saved = save_uploaded_image(file, content)
        return UploadResponse(**saved)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/uploads/{filename}")
async def get_uploaded_image(filename: str):
    """Safely serves uploaded images and prevents directory traversal."""
    path = get_image_path(filename)
    if not path or not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    
    # Return file response
    ext = path.suffix.lower()
    mime = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
    return FileResponse(path, media_type=mime)
