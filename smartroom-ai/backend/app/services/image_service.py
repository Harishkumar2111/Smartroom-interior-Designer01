import os
import uuid
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFont
from fastapi import UploadFile, HTTPException, status
from app.config import settings

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False


def sanitize_filename(filename: str) -> str:
    """Sanitizes filename and prevents directory traversal."""
    cleaned = Path(filename).name
    ext = Path(cleaned).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    safe_name = f"{uuid.uuid4().hex}{ext}"
    return safe_name


def validate_image_file(file: UploadFile, content: bytes) -> Tuple[int, int, str]:
    """
    Validates MIME type, file size, and verifies that the file is an actual valid image.
    Returns (width, height, format).
    """
    # 1. File size check
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )
    
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )

    # 2. Content type check
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{content_type}'. Must be JPEG, PNG, or WebP."
        )

    # 3. Deep image integrity validation with PIL
    try:
        from io import BytesIO
        img = Image.open(BytesIO(content))
        img.verify()  # Verifies image structure
        
        # Re-open to read dimensions and format (verify() closes buffer state)
        img = Image.open(BytesIO(content))
        width, height = img.size
        img_format = (img.format or "JPEG").upper()
        return width, height, img_format
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file failed image verification: {str(e)}"
        )


def save_uploaded_image(file: UploadFile, content: bytes) -> dict:
    """Validates, sanitizes, saves image to uploads directory, and returns metadata."""
    width, height, img_format = validate_image_file(file, content)
    unique_filename = sanitize_filename(file.filename or "upload.jpg")
    target_path = settings.UPLOAD_DIR / unique_filename
    
    with open(target_path, "wb") as f:
        f.write(content)
        
    image_id = Path(unique_filename).stem

    return {
        "image_id": image_id,
        "filename": unique_filename,
        "preview_url": f"/api/uploads/{unique_filename}",
        "file_size_bytes": len(content),
        "format": img_format,
        "width": width,
        "height": height,
    }


def get_image_path(filename_or_id: str) -> Optional[Path]:
    """Finds image file by ID or filename, preventing path traversal."""
    cleaned = Path(filename_or_id).name
    
    # Try exact filename in uploads
    exact_path = settings.UPLOAD_DIR / cleaned
    if exact_path.is_file():
        return exact_path
        
    # Try searching for image_id with allowed extensions
    for ext in settings.ALLOWED_EXTENSIONS:
        candidate = settings.UPLOAD_DIR / f"{cleaned}{ext}"
        if candidate.is_file():
            return candidate

    return None


def parse_hex_color(hex_str: str, default: Tuple[int, int, int]) -> Tuple[int, int, int]:
    """Safely converts hex string to (r, g, b) tuple."""
    clean = (hex_str or "").lstrip("#")
    if len(clean) == 6:
        try:
            return int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16)
        except ValueError:
            pass
    return default


def generate_conceptual_color_overlay(
    source_image_path: Path,
    wall_color_hex: str = "#E8ECE9",
    ceiling_color_hex: str = "#FFFFFF",
    accent_color_hex: Optional[str] = None,
    style_name: str = "Modern",
    output_filename: Optional[str] = None
) -> Tuple[Path, str]:
    """
    Creates an architectural room color design preview.
    Applies gradient ceiling lighting, wall color tints, and accent contrast using Pillow.
    """
    if not output_filename:
        output_filename = f"conceptual_{uuid.uuid4().hex}.jpg"
    
    out_path = settings.GENERATED_DIR / output_filename
    
    with Image.open(source_image_path) as img:
        img = img.convert("RGBA")
        width, height = img.size
        
        # 1. Parse Colors
        wall_rgb = parse_hex_color(wall_color_hex, (232, 236, 233))
        ceiling_rgb = parse_hex_color(ceiling_color_hex, (255, 255, 255))
        accent_rgb = parse_hex_color(accent_color_hex, wall_rgb) if accent_color_hex else None

        # 2. Main Wall Color Tint Layer
        wall_tint = Image.new("RGBA", (width, height), (*wall_rgb, 55))
        composited = Image.alpha_composite(img, wall_tint)
        
        # 3. Ceiling Gradient Highlight (Top 25% of room)
        ceiling_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        c_draw = ImageDraw.Draw(ceiling_overlay)
        ceiling_h = int(height * 0.28)
        
        for y in range(ceiling_h):
            # Fade out from top of ceiling to bottom
            alpha = int(45 * (1 - (y / ceiling_h)))
            c_draw.line([(0, y), (width, y)], fill=(*ceiling_rgb, alpha))
            
        composited = Image.alpha_composite(composited, ceiling_overlay)

        # 4. Optional Accent Wall Tone (subtle warm vignette)
        if accent_rgb:
            accent_layer = Image.new("RGBA", (width, height), (*accent_rgb, 25))
            composited = Image.alpha_composite(composited, accent_layer)
        
        # 5. Enhanced Contrast & Architectural Crispness
        final_img = composited.convert("RGB")
        enhancer = ImageEnhance.Contrast(final_img)
        final_img = enhancer.enhance(1.08)
        
        # 6. Architectural Specification Banner
        draw = ImageDraw.Draw(final_img)
        banner_height = 42
        draw.rectangle(
            [(0, final_img.height - banner_height), (final_img.width, final_img.height)],
            fill=(18, 22, 31)
        )
        watermark_text = f"SmartRoom AI Studio — Style: {style_name} | Wall: {wall_color_hex} | Ceiling: {ceiling_color_hex}"
        draw.text((16, final_img.height - 28), watermark_text, fill=(240, 240, 240))
        
        final_img.save(out_path, format="JPEG", quality=92)
        
    preview_url = f"/api/generated/{output_filename}"
    return out_path, preview_url

