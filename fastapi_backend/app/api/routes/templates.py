from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.schemas.template import TemplateResponse, TemplateCreate
from app.models import Template, TemplateConfigJob, TemplateConfigJobStatus
from app.models.template import TemplateConfigType
from app.models.template_config_job import TemplateConfigJobPriority
from app.database import get_async_db
from app.queue import submit_template_config_job

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])

@router.post("/", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create a new template and submit configuration job to queue
    """
    try:
        # Step 1: Add details to template table
        template_record = Template(
            name=template.name,
            description=template.description,
            config_type=template.config_type,
            total_questions=0,  # Will be updated after configuration
            options_per_question=4,  # Default, will be updated after configuration
            template_file_path=template.template_path,
            configuration_path=None,  # Will be set after processing
            created_by=1  # TODO: Get from authentication
        )
        
        db.add(template_record)
        await db.commit()
        await db.refresh(template_record)
        
        # Step 2: Generate unique paths for configuration outputs
        job_uuid = str(uuid.uuid4())
        template_config_path = f"configs/template_{template_record.id}_{job_uuid}.json"
        output_image_path = f"processed/template_{template_record.id}_{job_uuid}_warped.jpg"
        result_image_path = f"debug/template_{template_record.id}_{job_uuid}_result.jpg" if template.save_intermediate_results else None
        
        # Step 3: Add details to job table
        config_job = TemplateConfigJob(
            name=f"Config for {template.name}",
            description=f"Template configuration for {template.name}",
            config_type=template.config_type,
            template_id=template_record.id,
            template_path=template.template_path,
            template_config_path=template_config_path,
            output_image_path=output_image_path,
            result_image_path=result_image_path,
            save_intermediate_results=template.save_intermediate_results,
            status=TemplateConfigJobStatus.PENDING,
            priority=TemplateConfigJobPriority.NORMAL,
            created_by=1  # TODO: Get from authentication
        )
        
        db.add(config_job)
        await db.commit()
        await db.refresh(config_job)
        
        # Step 4: Put the message to queue (in background)
        background_tasks.add_task(submit_template_config_job, config_job.id, db)
        
        # Step 5: Return the response
        return TemplateResponse(
            id=str(template_record.id),
            name=template_record.name,
            description=template_record.description,
            config_type=template_record.config_type,
            configuration_path=template_config_path,
            template_file_path=template_record.template_file_path,
            total_questions=template_record.total_questions,
            options_per_question=template_record.options_per_question,
            save_intermediate_results=template.save_intermediate_results,
            created_at=template_record.created_at,
            updated_at=template_record.updated_at,
            created_by=str(template_record.created_by)
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template: {str(e)}"
        )

@router.get("/", response_model=List[TemplateResponse])
async def list_templates():
    """
    List all templates
    """
    # TODO: Implement template listing logic
    return []

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str):
    """
    Get template details by ID
    """
    # TODO: Implement template retrieval logic
    raise HTTPException(status_code=404, detail="Template not found")

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(template_id: str, template: TemplateCreate):
    """
    Update a template by ID
    """
    # TODO: Implement template update logic
    raise HTTPException(status_code=404, detail="Template not found")

@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """
    Delete a template by ID
    """
    # TODO: Implement template deletion logic
    return {"message": "Template deleted successfully"}


