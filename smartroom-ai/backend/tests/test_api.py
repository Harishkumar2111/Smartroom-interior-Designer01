import io
import sys
from pathlib import Path
import pytest

# Ensure backend directory is in path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import Project

# Initialize test client
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup projects created during testing
    db = SessionLocal()
    db.query(Project).filter(Project.name.like("Test %")).delete()
    db.commit()
    db.close()

def create_dummy_image(format="JPEG", size=(200, 200), color=(180, 200, 220)) -> bytes:
    """Creates an in-memory dummy image for upload testing."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()

# 1. Health Endpoint Test
def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "services" in data
    assert "database" in data["services"]
    assert "image_processing" in data["services"]

# 2. Image Upload Tests
def test_upload_valid_image():
    img_bytes = create_dummy_image(format="JPEG")
    files = {"file": ("room_test.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert "image_id" in data
    assert "preview_url" in data
    assert data["format"] == "JPEG"
    assert data["width"] == 200
    assert data["height"] == 200

def test_upload_invalid_file_extension():
    files = {"file": ("malicious.exe", b"fake binary payload", "application/octet-stream")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "Invalid MIME type" in detail or "Unsupported file extension" in detail

def test_upload_corrupt_image():
    files = {"file": ("corrupt.jpg", b"not an image content at all", "image/jpeg")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 400
    assert "failed image verification" in response.json()["detail"]

# 3. Room Measurement Calculator Tests
def test_measure_room():
    payload = {
        "length": 15.0,
        "width": 12.0,
        "height": 10.0,
        "unit": "feet",
        "doors": [{"width": 3.0, "height": 7.0}],
        "windows": [{"width": 4.0, "height": 4.0}]
    }
    response = client.post("/api/measure-room", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["floor_area"] == 180.0
    assert data["room_volume"] == 1800.0
    # Gross wall = 2 * 10 * (15 + 12) = 540
    assert data["gross_wall_area"] == 540.0
    # Door = 21, Window = 16 => Net = 540 - 37 = 503
    assert data["net_wall_area"] == 503.0
    assert data["dimension_source"] == "user_provided"
    assert "metric_equivalents" in data
    assert data["paint_liters_estimated"] > 0

# 4. Interior Recommendations Tests
def test_recommendations_generation():
    payload = {
        "room_type": "living_room",
        "length": 16.0,
        "width": 14.0,
        "height": 9.5,
        "unit": "feet",
        "preferred_style": "Modern",
        "budget": 200000.0
    }
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["style"] == "Modern"
    assert "wall_decor_and_paint" in data
    assert "palette" in data["wall_decor_and_paint"]
    assert len(data["wall_decor_and_paint"]["palette"]) >= 3
    assert "false_ceilings" in data
    assert "lighting_fixtures" in data
    assert "recommended_furniture" in data
    assert len(data["recommended_furniture"]) > 0
    assert "budget_allocation" in data
    assert data["budget_allocation"]["total_budget_inr"] == 200000.0

# 5. Furniture Catalog & Filtering Tests
def test_furniture_catalog():
    response = client.get("/api/furniture")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 5

def test_furniture_filtering():
    # Filter by category
    response = client.get("/api/furniture?category=Bed")
    assert response.status_code == 200
    beds = response.json()
    assert all(b["category"].lower() == "bed" for b in beds)

    # Filter by max price
    response = client.get("/api/furniture?max_price=30000")
    assert response.status_code == 200
    cheap_items = response.json()
    assert all(item["estimated_price_inr"] <= 30000 for item in cheap_items)

    # Single item
    first_id = items = client.get("/api/furniture").json()[0]["id"]
    single_res = client.get(f"/api/furniture/{first_id}")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == first_id

# 6. Room Analysis Tests (Vision / Architectural Fallback)
def test_room_analysis_fallback():
    payload = {
        "room_type": "bedroom",
        "length": 14.0,
        "width": 12.0,
        "height": 9.0,
        "unit": "feet",
        "preferred_style": "Scandinavian",
        "budget": 120000.0
    }
    response = client.post("/api/analyze-room", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["room_type"] == "bedroom"
    assert "suggested_wall_colors" in data
    assert "furniture_arrangement" in data
    assert "ai_provider_used" in data
    assert "measurement_limitations" in data

# 7. Design Generation Tests
def test_design_generation_with_uploaded_image():
    # First upload an image
    img_bytes = create_dummy_image(format="JPEG")
    upload_res = client.post("/api/upload", files={"file": ("test_room.jpg", img_bytes, "image/jpeg")})
    image_id = upload_res.json()["image_id"]

    # Generate design preview
    payload = {
        "image_id": image_id,
        "style": "Minimalist",
        "wall_color": "#D1D5DB"
    }
    gen_res = client.post("/api/generate-design", json=payload)
    assert gen_res.status_code == 200
    data = gen_res.json()
    assert data["ai_generated"] is False  # Honest reporting
    assert "conceptual_preview_available" in data["status"]
    assert data["generated_image_url"] is not None

# 8. Project CRUD & Persistence Tests
def test_project_lifecycle_and_pdf_report():
    # A. Create Project
    create_payload = {
        "name": "Test Master Bedroom",
        "room_type": "bedroom",
        "dimensions": {"length": 15, "width": 13, "height": 9.5, "unit": "feet"},
        "selected_style": "luxury",
        "selected_colors": {"main": "#F2EBE2", "accent": "#1B3B36"},
        "furniture_selections": [
            {"name": "Luxury King Bed", "category": "Bed", "estimated_price_inr": 65000}
        ],
        "budget_data": {"total": 250000}
    }
    post_res = client.post("/api/projects", json=create_payload)
    assert post_res.status_code == 201
    project = post_res.json()
    project_id = project["id"]
    assert project["name"] == "Test Master Bedroom"

    # B. List Projects
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    assert any(p["id"] == project_id for p in list_res.json())

    # C. Get Single Project
    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["selected_style"] == "luxury"

    # D. Update Project
    update_payload = {"name": "Test Master Bedroom Renamed"}
    put_res = client.put(f"/api/projects/{project_id}", json=update_payload)
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "Test Master Bedroom Renamed"

    # E. PDF Report Generation
    report_res = client.get(f"/api/projects/{project_id}/report")
    assert report_res.status_code == 200
    assert report_res.headers["content-type"] == "application/pdf"
    assert len(report_res.content) > 1000  # Valid non-empty PDF binary
    assert report_res.content[:4] == b"%PDF"

    # F. Delete Project
    del_res = client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == 200
    assert del_res.json()["ok"] is True

    # Verify 404 after deletion
    get_after_del = client.get(f"/api/projects/{project_id}")
    assert get_after_del.status_code == 404

# 9. CORS and Options Verification
def test_cors_headers():
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") in ("http://localhost:5173", "*")
