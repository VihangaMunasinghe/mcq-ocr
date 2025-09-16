from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.schemas.template import TemplateResponse, TemplateCreate
from app.models import Template, TemplateConfigJob, TemplateConfigJobStatus
from app.models.template import TemplateConfigType
from app.models.template_config_job import TemplateConfigJobPriority
from typing import Optional
from app.database import get_async_db
from app.queue import submit_template_config_job

router = APIRouter(prefix="/api/templates", tags=["templates"])

@router.post("/", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create a new template and submit configuration job to queue
    """
    user_id = 1 # TODO: Get from authentication
    job_uuid = uuid.uuid4().hex[:8]
    try:
        # Step 1: Add details to template table
        template_record = Template(
            name=template.name,
            description=template.description,
            config_type=template.config_type,
            total_questions=0,  # Will be updated after configuration
            options_per_question=5,  # Default, will be updated after configuration
            template_file_path=None,
            configuration_path=None,  # Will be set after processing
            created_by=user_id
        )
        
        db.add(template_record)
        await db.commit()
        await db.refresh(template_record)
        
        template_config_path = f"templates/{user_id}/{template_record.id}_{job_uuid}_config.json"
        output_image_path = f"templates/{user_id}/{template_record.id}_{job_uuid}_template.jpg"
        result_image_path = f"intermediate/templates/{user_id}/{template_record.id}_{job_uuid}_result.jpg" if template.save_intermediate_results else None
        template_record.configuration_path = template_config_path
        
        template_record.template_file_path = output_image_path
        template_record.total_questions = 0
        template_record.options_per_question = 5
        await db.commit()
        await db.refresh(template_record)
        
        # Step 3: Add details to job table
        config_job = TemplateConfigJob(
            job_uuid=job_uuid,
            name=f"Config for {template.name}",
            description=f"Template configuration for {template.name}",
            template_id=template_record.id,
            template_path=template.template_path,
            template_config_path=template_config_path,
            output_image_path=output_image_path,
            result_image_path=result_image_path,
            save_intermediate_results=template.save_intermediate_results,
            status=TemplateConfigJobStatus.PENDING,
            priority=TemplateConfigJobPriority.NORMAL,
            num_of_columns=template.num_of_columns,
            num_of_rows_per_column=template.num_of_rows_per_column,
            num_of_options_per_question=template.num_of_options_per_question,
            created_by=user_id
        )
        
        db.add(config_job)
        await db.commit()
        await db.refresh(config_job)
        
        # Step 4: Put the message to queue (in background)
        await submit_template_config_job(config_job.id, db)
        
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
            created_at=template_record.created_at,
            updated_at=template_record.updated_at,
            created_by=template_record.created_by
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template: {str(e)}"
        )

@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    config_type: Optional[TemplateConfigType] = None,
    db: AsyncSession = Depends(get_async_db)
):
    """
    List all templates
    """
    user_id = 1 # TODO: Get from authentication
    try:
        query = select(Template)
        query = query.where(Template.created_by == user_id)
        
        if config_type:
            query = query.where(Template.config_type == config_type)
        
        query = query.offset(skip).limit(limit).order_by(Template.created_at.desc())
        
        result = await db.execute(query)
        templates = result.scalars().all()
        
        return [
            TemplateResponse(
                id=str(template.id),
                name=template.name,
                description=template.description,
                config_type=template.config_type,
                configuration_path=template.configuration_path or "",
                template_file_path=template.template_file_path or "",
                total_questions=template.total_questions,
                options_per_question=template.options_per_question,
                created_at=template.created_at,
                updated_at=template.updated_at,
                created_by=template.created_by
            )
            for template in templates
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list templates: {str(e)}"
        )

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get template details by ID
    """
    user_id = 1 # TODO: Get from authentication
    try:
        template = await db.get(Template, template_id)
        if not template or template.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {template_id} not found"
            )
        
        return TemplateResponse(
            id=str(template.id),
            name=template.name,
            description=template.description,
            config_type=template.config_type,
            configuration_path=template.configuration_path or "",
            template_file_path=template.template_file_path or "",
            total_questions=template.total_questions,
            options_per_question=template.options_per_question,
            save_intermediate_results=template.save_intermediate_results,
            created_at=template.created_at,
            updated_at=template.updated_at,
            created_by=template.created_by
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get template: {str(e)}"
        )

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template_update: TemplateCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update a template by ID
    """
    user_id = 1 # TODO: Get from authentication
    try:
        template = await db.get(Template, template_id)
        if not template or template.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {template_id} not found"
            )
        
        # Update template fields
        template.name = template_update.name
        template.description = template_update.description
        template.config_type = template_update.config_type
        template.template_file_path = template_update.template_path
        
        await db.commit()
        await db.refresh(template)
        
        return TemplateResponse(
            id=str(template.id),
            name=template.name,
            description=template.description,
            config_type=template.config_type,
            configuration_path=template.configuration_path or "",
            template_file_path=template.template_file_path or "",
            total_questions=template.total_questions,
            options_per_question=template.options_per_question,
            save_intermediate_results=template_update.save_intermediate_results,
            created_at=template.created_at,
            updated_at=template.updated_at,
            created_by=template.created_by
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update template: {str(e)}"
        )

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete a template by ID
    """
    user_id = 1 # TODO: Get from authentication
    try:
        template = await db.get(Template, template_id)
        if not template or template.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {template_id} not found"
            )
        
        await db.delete(template)
        await db.commit()
        
        return {"message": f"Template {template_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete template: {str(e)}"
        )


