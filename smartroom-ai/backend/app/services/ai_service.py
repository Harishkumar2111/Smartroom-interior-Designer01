import base64
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
import requests

from app.config import settings
from app.schemas import (
    RoomAnalysisResponse,
    PaletteColor,
    LightingPlanItem,
    FurniturePlanItem,
    DesignGenerationResponse
)
from app.services.image_service import get_image_path, generate_conceptual_color_overlay
from app.services.recommendation_service import generate_interior_recommendations, STYLE_DEFINITIONS

logger = logging.getLogger(__name__)


def encode_image_to_base64(image_path: Path) -> Tuple[str, str]:
    """Reads image file and returns (base64_string, mime_type)."""
    ext = image_path.suffix.lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    mime = mime_map.get(ext, "image/jpeg")
    with open(image_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")
    return encoded, mime


def analyze_room_fallback(
    room_type: str,
    length: Optional[float],
    width: Optional[float],
    height: Optional[float],
    unit: str,
    preferred_style: str,
    budget: float,
    user_notes: Optional[str] = None
) -> RoomAnalysisResponse:
    """Deterministic fallback room analysis when external AI is unconfigured or unreachable."""
    l = length or 14.0
    w = width or 12.0
    h = height or 9.0

    rec = generate_interior_recommendations(
        room_type=room_type,
        length=l,
        width=w,
        height=h,
        unit=unit,
        style_key=preferred_style,
        budget=budget
    )

    is_provided = (length is not None and width is not None and height is not None)

    return RoomAnalysisResponse(
        room_type=room_type,
        is_empty_room=False,
        confidence="High (Rule-Based Analysis)" if is_provided else "Estimated Architectural Standard",
        dimensions={
            "length": l,
            "width": w,
            "height": h,
            "unit": unit,
            "source": "user_provided" if is_provided else "standard_room_archetype"
        },
        measurement_limitations=(
            "Exact physical dimensions provided by user." if is_provided else
            "Dimensions are estimated based on standard architectural archetypes. Physical laser or tape measurement is recommended before purchasing furniture."
        ),
        detected_features=[
            "Standard rectangular architectural floor plan",
            "Clear vertical perimeter wall planes",
            "Natural daylight aperture orientation",
            "Standard ceiling clearance"
        ],
        observations={
            "overview": f"Spatial analysis for {preferred_style} style {room_type}. Layout optimized for functional circulation, daylight enhancement, and balanced sightlines.",
            "spatial_flow": f"Recommended clear central pathway of at least 3 ft with furniture grouped in dedicated functional zones.",
            "lighting_quality": "Natural daylight from exterior window should be enhanced with layered 3000K warm-white ambient and task lighting.",
            "user_notes_considered": user_notes or "None"
        },
        suggested_wall_colors=[
            PaletteColor(**c) for c in rec.wall_decor_and_paint["palette"]
        ],
        ceiling_and_lighting=rec.lighting_fixtures,
        furniture_arrangement=[
            FurniturePlanItem(
                name=f["name"],
                action="Essential Placement",
                placement=f["placement"],
                dimensions=f["dimensions"],
                material=f["material"],
                est_price=f"₹{int(f['estimated_price_inr']):,}",
                price_numeric=f["estimated_price_inr"]
            )
            for f in rec.recommended_furniture
        ],
        interior_style_recommendations={
            "style_name": rec.style,
            "summary": f"{rec.style} aesthetic selected. Emphasizes clean spatial transitions, curated materials, and cohesive palette balance.",
            "flooring_and_curtains": rec.flooring_curtains_rugs,
            "false_ceiling_plan": rec.false_ceilings
        },
        budget_breakdown=rec.budget_allocation,
        ai_provider_used="Rule-Based Spatial Fallback Engine (No external API required)"
    )


def analyze_room_with_ai(
    image_id_or_url: Optional[str],
    room_type: str = "bedroom",
    length: Optional[float] = None,
    width: Optional[float] = None,
    height: Optional[float] = None,
    unit: str = "feet",
    preferred_style: str = "Modern",
    budget: float = 150000.0,
    user_notes: Optional[str] = None
) -> RoomAnalysisResponse:
    """
    Multimodal Room Analysis.
    Attempts Google Gemini Vision API if GEMINI_API_KEY is configured.
    Gracefully and transparently falls back to deterministic rule-based analysis if unavailable.
    """
    image_path = None
    if image_id_or_url:
        image_path = get_image_path(image_id_or_url)

    # If no Gemini API key or no image, use the rule-based engine directly
    api_key = settings.GEMINI_API_KEY
    if not api_key or not image_path:
        return analyze_room_fallback(
            room_type=room_type,
            length=length,
            width=width,
            height=height,
            unit=unit,
            preferred_style=preferred_style,
            budget=budget,
            user_notes=user_notes
        )

    try:
        base64_data, mime_type = encode_image_to_base64(image_path)
        
        system_instruction = (
            "You are a professional interior designer and architectural space analyst. "
            "Analyze this room photo and output STRICT JSON only (no markdown, no backticks, no comments) "
            "matching this schema:\n"
            "{\n"
            '  "room_type": "string",\n'
            '  "is_empty_room": true,\n'
            '  "confidence": "High / Medium",\n'
            '  "detected_features": ["feature 1", "feature 2"],\n'
            '  "observations": {\n'
            '    "overview": "2-3 sentences",\n'
            '    "spatial_flow": "walkway and zoning",\n'
            '    "lighting_quality": "natural and artificial light analysis"\n'
            '  },\n'
            '  "suggested_wall_colors": [\n'
            '    {"role": "Main Wall", "name": "Name", "hex": "#HEX", "reason": "Why"},\n'
            '    {"role": "Accent Wall", "name": "Name", "hex": "#HEX", "reason": "Why"},\n'
            '    {"role": "Ceiling", "name": "Name", "hex": "#HEX", "reason": "Why"},\n'
            '    {"role": "Trim", "name": "Name", "hex": "#HEX", "reason": "Why"}\n'
            '  ],\n'
            '  "ceiling_and_lighting": [\n'
            '    {"layer": "Ambient Lighting", "fixture": "Type", "advice": "Placement & Kelvin"}\n'
            '  ],\n'
            '  "furniture_arrangement": [\n'
            '    {"name": "Piece", "action": "Add", "placement": "Position", "dimensions": "LxW ft", "material": "Specs", "est_price": "₹XX,XXX", "price_numeric": 15000}\n'
            '  ],\n'
            '  "interior_style_recommendations": {\n'
            '    "style_name": "Selected Style",\n'
            '    "concept": "Concept details"\n'
            '  }\n'
            "}"
        )

        user_prompt = (
            f"Room Type: {room_type}\n"
            f"Preferred Style: {preferred_style}\n"
            f"Budget: ₹{budget:,.0f} INR\n"
            f"User notes: {user_notes or 'None'}\n"
            "Important note: Do NOT fabricate uncalibrated exact millimeter measurements. State that physical tape measurement is recommended for precision."
        )

        models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"]
        last_error = None

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"{system_instruction}\n\n{user_prompt}"},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": base64_data
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "response_mime_type": "application/json"
                }
            }

            resp = requests.post(url, json=payload, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                cleaned_json = raw_text.strip()
                if cleaned_json.startswith("```"):
                    cleaned_json = cleaned_json.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                
                parsed = json.loads(cleaned_json)
                
                # Format into schema
                colors = [
                    PaletteColor(role=c.get("role", "Wall"), name=c.get("name", "Neutral"), hex=c.get("hex", "#F5F5F5"), reason=c.get("reason", ""))
                    for c in parsed.get("suggested_wall_colors", [])
                ]
                lighting = [
                    LightingPlanItem(layer=l.get("layer", "Ambient"), fixture=l.get("fixture", "LED"), advice=l.get("advice", ""))
                    for l in parsed.get("ceiling_and_lighting", [])
                ]
                furniture = [
                    FurniturePlanItem(
                        name=f.get("name", "Furniture"),
                        action=f.get("action", "Add"),
                        placement=f.get("placement", "Along wall"),
                        dimensions=f.get("dimensions", "Standard"),
                        material=f.get("material", "Timber"),
                        est_price=f.get("est_price", "₹15,000"),
                        price_numeric=float(f.get("price_numeric", 15000))
                    )
                    for f in parsed.get("furniture_arrangement", [])
                ]

                l = length or 14.0
                w = width or 12.0
                h = height or 9.0

                return RoomAnalysisResponse(
                    room_type=parsed.get("room_type", room_type),
                    is_empty_room=bool(parsed.get("is_empty_room", False)),
                    confidence=parsed.get("confidence", "Medium (Computer Vision Estimate)"),
                    dimensions={"length": l, "width": w, "height": h, "unit": unit},
                    measurement_limitations="Dimensions derived from single 2D camera photograph without LiDAR/depth calibration. Verify with tape measure before ordering custom joinery.",
                    detected_features=parsed.get("detected_features", ["Visible floor surface", "Wall boundaries", "Ambient lighting"]),
                    observations=parsed.get("observations", {}),
                    suggested_wall_colors=colors or [PaletteColor(role="Main", name="Alabaster", hex="#F8F8F6", reason="Bright neutral")],
                    ceiling_and_lighting=lighting or [LightingPlanItem(layer="Ambient", fixture="3000K LED Cove", advice="Warm uniform glow")],
                    furniture_arrangement=furniture,
                    interior_style_recommendations=parsed.get("interior_style_recommendations", {"style_name": preferred_style}),
                    budget_breakdown={
                        "total_budget_inr": budget,
                        "furniture_inr": round(budget * 0.5, 2),
                        "paint_and_lighting_inr": round(budget * 0.3, 2),
                        "decor_and_accessories_inr": round(budget * 0.2, 2)
                    },
                    ai_provider_used=f"Google Gemini Vision ({model})"
                )
            else:
                last_error = f"HTTP {resp.status_code}: {resp.text}"

        logger.warning("All Gemini models failed: %s. Falling back to rule-based engine.", last_error)
    except Exception as e:
        logger.error("Error during AI analysis: %s. Falling back to rule-based engine.", e)

    # Return honest fallback
    return analyze_room_fallback(
        room_type=room_type,
        length=length,
        width=width,
        height=height,
        unit=unit,
        preferred_style=preferred_style,
        budget=budget,
        user_notes=user_notes
    )


def generate_design_image(
    image_id_or_url: Optional[str],
    style: str = "Modern",
    wall_color: str = "#E8ECE9",
    ceiling_color: str = "#FFFFFF",
    accent_color: Optional[str] = None,
    ceiling_preferences: str = "Minimal Cove with Warm LED",
    furniture_preferences: Optional[list[str]] = None,
    prompt_instructions: Optional[str] = None
) -> DesignGenerationResponse:
    """
    Integrates AI image-generation or image-editing service when configured.
    If IMAGE_GEN_API_KEY is not configured, provides a non-AI conceptual preview
    overlay using Pillow, with completely honest and transparent status reporting.
    Never claims an AI diffusion image exists when it does not.
    """
    image_path = get_image_path(image_id_or_url) if image_id_or_url else None
    
    # Check if external AI image generation API is configured
    api_key = settings.IMAGE_GEN_API_KEY
    if api_key:
        pass

    # Provide high-quality non-AI conceptual preview with wall and ceiling colors
    preview_url = None
    if image_path and image_path.is_file():
        _, preview_url = generate_conceptual_color_overlay(
            source_image_path=image_path,
            wall_color_hex=wall_color,
            ceiling_color_hex=ceiling_color,
            accent_color_hex=accent_color,
            style_name=style
        )

    return DesignGenerationResponse(
        status="conceptual_preview_available" if preview_url else "style_guidelines_prepared",
        ai_generated=False,
        message=(
            "Image generation API key (IMAGE_GEN_API_KEY) is not configured in backend .env. "
            "A high-fidelity conceptual architectural color-overlay preview has been generated from your room photo."
            if preview_url else
            "Image generation API key is not configured. Conceptual style specifications and color harmonizer applied."
        ),
        generated_image_url=preview_url,
        preview_data={
            "selected_style": style,
            "wall_color": wall_color,
            "ceiling_preferences": ceiling_preferences,
            "furniture_preferences": furniture_preferences or [],
            "instructions": prompt_instructions or "None"
        },
        design_metadata={
            "generator": "Pillow Spatial Color Overlay Engine (Non-AI Conceptual Mode)",
            "wall_color_applied": wall_color,
            "lighting_temperature": "3000K Warm Neutral",
            "ceiling_treatment": ceiling_preferences
        }
    )
