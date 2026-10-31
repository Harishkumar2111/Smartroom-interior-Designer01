from typing import Optional, Any
from pydantic import BaseModel, Field

# Health Check
class HealthResponse(BaseModel):
    status: str = "ok"
    app: str = "Smart Room AI Interior Designer"
    version: str = "1.0.0"
    services: dict[str, str]

# Image Upload
class UploadResponse(BaseModel):
    image_id: str
    filename: str
    preview_url: str
    file_size_bytes: int
    format: str
    width: int
    height: int
    message: str = "Image uploaded and validated successfully"

# Sub-models for Measurements
class DoorWindow(BaseModel):
    width: float = Field(gt=0, description="Width in selected room units")
    height: float = Field(gt=0, description="Height in selected room units")

class RoomMeasureRequest(BaseModel):
    length: float = Field(gt=0, description="Length of room")
    width: float = Field(gt=0, description="Width of room")
    height: float = Field(gt=0, description="Height of room")
    unit: str = Field(default="feet", description="feet, meters, or inches")
    doors: Optional[list[DoorWindow]] = Field(default_factory=list)
    windows: Optional[list[DoorWindow]] = Field(default_factory=list)

class RoomMeasureResponse(BaseModel):
    unit: str
    length: float
    width: float
    height: float
    floor_area: float
    room_volume: float
    gross_wall_area: float
    net_wall_area: float
    ceiling_area: float
    perimeter: float
    usable_floor_space: float
    walking_space: float
    paint_liters_estimated: float
    dimension_source: str = "user_provided"
    metric_equivalents: dict[str, float]

# Room Analysis
class RoomAnalysisRequest(BaseModel):
    image_id: Optional[str] = None
    image_url: Optional[str] = None
    room_type: str = Field(default="bedroom", description="e.g. bedroom, living_room, study, kitchen")
    length: Optional[float] = Field(default=None, gt=0)
    width: Optional[float] = Field(default=None, gt=0)
    height: Optional[float] = Field(default=None, gt=0)
    unit: str = Field(default="feet")
    preferred_style: str = Field(default="Modern")
    budget: float = Field(default=150000, ge=5000)
    user_notes: Optional[str] = None

class PaletteColor(BaseModel):
    role: str
    name: str
    hex: str
    reason: str

class FurniturePlanItem(BaseModel):
    name: str
    action: str
    placement: str
    dimensions: str
    material: str
    est_price: str
    price_numeric: float

class LightingPlanItem(BaseModel):
    layer: str
    fixture: str
    advice: str

class RoomAnalysisResponse(BaseModel):
    room_type: str
    is_empty_room: bool = False
    confidence: str
    dimensions: dict[str, Any]
    measurement_limitations: str
    detected_features: list[str]
    observations: dict[str, Any]
    suggested_wall_colors: list[PaletteColor]
    ceiling_and_lighting: list[LightingPlanItem]
    furniture_arrangement: list[FurniturePlanItem]
    interior_style_recommendations: dict[str, Any]
    budget_breakdown: dict[str, Any]
    ai_provider_used: str

# Recommendations
class RecommendationsRequest(BaseModel):
    room_type: str = Field(default="bedroom")
    length: Optional[float] = Field(default=14, gt=0)
    width: Optional[float] = Field(default=12, gt=0)
    height: Optional[float] = Field(default=9, gt=0)
    unit: str = Field(default="feet")
    preferred_style: str = Field(default="Modern")
    budget: float = Field(default=150000, ge=5000)
    color_preferences: Optional[list[str]] = None
    priorities: Optional[list[str]] = None

class RecommendationsResponse(BaseModel):
    room_type: str
    style: str
    budget_inr: float
    wall_decor_and_paint: dict[str, Any]
    wallpaper_and_accents: list[dict[str, Any]]
    false_ceilings: dict[str, Any]
    lighting_fixtures: list[LightingPlanItem]
    flooring_curtains_rugs: dict[str, Any]
    recommended_furniture: list[dict[str, Any]]
    plants_and_accessories: list[dict[str, Any]]
    budget_allocation: dict[str, Any]
    engine_source: str

# Furniture Catalog
class FurnitureItem(BaseModel):
    id: str
    name: str
    category: str
    icon: Optional[str] = "🛋️"
    length_ft: float
    width_ft: float
    height_ft: float
    price_min_inr: float
    price_max_inr: float
    estimated_price_inr: float
    price_label: str = "Estimated Market Price (INR)"
    suitable_rooms: list[str]
    compatible_styles: list[str]
    image_url: Optional[str] = None
    description: str
    placement_tip: str
    space_required: str

# AI Design Generation
class DesignGenerationRequest(BaseModel):
    image_id: Optional[str] = None
    image_url: Optional[str] = None
    style: str = Field(default="Modern")
    wall_color: Optional[str] = Field(default="#E8ECE9")
    ceiling_color: Optional[str] = Field(default="#FFFFFF")
    accent_color: Optional[str] = Field(default=None)
    ceiling_preferences: Optional[str] = Field(default="Minimal Cove with Warm LED")
    furniture_preferences: Optional[list[str]] = None
    prompt_instructions: Optional[str] = None

class DesignGenerationResponse(BaseModel):
    status: str
    ai_generated: bool
    message: str
    generated_image_url: Optional[str] = None
    preview_data: Optional[dict[str, Any]] = None
    design_metadata: dict[str, Any]

# Project CRUD
class ProjectCreate(BaseModel):
    name: str = Field(default="My Dream Room")
    room_type: str = Field(default="bedroom")
    dimensions: Optional[dict[str, Any]] = Field(default_factory=dict)
    image_id: Optional[str] = None
    image_url: Optional[str] = None
    selected_style: str = Field(default="modern")
    selected_colors: Optional[dict[str, Any]] = Field(default_factory=dict)
    furniture_selections: Optional[list[Any]] = Field(default_factory=list)
    recommendations: Optional[dict[str, Any]] = Field(default_factory=dict)
    budget_data: Optional[dict[str, Any]] = Field(default_factory=dict)
    generated_design_url: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    room_type: Optional[str] = None
    dimensions: Optional[dict[str, Any]] = None
    image_id: Optional[str] = None
    image_url: Optional[str] = None
    selected_style: Optional[str] = None
    selected_colors: Optional[dict[str, Any]] = None
    furniture_selections: Optional[list[Any]] = None
    recommendations: Optional[dict[str, Any]] = None
    budget_data: Optional[dict[str, Any]] = None
    generated_design_url: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    room_type: str
    dimensions: dict[str, Any]
    image_id: Optional[str] = None
    image_url: Optional[str] = None
    selected_style: str
    selected_colors: dict[str, Any]
    furniture_selections: list[Any]
    recommendations: dict[str, Any]
    budget_data: dict[str, Any]
    generated_design_url: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}
