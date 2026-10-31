from fastapi import APIRouter, HTTPException, status
from app.schemas import RecommendationsRequest, RecommendationsResponse
from app.services.recommendation_service import generate_interior_recommendations

router = APIRouter(tags=["Interior Recommendations"])

@router.post("/recommendations", response_model=RecommendationsResponse)
async def get_interior_recommendations(req: RecommendationsRequest):
    """
    Generate personalized interior recommendations based on room type,
    dimensions, interior style, budget in INR, and color preferences.
    """
    try:
        recommendations = generate_interior_recommendations(
            room_type=req.room_type,
            length=req.length or 14.0,
            width=req.width or 12.0,
            height=req.height or 9.0,
            unit=req.unit,
            style_key=req.preferred_style,
            budget=req.budget,
            color_preferences=req.color_preferences,
            priorities=req.priorities
        )
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation generation failed: {str(e)}"
        )
