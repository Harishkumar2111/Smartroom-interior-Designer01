from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas import FurnitureItem

router = APIRouter(prefix="/furniture", tags=["Furniture Catalog"])

FURNITURE_DATABASE: List[FurnitureItem] = [
    FurnitureItem(
        id="bed-single",
        name="Minimalist Single Bed",
        category="Bed",
        icon="🛏️",
        length_ft=6.5,
        width_ft=3.5,
        height_ft=1.5,
        price_min_inr=8000,
        price_max_inr=22000,
        estimated_price_inr=14500,
        suitable_rooms=["bedroom", "guest_room", "studio"],
        compatible_styles=["Modern", "Minimalist", "Scandinavian"],
        image_url="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop&q=60",
        description="Compact solid timber frame single bed ideal for studio apartments or kids/guest rooms.",
        placement_tip="Position against a solid wall, clear of window draft.",
        space_required="Requires min 4 × 7.5 ft floor area"
    ),
    FurnitureItem(
        id="bed-queen",
        name="Upholstered Queen Bed with Hydraulic Storage",
        category="Bed",
        icon="🛏️",
        length_ft=6.5,
        width_ft=5.0,
        height_ft=3.8,
        price_min_inr=28000,
        price_max_inr=65000,
        estimated_price_inr=42000,
        suitable_rooms=["bedroom"],
        compatible_styles=["Modern", "Luxury", "Contemporary", "Scandinavian"],
        image_url="https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?w=500&auto=format&fit=crop&q=60",
        description="Premium upholstered headboard queen bed with spacious under-mattress gas-lift storage.",
        placement_tip="Center on the primary bedroom wall with min 2.5 ft clearance on both sides.",
        space_required="Requires min 6 × 8 ft floor area"
    ),
    FurnitureItem(
        id="bed-king-teak",
        name="Royal Carved Sheesham King Bed",
        category="Bed",
        icon="🛏️",
        length_ft=6.8,
        width_ft=6.2,
        height_ft=4.2,
        price_min_inr=45000,
        price_max_inr=115000,
        estimated_price_inr=68000,
        suitable_rooms=["bedroom"],
        compatible_styles=["Traditional Indian", "Luxury"],
        image_url="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&auto=format&fit=crop&q=60",
        description="Handcrafted Sheesham wood king bed with traditional fluted headboard and warm honey teak finish.",
        placement_tip="Requires large master bedroom with at least 14 × 12 ft dimensions.",
        space_required="Requires min 8 × 9 ft floor area"
    ),
    FurnitureItem(
        id="sofa-3seater",
        name="Curved Boucle 3-Seater Sofa",
        category="Sofa",
        icon="🛋️",
        length_ft=7.2,
        width_ft=3.2,
        height_ft=2.8,
        price_min_inr=35000,
        price_max_inr=85000,
        estimated_price_inr=52000,
        suitable_rooms=["living_room"],
        compatible_styles=["Modern", "Contemporary", "Scandinavian"],
        image_url="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60",
        description="Soft sculptural curved sofa upholstered in high-durability textured cream boucle fabric.",
        placement_tip="Anchor opposite the media wall with at least 7 ft viewing clearance.",
        space_required="Requires min 8 × 5 ft floor area"
    ),
    FurnitureItem(
        id="sofa-sectional",
        name="L-Shape Chaise Sectional Sofa",
        category="Sofa",
        icon="🛋️",
        length_ft=8.5,
        width_ft=5.5,
        height_ft=2.9,
        price_min_inr=48000,
        price_max_inr=125000,
        estimated_price_inr=74000,
        suitable_rooms=["living_room"],
        compatible_styles=["Modern", "Luxury", "Contemporary"],
        image_url="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&auto=format&fit=crop&q=60",
        description="Spacious modular L-sectional with reversible chaise and stain-resistant velvet fabric.",
        placement_tip="Tuck against living room corner or use as an open-plan room divider.",
        space_required="Requires min 10 × 7 ft floor area"
    ),
    FurnitureItem(
        id="coffee-table-nesting",
        name="Fluted Ceramic Nesting Coffee Tables",
        category="Table",
        icon="🪑",
        length_ft=3.2,
        width_ft=3.2,
        height_ft=1.5,
        price_min_inr=12000,
        price_max_inr=28000,
        estimated_price_inr=18500,
        suitable_rooms=["living_room"],
        compatible_styles=["Modern", "Contemporary", "Scandinavian"],
        image_url="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60",
        description="Pair of round nesting tables with fluted cylindrical base and smoke-tempered glass top.",
        placement_tip="Position 18 inches away from sofa for effortless legroom and access.",
        space_required="Requires min 4 × 4 ft floor area"
    ),
    FurnitureItem(
        id="desk-height-adjustable",
        name="Dual-Motor Electric Standing Desk",
        category="Desk",
        icon="🖥️",
        length_ft=4.5,
        width_ft=2.3,
        height_ft=2.5,
        price_min_inr=24000,
        price_max_inr=45000,
        estimated_price_inr=32000,
        suitable_rooms=["study", "bedroom"],
        compatible_styles=["Modern", "Minimalist", "Industrial"],
        image_url="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=60",
        description="Ergonomic sit-stand desk with 4 memory presets, cable tray, and seamless birch veneer top.",
        placement_tip="Orient perpendicular to window to prevent direct sunlight reflection on screens.",
        space_required="Requires min 5 × 4 ft floor area"
    ),
    FurnitureItem(
        id="wardrobe-sliding-3door",
        name="Modular 3-Door Sliding Wardrobe with Mirror",
        category="Storage",
        icon="🚪",
        length_ft=7.0,
        width_ft=2.0,
        height_ft=8.0,
        price_min_inr=42000,
        price_max_inr=95000,
        estimated_price_inr=62000,
        suitable_rooms=["bedroom"],
        compatible_styles=["Modern", "Luxury", "Minimalist"],
        image_url="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&auto=format&fit=crop&q=60",
        description="Floor-to-ceiling wardrobe with smooth soft-close sliding tracks and built-in full length mirror.",
        placement_tip="Position on the interior structural wall away from door swing radius.",
        space_required="Requires min 7.5 × 3 ft floor area"
    ),
    FurnitureItem(
        id="chair-accent-swivel",
        name="Nordic Swivel Accent Armchair",
        category="Chair",
        icon="🪑",
        length_ft=2.8,
        width_ft=2.8,
        height_ft=2.7,
        price_min_inr=15000,
        price_max_inr=38000,
        estimated_price_inr=24000,
        suitable_rooms=["living_room", "bedroom", "study"],
        compatible_styles=["Scandinavian", "Modern", "Contemporary", "Bohemian"],
        image_url="https://images.unsplash.com/photo-1580481077156-f94b83072f91?w=500&auto=format&fit=crop&q=60",
        description="Comfortable 360-degree swivel lounge chair in textured terracotta boucle fabric.",
        placement_tip="Angle toward coffee table or near window for a cozy reading nook.",
        space_required="Requires min 3.5 × 3.5 ft floor area"
    ),
    FurnitureItem(
        id="dining-table-6seater",
        name="Italian Sintered Stone 6-Seater Dining Set",
        category="Table",
        icon="🍽️",
        length_ft=5.5,
        width_ft=3.0,
        height_ft=2.5,
        price_min_inr=45000,
        price_max_inr=110000,
        estimated_price_inr=65000,
        suitable_rooms=["dining_room"],
        compatible_styles=["Luxury", "Modern", "Contemporary"],
        image_url="https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500&auto=format&fit=crop&q=60",
        description="Heat-proof, scratch-resistant white Calacatta sintered stone dining table with 6 velvet chairs.",
        placement_tip="Center under the main dining pendant with 3 ft perimeter for chair pull-out.",
        space_required="Requires min 9 × 7 ft floor area"
    )
]

@router.get("", response_model=List[FurnitureItem])
async def list_furniture(
    category: Optional[str] = Query(None, description="Filter by category (Bed, Sofa, Table, Desk, Storage, Chair)"),
    room_type: Optional[str] = Query(None, description="Filter by room type (bedroom, living_room, study, dining_room)"),
    style: Optional[str] = Query(None, description="Filter by compatible interior style"),
    max_price: Optional[float] = Query(None, description="Max estimated budget in INR"),
    search: Optional[str] = Query(None, description="Search by name or description")
):
    """
    Lists furniture items from catalog with rich filtering by category, room type,
    style, budget in INR, and text search. All prices are clearly labeled estimates.
    """
    results = FURNITURE_DATABASE

    if category:
        cat_lower = category.lower()
        results = [f for f in results if f.category.lower() == cat_lower]

    if room_type:
        room_lower = room_type.lower()
        results = [f for f in results if any(r.lower() == room_lower for r in f.suitable_rooms)]

    if style:
        style_lower = style.lower()
        results = [f for f in results if any(s.lower() == style_lower for s in f.compatible_styles)]

    if max_price is not None:
        results = [f for f in results if f.estimated_price_inr <= max_price]

    if search:
        s_lower = search.lower()
        results = [
            f for f in results
            if s_lower in f.name.lower() or s_lower in f.description.lower() or s_lower in f.category.lower()
        ]

    return results

@router.get("/{furniture_id}", response_model=FurnitureItem)
async def get_furniture_by_id(furniture_id: str):
    """Retrieves a single furniture piece by ID."""
    for item in FURNITURE_DATABASE:
        if item.id == furniture_id:
            return item
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Furniture item '{furniture_id}' not found")
