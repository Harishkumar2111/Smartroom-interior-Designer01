from typing import Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from app.schemas import (
    RoomAnalysisRequest,
    RoomAnalysisResponse,
    RoomMeasureRequest,
    RoomMeasureResponse
)
from app.services.ai_service import analyze_room_with_ai
from app.services.measurement_service import calculate_measurements
from app.services.image_service import save_uploaded_image

router = APIRouter(tags=["Room Analysis & Measurement"])

@router.post("/measure-room", response_model=RoomMeasureResponse)
async def measure_room(req: RoomMeasureRequest):
    """
    Room Measurement Calculator.
    Calculates floor area, room volume, gross wall area, net wall area,
    perimeter, usable floor space, and estimated paint requirement.
    Supports feet, meters, and inches with consistent conversions.
    """
    try:
        metrics = calculate_measurements(
            length=req.length,
            width=req.width,
            height=req.height,
            unit=req.unit,
            doors=req.doors,
            windows=req.windows,
            dimension_source="user_provided"
        )
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Measurement calculation failed: {str(e)}"
        )

@router.post("/analyze-room", response_model=RoomAnalysisResponse)
async def analyze_room(req: RoomAnalysisRequest):
    """
    Room Analysis via Computer Vision and Spatial Architecture Engine.
    Accepts uploaded image identifier or URL, room type, dimensions, style, and budget.
    Returns structured room critique, lighting analysis, palette, and furniture plan.
    Uses AI vision model when configured, otherwise returns clearly labeled architectural fallback.
    """
    try:
        result = analyze_room_with_ai(
            image_id_or_url=req.image_id or req.image_url,
            room_type=req.room_type,
            length=req.length,
            width=req.width,
            height=req.height,
            unit=req.unit,
            preferred_style=req.preferred_style,
            budget=req.budget,
            user_notes=req.user_notes
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Room analysis failed: {str(e)}"
        )
