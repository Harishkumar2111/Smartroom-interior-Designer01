from typing import Optional, List
from app.schemas import DoorWindow, RoomMeasureResponse

def convert_to_feet(val: float, unit: str) -> float:
    unit_lower = unit.lower()
    if unit_lower in ("meter", "meters", "m"):
        return val * 3.28084
    elif unit_lower in ("inch", "inches", "in"):
        return val / 12.0
    return val  # Already in feet

def convert_from_feet(val_ft: float, target_unit: str) -> float:
    unit_lower = target_unit.lower()
    if unit_lower in ("meter", "meters", "m"):
        return val_ft * 0.3048
    elif unit_lower in ("inch", "inches", "in"):
        return val_ft * 12.0
    return val_ft

def calculate_measurements(
    length: float,
    width: float,
    height: float,
    unit: str = "feet",
    doors: Optional[List[DoorWindow]] = None,
    windows: Optional[List[DoorWindow]] = None,
    dimension_source: str = "user_provided"
) -> RoomMeasureResponse:
    doors = doors or []
    windows = windows or []

    # 1. Calculations in the requested unit
    floor_area = round(length * width, 2)
    room_volume = round(length * width * height, 2)
    perimeter = round(2 * (length + width), 2)
    gross_wall_area = round(2 * height * (length + width), 2)

    door_area = sum(d.width * d.height for d in doors)
    window_area = sum(w.width * w.height for w in windows)

    net_wall_area = max(0.0, round(gross_wall_area - door_area - window_area, 2))
    ceiling_area = floor_area

    usable_floor_space = round(floor_area * 0.65, 2)
    walking_space = round(floor_area * 0.35, 2)

    # 2. Convert to standard feet and meters for standardized paint & volume calculation
    length_ft = convert_to_feet(length, unit)
    width_ft = convert_to_feet(width, unit)
    height_ft = convert_to_feet(height, unit)

    floor_area_sqm = (length_ft * 0.3048) * (width_ft * 0.3048)
    volume_cbm = floor_area_sqm * (height_ft * 0.3048)
    net_wall_sqm = (net_wall_area * 0.092903) if unit == "feet" else (
        net_wall_area if unit in ("meter", "meters", "m") else net_wall_area * 0.00064516
    )

    # 1 liter covers ~12 sq meters for 2 coats
    paint_liters = round(max(1.0, net_wall_sqm / 12.0 * 2.0), 1)

    return RoomMeasureResponse(
        unit=unit,
        length=round(length, 2),
        width=round(width, 2),
        height=round(height, 2),
        floor_area=floor_area,
        room_volume=room_volume,
        gross_wall_area=gross_wall_area,
        net_wall_area=net_wall_area,
        ceiling_area=ceiling_area,
        perimeter=perimeter,
        usable_floor_space=usable_floor_space,
        walking_space=walking_space,
        paint_liters_estimated=paint_liters,
        dimension_source=dimension_source,
        metric_equivalents={
            "length_meters": round(length_ft * 0.3048, 2),
            "width_meters": round(width_ft * 0.3048, 2),
            "height_meters": round(height_ft * 0.3048, 2),
            "floor_area_sq_meters": round(floor_area_sqm, 2),
            "volume_cubic_meters": round(volume_cbm, 2),
            "net_wall_area_sq_meters": round(net_wall_sqm, 2),
        }
    )
