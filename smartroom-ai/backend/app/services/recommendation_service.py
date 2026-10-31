from typing import Optional, List, Dict, Any
from app.schemas import (
    RecommendationsResponse,
    PaletteColor,
    LightingPlanItem,
    FurniturePlanItem
)

# Rich style databases
STYLE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "modern": {
        "name": "Modern",
        "description": "Clean horizontal lines, subtle geometric harmony, neutral foundations, and sleek functional elegance.",
        "colors": {
            "main": {"name": "Crisp Off-White", "hex": "#F4F5F7", "reason": "Expands space and illuminates room with high daylight reflection"},
            "accent": {"name": "Smoky Charcoal", "hex": "#2B303A", "reason": "Provides bold architectural contrast behind the headboard or media unit"},
            "ceiling": {"name": "Pure Ceiling White", "hex": "#FFFFFF", "reason": "Maximizes vertical height perception"},
            "trim": {"name": "Warm Platinum", "hex": "#D1D5DB", "reason": "Smooth transition between wall and baseboards"}
        },
        "false_ceiling": {
            "type": "Peripheral Gypsum Drop with Concealed LED Cove",
            "cove_light_color": "3000K Warm White",
            "recessed_spots": "3-4 W COB LED spotlights along room edges",
            "height_drop_inches": 5,
            "cost_inr_sqft": 135
        },
        "lighting": [
            {"layer": "Ambient Lighting", "fixture": "Concealed 3000K Warm White LED Strip Cove", "advice": "Indirect illumination that prevents harsh shadows and adds evening luxury"},
            {"layer": "Task Lighting", "fixture": "Adjustable Matte-Black Gooseneck Lamps / Track Spotlight", "advice": "Focused beam for bedside reading or work desk productivity"},
            {"layer": "Accent Lighting", "fixture": "Vertical LED Profile Channels", "advice": "Embed in wall fluting or shelving for dramatic mood glow"}
        ],
        "flooring_rugs": {
            "flooring": "Light Grey Matt Porcelain Tiles or Engineered White Oak",
            "rug": "Low-pile geometric wool-blend rug (5×7 ft) in monochrome shades",
            "curtains": "Floor-to-ceiling sheer linen drapes paired with blackout grey curtains"
        },
        "wallpaper_accents": [
            {"type": "Geometric Textured Linen Wallpaper", "wall": "Accent Bed Wall", "finish": "Matte Fabric Texture", "est_cost_inr": 8500},
            {"type": "Vertical Fluted Charcoal Wall Panels", "wall": "Media / TV Unit Wall", "finish": "Charcoal Wood Polymer Composite", "est_cost_inr": 16000}
        ],
        "plants_decor": [
            {"item": "Fiddle Leaf Fig in Ceramic Cylinder Pot", "category": "Indoor Plant", "placement": "Near window corner"},
            {"item": "Oversized Minimalist Monochrome Canvas Art", "category": "Wall Art", "placement": "Above sofa or bed headboard"},
            {"item": "Slim Matte-Black Framed Floor Mirror (6×2 ft)", "category": "Mirror", "placement": "Corner wall reflecting daylight"}
        ]
    },
    "minimalist": {
        "name": "Minimalist",
        "description": "Uncluttered surfaces, deliberate negative space, monochromatic serenity, and intentional functional elements.",
        "colors": {
            "main": {"name": "Warm Alabaster", "hex": "#F9F8F6", "reason": "Soft neutral that feels welcoming without visual noise"},
            "accent": {"name": "Stone Grey", "hex": "#9E9D9B", "reason": "Gentle focal boundary with zero harshness"},
            "ceiling": {"name": "Flat White", "hex": "#FFFFFF", "reason": "Seamless ceiling plane"},
            "trim": {"name": "Frameless / Shadow Line", "hex": "#F0EFEB", "reason": "Invisible architectural trim"}
        },
        "false_ceiling": {
            "type": "Minimal Shadow-Line Flush Ceiling",
            "cove_light_color": "3500K Natural White",
            "recessed_spots": "Deep baffle anti-glare downlights",
            "height_drop_inches": 3,
            "cost_inr_sqft": 110
        },
        "lighting": [
            {"layer": "Ambient Lighting", "fixture": "Flush Architectural Magnetic Track Fixtures", "advice": "Clean recessed light lines with no visible protruding hardware"},
            {"layer": "Task Lighting", "fixture": "Cordless Minimalist Touch Desk Lamp", "advice": "Sleek profile with dimmable natural white light"}
        ],
        "flooring_rugs": {
            "flooring": "Polished Micro-cement or Seamless Light Maple Vinyl Planks",
            "rug": "Solid unpatterned cream flat-weave jute-cotton rug",
            "curtains": "Concealed track linen wave-fold sheer curtains"
        },
        "wallpaper_accents": [
            {"type": "Micro-cement Textured Limewash Finish", "wall": "Main Accent Wall", "finish": "Organic Textured Plaster", "est_cost_inr": 11000}
        ],
        "plants_decor": [
            {"item": "Single Monstera Deliciosa Leaf in Slim Glass Vessel", "category": "Botanical", "placement": "Floating console"},
            {"item": "Frameless Organic Asymmetrical Mirror", "category": "Mirror", "placement": "Dressing zone"}
        ]
    },
    "luxury": {
        "name": "Luxury",
        "description": "Rich velvet textures, champagne brass accents, Italian marble finishes, layered architectural cove lighting, and bespoke statement joinery.",
        "colors": {
            "main": {"name": "Champagne Silk", "hex": "#F2EBE2", "reason": "Warm opulent foundation reflecting chandelier and cove light"},
            "accent": {"name": "Regal Emerald / Deep Sapphire", "hex": "#1B3B36", "reason": "Jewel-tone accent commanding attention behind key focal points"},
            "ceiling": {"name": "Ivory Satin", "hex": "#FAF6F0", "reason": "Enriches golden cove reflection"},
            "trim": {"name": "Brushed Warm Gold", "hex": "#D4AF37", "reason": "Bespoke metal trim inlay"}
        },
        "false_ceiling": {
            "type": "Multi-tier Gypsum with Gold T-Profile Trim & Double Indirect Cove",
            "cove_light_color": "2800K Extra Warm Golden Glow",
            "recessed_spots": "Rose Gold / Brass reflector anti-glare spots",
            "height_drop_inches": 6,
            "cost_inr_sqft": 195
        },
        "lighting": [
            {"layer": "Ambient Lighting", "fixture": "Tiered Crystal / Brushed Brass Chandelier", "advice": "Stunning central statement light positioned over primary zone"},
            {"layer": "Accent Lighting", "fixture": "Concealed Double Cove with 2800K High-CRI LED Strips", "advice": "Bathes ceiling in a soft golden hotel-suite ambiance"},
            {"layer": "Task Lighting", "fixture": "Sconces with Alabaster or Tinted Fluted Glass", "advice": "Flanks bed headboard or vanity mirror"}
        ],
        "flooring_rugs": {
            "flooring": "Statuario Italian Marble or High-Gloss Glazed Porcelain Slabs",
            "rug": "Hand-tufted silk-and-wool plush abstract rug (8×10 ft)",
            "curtains": "Double-layer velvet blackout drapes with satin lining and motorized track"
        },
        "wallpaper_accents": [
            {"type": "Metallic Gold Foil Geometric Silk Wallpaper", "wall": "Master Accent Wall", "finish": "Embossed Silk Sheen", "est_cost_inr": 24000},
            {"type": "Backlit Calacatta Onyx Composite Panel", "wall": "Media Feature Wall", "finish": "Translucent Stone Composite", "est_cost_inr": 45000}
        ],
        "plants_decor": [
            {"item": "Areca Palm in Hammered Brass Planter", "category": "Luxury Indoor Plant", "placement": "Beside grand seating"},
            {"item": "Backlit Beveled Gold-Leaf Wall Mirror (5×3 ft)", "category": "Mirror", "placement": "Foyer or dressing area"},
            {"item": "Sculptural Marble & Brushed Gold Table Decor", "category": "Objet d'art", "placement": "Coffee table centerpiece"}
        ]
    },
    "scandinavian": {
        "name": "Scandinavian",
        "description": "Bright hygge simplicity, light birch and oak timbers, cozy woven woolens, and abundant natural light optimization.",
        "colors": {
            "main": {"name": "Nordic Snow", "hex": "#F7F8F9", "reason": "Captures and reflects every ray of natural daylight"},
            "accent": {"name": "Muted Sage Green", "hex": "#8EA08C", "reason": "Calming biophilic connection to Scandinavian woodlands"},
            "ceiling": {"name": "Pure White", "hex": "#FFFFFF", "reason": "Enhances spaciousness"},
            "trim": {"name": "Blonde Wood Trim", "hex": "#E3D5C0", "reason": "Natural birch/ash accents"}
        },
        "false_ceiling": {
            "type": "Light Oak Wooden Rafters / Slat Ceiling with Slim Recessed LED Channels",
            "cove_light_color": "3000K Warm Neutral",
            "recessed_spots": "Matte White deep downlights",
            "height_drop_inches": 4,
            "cost_inr_sqft": 160
        },
        "lighting": [
            {"layer": "Ambient Lighting", "fixture": "Pendant Lamp with Oak Veneer or White Matte Dome", "advice": "Soft, glare-free downward illumination with hygge coziness"},
            {"layer": "Task Lighting", "fixture": "Articulated Wood-and-Metal Reading Lamp", "advice": "Warm directional task lighting beside armchair"}
        ],
        "flooring_rugs": {
            "flooring": "Light Natural Ash or White-Washed Oak Wooden Planks",
            "rug": "Thick Scandinavian Shag Wool or Moroccan Berber Trellis Rug",
            "curtains": "Semi-sheer linen drapes in natural oatmeal shade"
        },
        "wallpaper_accents": [
            {"type": "Soft Botanical Birch Tree Silhouettes", "wall": "Accent Wall", "finish": "Matte Non-Woven Paper", "est_cost_inr": 9500}
        ],
        "plants_decor": [
            {"item": "Snake Plant (Sansevieria) in Light Ash Wood Stand", "category": "Air Purifying Plant", "placement": "Bedroom corner"},
            {"item": "Round Oak Framed Mirror (32-inch diameter)", "category": "Mirror", "placement": "Above desk or console"},
            {"item": "Woven Seagrass Storage Baskets", "category": "Storage", "placement": "Beside sofa"}
        ]
    },
    "traditional_indian": {
        "name": "Traditional Indian",
        "description": "Rich teakwood craftsmanship, brass accents, block-print textiles, warm terracotta tones, and ornate classical charm.",
        "colors": {
            "main": {"name": "Warm Sandstone", "hex": "#F4EBD9", "reason": "Warm heritage tone reminiscent of Jodhpur sandstone"},
            "accent": {"name": "Royal Crimson / Deep Peacock", "hex": "#8C2730", "reason": "Heritage accent that flatters dark sheesham wood carvings"},
            "ceiling": {"name": "Heritage Cream", "hex": "#FDFBF5", "reason": "Soft ambient overhead glow"},
            "trim": {"name": "Antique Brass / Teak Finish", "hex": "#6F4E37", "reason": "Frames doors and cornices authentically"}
        },
        "false_ceiling": {
            "type": "Carved Wooden Cornice with Decorative Teak Battens & Central Jharokha Motif",
            "cove_light_color": "2700K Warm Amber",
            "recessed_spots": "Warm 2700K brass-bezel spots",
            "height_drop_inches": 5,
            "cost_inr_sqft": 175
        },
        "lighting": [
            {"layer": "Ambient Lighting", "fixture": "Hanging Antique Brass Diya Lanterns or Filigree Pendant", "advice": "Casts intricate shadow patterns on walls for nostalgic Indian warmth"},
            {"layer": "Accent Lighting", "fixture": "Warm Uplights on Carved Wood Panels", "advice": "Highlights timber grain and hand-carved motifs"}
        ],
        "flooring_rugs": {
            "flooring": "Kota Stone with Brass Inlay or Chettinad Athangudi Tiles",
            "rug": "Kashmir Hand-knotted Silk-Wool Rug or Jaipur Block-Print Dhurrie",
            "curtains": "Raw Silk Drapes with Zari Border in Mustard / Rust"
        },
        "wallpaper_accents": [
            {"type": "Pichwai or Mughal Floral Fresco Wallpaper", "wall": "Accent Wall", "finish": "Textured Canvas Wallpaper", "est_cost_inr": 18000}
        ],
        "plants_decor": [
            {"item": "Tulsi / Holy Basil in Brass Urli or Handcrafted Terracotta Pot", "category": "Sacred Plant", "placement": "East-facing balcony or niche"},
            {"item": "Carved Jharokha Mirror with Distressed Wood Finish", "category": "Mirror", "placement": "Main entrance or living wall"},
            {"item": "Brass Bell Cluster and Peacock Wall Bracket", "category": "Heritage Decor", "placement": "Pooja corner or gallery wall"}
        ]
    },
    "contemporary": {
        "name": "Contemporary",
        "description": "Currently trending curbed silhouettes, organic modern textures, mixed metals, and warm taupe undertones.",
        "colors": {
            "main": {"name": "Warm Greige", "hex": "#EFECE6", "reason": "The quintessential modern neutral combining grey and beige"},
            "accent": {"name": "Earthy Terracotta", "hex": "#C46851", "reason": "Adds organic warmth and artisanal spirit"},
            "ceiling": {"name": "Alabaster White", "hex": "#FAF8F5", "reason": "Soft reflective plane"},
            "trim": {"name": "Brushed Gunmetal", "hex": "#4A4E54", "reason": "Contemporary edge"}
        },
        "false_ceiling": {
            "type": "Organic Curved Gypsum Ceiling with Seamless Silicone Diffuser",
            "cove_light_color": "3000K Soft Glow",
            "recessed_spots": "Trimless magnetic spots",
            "height_drop_inches": 4,
            "cost_inr_sqft": 170
        },
        "lighting": [
            {"layer": "Ambient Lighting", "fixture": "Sculptural Curved LED Chandelier", "advice": "Acts as an artistic focal centerpiece with diffuse, uniform light"}
        ],
        "flooring_rugs": {
            "flooring": "Large Format Terrazzo or Matte Grey Vitrified Tiles (4×2 ft)",
            "rug": "High-low sculpted pile abstract rug in warm oatmeal & terracotta",
            "curtains": "Ripple-fold drapery in linen-viscose blend"
        },
        "wallpaper_accents": [
            {"type": "Abstract Curved Line Art Wallpaper", "wall": "Living / Bed Feature Wall", "finish": "Matte Fabric Texture", "est_cost_inr": 12500}
        ],
        "plants_decor": [
            {"item": "ZZ Plant (Zamioculcas) in Curved Fluted Concrete Planter", "category": "Low Maintenance Plant", "placement": "Low credenza"},
            {"item": "Irregular Asymmetrical Capsule Mirror", "category": "Mirror", "placement": "Entryway"}
        ]
    },
    "industrial": {
        "name": "Industrial",
        "description": "Exposed structural brickwork, matte black iron beams, raw distressed timbers, and vintage Edison factory lights.",
        "colors": {
            "main": {"name": "Concrete Grey", "hex": "#D3D5D7", "reason": "Raw urban architectural vibe"},
            "accent": {"name": "Burnt Clay Brick", "hex": "#9A4B3A", "reason": "Industrial warmth of exposed masonry"},
            "ceiling": {"name": "Matte Charcoal Black", "hex": "#202224", "reason": "Conceals exposed conduits while creating urban loft mood"},
            "trim": {"name": "Cast Iron Black", "hex": "#141517", "reason": "Sharp structural framing"}
        },
        "false_ceiling": {
            "type": "Open Exposed Ceiling with Black Steel Track Conduits or Metal Mesh Grid",
            "cove_light_color": "2400K Vintage Amber",
            "recessed_spots": "Industrial Black Track Spotlights",
            "height_drop_inches": 0,
            "cost_inr_sqft": 90
        },
        "lighting": [
            {"layer": "Ambient Lighting", "fixture": "Multi-head Black Track Lighting Rail", "advice": "High adjustability to point beams at raw brick and timber textures"},
            {"layer": "Task Lighting", "fixture": "Cage Edison Pendant Lamps with Filament Glow", "advice": "Warm nostalgic golden ambiance"}
        ],
        "flooring_rugs": {
            "flooring": "Polished Concrete or Distressed Dark Reclaimed Oak Wood Planks",
            "rug": "Distressed Vintage Overdyed Persian Rug or Cowhide Rug",
            "curtains": "Charcoal Canvas Roller Blinds with Black Chain Pulls"
        },
        "wallpaper_accents": [
            {"type": "3D Reclaimed Exposed Brick Veneer", "wall": "Main Accent Wall", "finish": "Real Clay Brick Veneer", "est_cost_inr": 21000}
        ],
        "plants_decor": [
            {"item": "Cast Iron Plant (Aspidistra) in Heavy Steel Planter", "category": "Hardy Indoor Plant", "placement": "Next to bookshelf"},
            {"item": "Industrial Windowpane Grid Mirror (Black Metal Frame)", "category": "Mirror", "placement": "Reflecting urban light"}
        ]
    },
    "bohemian": {
        "name": "Bohemian",
        "description": "Free-spirited layers of macrame, cane wicker furniture, abundant hanging flora, Persian dhurries, and warm earthy sunburst tones.",
        "colors": {
            "main": {"name": "Warm Sand", "hex": "#F3EDE2", "reason": "Soft earthy canvas that allows eclectic decor to pop"},
            "accent": {"name": "Mustard Saffron", "hex": "#DDA15E", "reason": "Sunny bohemian warmth inspired by spice markets"},
            "ceiling": {"name": "Warm Coconut", "hex": "#FCFBF7", "reason": "Breezy and bright overhead"},
            "trim": {"name": "Rattan Tan", "hex": "#BC6C25", "reason": "Complements wicker and cane"}
        },
        "false_ceiling": {
            "type": "Cane Matting Inlay with Exposed Teak Wood Beams",
            "cove_light_color": "2700K Warm Glow",
            "recessed_spots": "Warm diffused bamboo spots",
            "height_drop_inches": 4,
            "cost_inr_sqft": 145
        },
        "lighting": [
            {"layer": "Ambient Lighting", "fixture": "Woven Bamboo / Rattan Dome Pendant", "advice": "Casts beautiful organic weave shadows across the ceiling"},
            {"layer": "Accent Lighting", "fixture": "Fairy Lights & Amber Moroccan Metal Lanterns", "advice": "Creates whimsical dreamy evenings"}
        ],
        "flooring_rugs": {
            "flooring": "Light Wood Planks or Natural Terracotta Tiles",
            "rug": "Layered Jute Braided Round Rug under Vintage Kilim Dhurrie",
            "curtains": "Breezy cotton gauze drapes with macrame tie-backs"
        },
        "wallpaper_accents": [
            {"type": "Hand-painted Botanical Palm Fronds Wallpaper", "wall": "Bed Headboard Wall", "finish": "Eco Linen Paper", "est_cost_inr": 13000}
        ],
        "plants_decor": [
            {"item": "Pothos (Devil's Ivy) in Macrame Hanging Planter", "category": "Hanging Vine", "placement": "Window frame"},
            {"item": "Rattan Sunburst Round Mirror", "category": "Mirror", "placement": "Gallery accent wall"},
            {"item": "Floor Poufs and Embroidered Kilim Floor Cushions", "category": "Seating", "placement": "Casual lounge nook"}
        ]
    }
}

# Furniture catalog for recommendations
ROOM_FURNITURE_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "bedroom": [
        {"name": "Storage Queen Bed with Upholstered Headboard", "category": "Bed", "dimensions": "6.5 × 5.2 × 3.5 ft", "price_inr": 38000, "material": "Solid Teak & Premium Boucle Fabric", "placement": "Centered on main wall facing away from entrance"},
        {"name": "Matching 2-Drawer Floating Bedside Tables (Pair)", "category": "Nightstand", "dimensions": "1.8 × 1.3 × 1.5 ft", "price_inr": 14000, "material": "Engineered Wood with Brass Pulls", "placement": "Flanking both sides of the bed"},
        {"name": "3-Door Floor-to-Ceiling Wardrobe with Loft", "category": "Wardrobe", "dimensions": "7.0 × 2.0 × 8.5 ft", "price_inr": 65000, "material": "Marine Ply with Anti-fingerprint Acrylic Finish", "placement": "Against the longest non-window wall"},
        {"name": "Minimalist Ergonomic Study/Dressing Desk", "category": "Desk", "dimensions": "4.0 × 1.8 × 2.5 ft", "price_inr": 16000, "material": "Solid Oak Top with Powder-coated Steel Legs", "placement": "Near window for abundant daytime reading light"}
    ],
    "living_room": [
        {"name": "3-Seater Premium Fabric Sofa with Track Arms", "category": "Sofa", "dimensions": "7.0 × 3.0 × 2.8 ft", "price_inr": 48000, "material": "High-density Foam with Stain-resistant Velvet", "placement": "Facing main TV wall with at least 8 ft viewing distance"},
        {"name": "Sculptural Nesting Coffee Tables (Set of 2)", "category": "Table", "dimensions": "3.0 × 3.0 × 1.5 ft", "price_inr": 18000, "material": "Fluted Ceramic Base with Tinted Glass Top", "placement": "Centered in front of the 3-seater sofa"},
        {"name": "Floating Low-Profile Media Console Unit", "category": "Storage", "dimensions": "6.0 × 1.4 × 1.2 ft", "price_inr": 26000, "material": "Warm Walnut Veneer with Cable Management Pass-through", "placement": "Mounted 16 inches above floor on main accent wall"},
        {"name": "Accent Lounge Armchair with Swivel Base", "category": "Chair", "dimensions": "2.8 × 2.8 × 2.7 ft", "price_inr": 22000, "material": "Curved Steel Frame with Rust Boucle Upholstery", "placement": "Angled 45 degrees towards the coffee table"}
    ],
    "study": [
        {"name": "Ergonomic Height-Adjustable Dual-Motor Desk", "category": "Desk", "dimensions": "4.5 × 2.2 × 2.5 ft", "price_inr": 32000, "material": "Seamless Birch Top with Heavy Gauge Steel Frame", "placement": "Perpendicular to window to prevent screen glare"},
        {"name": "High-Back Ergonomic Mesh Executive Chair", "category": "Chair", "dimensions": "2.2 × 2.2 × 4.0 ft", "price_inr": 18000, "material": "Breathable Korean Mesh with Multi-point Lumbar Support", "placement": "Paired with desk"},
        {"name": "Modular Wall-Mounted Bookshelf & Display Unit", "category": "Storage", "dimensions": "5.0 × 1.0 × 6.5 ft", "price_inr": 28000, "material": "Matte Black Metal Frame with Oak Shelves", "placement": "Mounted on study backdrop wall"}
    ],
    "dining_room": [
        {"name": "6-Seater Sintered Stone Top Dining Table", "category": "Table", "dimensions": "5.5 × 3.0 × 2.5 ft", "price_inr": 42000, "material": "Heat and Scratch-proof Sintered Stone with Steel Base", "placement": "Centered under feature dining pendant chandelier"},
        {"name": "Upholstered Dining Chairs (Set of 6)", "category": "Chair", "dimensions": "1.8 × 1.8 × 3.0 ft", "price_inr": 36000, "material": "Bentwood Shell with Easy-clean Fabric", "placement": "Tucked neatly around dining table"},
        {"name": "Modern Dining Buffet Credenza / Crockery Unit", "category": "Storage", "dimensions": "5.0 × 1.5 × 2.8 ft", "price_inr": 32000, "material": "Fluted Glass Doors with Integrated Sensor LED", "placement": "Against dining perimeter wall"}
    ]
}


def generate_interior_recommendations(
    room_type: str = "bedroom",
    length: float = 14.0,
    width: float = 12.0,
    height: float = 9.0,
    unit: str = "feet",
    style_key: str = "modern",
    budget: float = 150000.0,
    color_preferences: Optional[List[str]] = None,
    priorities: Optional[List[str]] = None
) -> RecommendationsResponse:
    # Normalize style
    style_norm = style_key.lower().replace(" ", "_").replace("-", "_")
    if style_norm not in STYLE_DEFINITIONS:
        style_norm = "modern"
        
    style_data = STYLE_DEFINITIONS[style_norm]
    
    # Normalize room
    room_norm = room_type.lower().replace(" ", "_").replace("-", "_")
    furniture_templates = ROOM_FURNITURE_TEMPLATES.get(room_norm, ROOM_FURNITURE_TEMPLATES["bedroom"])

    # Scale furniture budget according to user's overall budget
    # Standard rule of thumb:
    # Furniture: ~48%
    # False Ceiling & Lighting: ~18%
    # Paint & Wallpaper: ~14%
    # Flooring, Curtains, Rugs: ~12%
    # Decor, Plants, Mirrors: ~8%
    budget_allocation = {
        "total_budget_inr": budget,
        "furniture_inr": round(budget * 0.48, 2),
        "false_ceiling_and_lighting_inr": round(budget * 0.18, 2),
        "paint_and_wall_accents_inr": round(budget * 0.14, 2),
        "flooring_rugs_curtains_inr": round(budget * 0.12, 2),
        "decor_plants_accessories_inr": round(budget * 0.08, 2)
    }

    # Format furniture items with budget proportion
    recommended_furniture = []
    total_template_cost = sum(item["price_inr"] for item in furniture_templates)
    scale_factor = (budget_allocation["furniture_inr"] / total_template_cost) if total_template_cost > 0 else 1.0
    scale_factor = max(0.5, min(scale_factor, 2.5))  # Clamp within realistic limits

    for item in furniture_templates:
        adj_price = round(item["price_inr"] * scale_factor, -2)  # Round to hundreds
        recommended_furniture.append({
            "name": item["name"],
            "category": item["category"],
            "dimensions": item["dimensions"],
            "estimated_price_inr": adj_price,
            "material": item["material"],
            "placement": item["placement"],
            "priority": "Essential" if item["category"] in ("Bed", "Sofa", "Desk", "Table") else "Recommended"
        })

    # Prepare lighting fixtures
    lighting_fixtures = [
        LightingPlanItem(layer=l["layer"], fixture=l["fixture"], advice=l["advice"])
        for l in style_data["lighting"]
    ]

    return RecommendationsResponse(
        room_type=room_type,
        style=style_data["name"],
        budget_inr=budget,
        wall_decor_and_paint={
            "palette": [
                {"role": "Main Wall", "name": style_data["colors"]["main"]["name"], "hex": style_data["colors"]["main"]["hex"], "reason": style_data["colors"]["main"]["reason"]},
                {"role": "Accent Wall", "name": style_data["colors"]["accent"]["name"], "hex": style_data["colors"]["accent"]["hex"], "reason": style_data["colors"]["accent"]["reason"]},
                {"role": "Ceiling", "name": style_data["colors"]["ceiling"]["name"], "hex": style_data["colors"]["ceiling"]["hex"], "reason": style_data["colors"]["ceiling"]["reason"]},
                {"role": "Trim & Baseboard", "name": style_data["colors"]["trim"]["name"], "hex": style_data["colors"]["trim"]["hex"], "reason": style_data["colors"]["trim"]["reason"]},
            ],
            "application_tips": "Apply 1 coat primer followed by 2 coats of premium low-VOC luxury emulsion. Accent wall should be chosen where natural daylight from windows grazes the texture."
        },
        wallpaper_and_accents=style_data["wallpaper_accents"],
        false_ceilings=style_data["false_ceiling"],
        lighting_fixtures=lighting_fixtures,
        flooring_curtains_rugs=style_data["flooring_rugs"],
        recommended_furniture=recommended_furniture,
        plants_and_accessories=style_data["plants_decor"],
        budget_allocation=budget_allocation,
        engine_source="Rule-Based Interior Architecture & Spatial Optimization Engine"
    )
