import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, default="Untitled Room Project")
    room_type = Column(String(100), nullable=False, default="bedroom")
    
    # Dimensions: length, width, height, unit stored as JSON string
    dimensions = Column(Text, nullable=True, default="{}")
    
    # Image identifiers
    image_id = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    
    # Style & design preferences
    selected_style = Column(String(100), nullable=False, default="modern")
    selected_colors = Column(Text, nullable=True, default="{}")
    
    # Selected furniture pieces
    furniture_selections = Column(Text, nullable=True, default="[]")
    
    # Stored recommendation engine output
    recommendations = Column(Text, nullable=True, default="{}")
    
    # Budget breakdown & total in INR
    budget_data = Column(Text, nullable=True, default="{}")
    
    # AI generated / conceptual design image
    generated_design_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        def parse_json(val, default):
            if not val:
                return default
            if isinstance(val, (dict, list)):
                return val
            try:
                return json.loads(val)
            except Exception:
                return default

        return {
            "id": self.id,
            "name": self.name,
            "room_type": self.room_type,
            "dimensions": parse_json(self.dimensions, {}),
            "image_id": self.image_id,
            "image_url": self.image_url,
            "selected_style": self.selected_style,
            "selected_colors": parse_json(self.selected_colors, {}),
            "furniture_selections": parse_json(self.furniture_selections, []),
            "recommendations": parse_json(self.recommendations, {}),
            "budget_data": parse_json(self.budget_data, {}),
            "generated_design_url": self.generated_design_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
