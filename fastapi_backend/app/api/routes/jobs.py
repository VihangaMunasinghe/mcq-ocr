"""
API routes for job management and queue operations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from ...database import get_async_db
from ...models import MarkingJob, TemplateConfigJob, MarkingJobStatus, TemplateConfigJobStatus, User, Template
from ...queue import submit_template_config_job, submit_marking_job
from ...api.deps import get_database_session

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


# Pydantic models for requests/responses
class TemplateConfigJobCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config_type: str = "grid_based"  # grid_based or clustering_based
    template_id: int
    template_path: str
    template_config_path: str
    output_image_path: str
    result_image_path: Optional[str] = None
    save_intermediate_results: bool = False
    priority: str = "normal"


class MarkingJobCreate(BaseModel):
    name: str
    description: Optional[str] = None
    template_id: int
    marking_scheme_path: str
    answer_sheets_folder_path: str
    output_path: str
    intermediate_results_path: Optional[str] = None
    save_intermediate_results: bool = False
    priority: str = "normal"


class JobResponse(BaseModel):
    id: int
    name: str
    status: str
    created_at: str
    
    class Config:
        from_attributes = True


# Template Configuration Job Routes
@router.post("/template-config", response_model=JobResponse)
async def create_template_config_job(
    job_data: TemplateConfigJobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_database_session)
):
    """Create and submit a template configuration job."""
    try:
        # Validate template exists
        template_result = await db.get(Template, job_data.template_id)
        if not template_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {job_data.template_id} not found"
            )
        
        # Create job in database
        job = TemplateConfigJob(
            name=job_data.name,
            description=job_data.description,
            config_type=job_data.config_type,
            template_id=job_data.template_id,
            template_path=job_data.template_path,
            template_config_path=job_data.template_config_path,
            output_image_path=job_data.output_image_path,
            result_image_path=job_data.result_image_path,
            save_intermediate_results=job_data.save_intermediate_results,
            priority=job_data.priority,
            status=TemplateConfigJobStatus.PENDING,
            created_by=1  # TODO: Get from authentication
        )
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        # Submit to queue in background
        background_tasks.add_task(submit_template_config_job, job.id, db)
        
        return JobResponse(
            id=job.id,
            name=job.name,
            status=job.status.value,
            created_at=job.created_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template config job: {str(e)}"
        )


@router.post("/marking", response_model=JobResponse)
async def create_marking_job(
    job_data: MarkingJobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_database_session)
):
    """Create and submit a marking job."""
    try:
        # Validate template exists
        template_result = await db.get(Template, job_data.template_id)
        if not template_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {job_data.template_id} not found"
            )
        
        # Create job in database
        job = MarkingJob(
            name=job_data.name,
            description=job_data.description,
            template_id=job_data.template_id,
            marking_scheme_path=job_data.marking_scheme_path,
            answer_sheets_folder_path=job_data.answer_sheets_folder_path,
            output_path=job_data.output_path,
            intermediate_results_path=job_data.intermediate_results_path,
            save_intermediate_results=job_data.save_intermediate_results,
            priority=job_data.priority,
            status=MarkingJobStatus.PENDING,
            created_by=1  # TODO: Get from authentication
        )
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        # Submit to queue in background
        background_tasks.add_task(submit_marking_job, job.id, db)
        
        return JobResponse(
            id=job.id,
            name=job.name,
            status=job.status.value,
            created_at=job.created_at.isoformat()
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create marking job: {str(e)}"
        )


# Job Status and Management Routes
@router.get("/template-config", response_model=List[JobResponse])
async def list_template_config_jobs(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_database_session)
):
    """List template configuration jobs."""
    try:
        query = select(TemplateConfigJob)
        
        if status_filter:
            query = query.where(TemplateConfigJob.status == status_filter)
        
        query = query.offset(skip).limit(limit).order_by(TemplateConfigJob.created_at.desc())
        
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        return [
            JobResponse(
                id=job.id,
                name=job.name,
                status=job.status.value,
                created_at=job.created_at.isoformat()
            )
            for job in jobs
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list template config jobs: {str(e)}"
        )


@router.get("/marking", response_model=List[JobResponse])
async def list_marking_jobs(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_database_session)
):
    """List marking jobs."""
    try:
        query = select(MarkingJob)
        
        if status_filter:
            query = query.where(MarkingJob.status == status_filter)
        
        query = query.offset(skip).limit(limit).order_by(MarkingJob.created_at.desc())
        
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        return [
            JobResponse(
                id=job.id,
                name=job.name,
                status=job.status.value,
                created_at=job.created_at.isoformat()
            )
            for job in jobs
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list marking jobs: {str(e)}"
        )


@router.get("/template-config/{job_id}")
async def get_template_config_job(
    job_id: int,
    db: AsyncSession = Depends(get_database_session)
):
    """Get detailed information about a template configuration job."""
    try:
        job = await db.get(TemplateConfigJob, job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template config job {job_id} not found"
            )
        
        return {
            "id": job.id,
            "name": job.name,
            "description": job.description,
            "config_type": job.config_type.value if job.config_type else None,
            "status": job.status.value,
            "priority": job.priority.value,
            "template_id": job.template_id,
            "template_path": job.template_path,
            "template_config_path": job.template_config_path,
            "output_image_path": job.output_image_path,
            "result_image_path": job.result_image_path,
            "save_intermediate_results": job.save_intermediate_results,
            "original_image_width": job.original_image_width,
            "original_image_height": job.original_image_height,
            "processed_image_width": job.processed_image_width,
            "processed_image_height": job.processed_image_height,
            "processing_started_at": job.processing_started_at,
            "processing_completed_at": job.processing_completed_at,
            "processing_duration_seconds": job.processing_duration_seconds,
            "confidence_score": job.confidence_score,
            "bubble_detection_confidence": job.bubble_detection_confidence,
            "rectangle_detection_confidence": job.rectangle_detection_confidence,
            "template_config_data": job.template_config_data,
            "config_metadata": job.config_metadata,
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get template config job: {str(e)}"
        )


@router.get("/marking/{job_id}")
async def get_marking_job(
    job_id: int,
    db: AsyncSession = Depends(get_database_session)
):
    """Get detailed information about a marking job."""
    try:
        job = await db.get(MarkingJob, job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Marking job {job_id} not found"
            )
        
        return {
            "id": job.id,
            "name": job.name,
            "description": job.description,
            "status": job.status.value,
            "priority": job.priority.value,
            "template_id": job.template_id,
            "marking_scheme_path": job.marking_scheme_path,
            "answer_sheets_folder_path": job.answer_sheets_folder_path,
            "output_path": job.output_path,
            "intermediate_results_path": job.intermediate_results_path,
            "save_intermediate_results": job.save_intermediate_results,
            "total_answer_sheets": job.total_answer_sheets,
            "processed_answer_sheets": job.processed_answer_sheets,
            "failed_answer_sheets": job.failed_answer_sheets,
            "completion_percentage": job.completion_percentage,
            "success_rate": job.success_rate,
            "processing_started_at": job.processing_started_at,
            "processing_completed_at": job.processing_completed_at,
            "processing_duration_seconds": job.processing_duration_seconds,
            "error_message": job.error_message,
            "error_details": job.error_details,
            "results_summary": job.results_summary,
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get marking job: {str(e)}"
        )
