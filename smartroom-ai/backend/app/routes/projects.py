import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.report_service import generate_pdf_report

router = APIRouter(prefix="/projects", tags=["Project Management"])

def serialize_field(val, default):
    if val is None:
        return default
    if isinstance(val, (dict, list)):
        return json.dumps(val)
    return str(val)

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(req: ProjectCreate, db: Session = Depends(get_db)):
    """Creates a new room interior design project."""
    try:
        new_project = Project(
            name=req.name,
            room_type=req.room_type,
            dimensions=serialize_field(req.dimensions, "{}"),
            image_id=req.image_id,
            image_url=req.image_url,
            selected_style=req.selected_style,
            selected_colors=serialize_field(req.selected_colors, "{}"),
            furniture_selections=serialize_field(req.furniture_selections, "[]"),
            recommendations=serialize_field(req.recommendations, "{}"),
            budget_data=serialize_field(req.budget_data, "{}"),
            generated_design_url=req.generated_design_url
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        return ProjectResponse(**new_project.to_dict())
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    room_type: Optional[str] = Query(None, description="Filter by room type"),
    style: Optional[str] = Query(None, description="Filter by design style"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Lists saved projects with optional filtering."""
    query = db.query(Project)
    if room_type:
        query = query.filter(Project.room_type == room_type.lower())
    if style:
        query = query.filter(Project.selected_style == style.lower())
    
    projects = query.order_by(Project.updated_at.desc()).offset(skip).limit(limit).all()
    return [ProjectResponse(**p.to_dict()) for p in projects]

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """Retrieves full details of a saved project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    return ProjectResponse(**project.to_dict())

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: int, req: ProjectUpdate, db: Session = Depends(get_db)):
    """Updates an existing room project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    try:
        if req.name is not None:
            project.name = req.name
        if req.room_type is not None:
            project.room_type = req.room_type
        if req.dimensions is not None:
            project.dimensions = serialize_field(req.dimensions, "{}")
        if req.image_id is not None:
            project.image_id = req.image_id
        if req.image_url is not None:
            project.image_url = req.image_url
        if req.selected_style is not None:
            project.selected_style = req.selected_style
        if req.selected_colors is not None:
            project.selected_colors = serialize_field(req.selected_colors, "{}")
        if req.furniture_selections is not None:
            project.furniture_selections = serialize_field(req.furniture_selections, "[]")
        if req.recommendations is not None:
            project.recommendations = serialize_field(req.recommendations, "{}")
        if req.budget_data is not None:
            project.budget_data = serialize_field(req.budget_data, "{}")
        if req.generated_design_url is not None:
            project.generated_design_url = req.generated_design_url
        
        project.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(project)
        return ProjectResponse(**project.to_dict())
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Deletes a saved project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    
    try:
        db.delete(project)
        db.commit()
        return {"ok": True, "message": f"Project {project_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )

@router.get("/{project_id}/report")
async def download_project_report(project_id: int, db: Session = Depends(get_db)):
    """Generates and downloads a comprehensive PDF project report."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    try:
        pdf_bytes = generate_pdf_report(project)
        safe_title = "".join(c for c in project.name if c.isalnum() or c in (" ", "-", "_")).strip()
        filename = f"{safe_title or 'project'}_{project_id}_report.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF report generation failed: {str(e)}"
        )
