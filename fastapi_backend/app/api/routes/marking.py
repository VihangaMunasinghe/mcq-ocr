import uuid
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
import logging

from app.models.marking_job import MarkingJob, MarkingJobStatus
from app.schemas.marking import MarkingCreateMetadata, MarkingResponse, MarkingAttachScheme, MarkingAttachAnswerSheets
from app.database import get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from typing import List

from app.queue import submit_marking_job, submit_marking_scheme_config_job

router = APIRouter(prefix="/api/markings", tags=['markings'])

logger = logging.getLogger(__name__)


@router.get('/', response_model=List[MarkingResponse])
async def list_markings(
    db: AsyncSession = Depends(get_async_db)
):
    """List all markings"""
    user_id = 1 # TODO: Get from authentication
    try:
      markings = await db.execute(select(MarkingJob).where(MarkingJob.created_by == user_id).order_by(MarkingJob.created_at.desc()))
      markings = markings.scalars().all()
      return [
          MarkingResponse(
              id=marking.id,
              name=marking.name,
              description=marking.description,
              status=marking.status,
              priority=marking.priority,
              template_id=marking.template_id,
              marking_scheme_id=marking.marking_scheme_id,
              marking_config_id=marking.marking_config_id,
              answer_sheets_folder_id=marking.answer_sheets_folder_id,
              save_intermediate_results=marking.save_intermediate_results,
              total_answer_sheets=marking.total_answer_sheets,
              processed_answer_sheets=marking.processed_answer_sheets,
              failed_answer_sheets=marking.failed_answer_sheets,
              processing_started_at=marking.processing_started_at,
              processing_completed_at=marking.processing_completed_at,
              error_message=marking.error_message,
              error_details=marking.error_details,
              results_summary=marking.results_summary,
              created_at=marking.created_at,
              updated_at=marking.updated_at,
              created_by=marking.created_by
          )
          for marking in markings
      ]
    except Exception as e:
        logger.error(f"Failed to list markings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list markings")

@router.get("/{marking_job_id}", response_model=MarkingResponse)
async def get_marking(
    marking_job_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """Get a single marking job by ID"""
    user_id = 1  # TODO: Get from authentication
    try:
        result = await db.execute(
            select(MarkingJob).where(
                MarkingJob.id == marking_job_id,
                MarkingJob.created_by == user_id
            )
        )
        marking = result.scalar_one_or_none()
        
        if not marking:
            raise HTTPException(status_code=404, detail="Marking job not found")
        
        return MarkingResponse(
            id=marking.id,
            name=marking.name,
            description=marking.description,
            status=marking.status,
            priority=marking.priority,
            template_id=marking.template_id,
            marking_scheme_id=marking.marking_scheme_id,
            marking_config_id=marking.marking_config_id,
            answer_sheets_folder_id=marking.answer_sheets_folder_id,
            save_intermediate_results=marking.save_intermediate_results,
            total_answer_sheets=marking.total_answer_sheets,
            processed_answer_sheets=marking.processed_answer_sheets,
            failed_answer_sheets=marking.failed_answer_sheets,
            processing_started_at=marking.processing_started_at,
            processing_completed_at=marking.processing_completed_at,
            error_message=marking.error_message,
            error_details=marking.error_details,
            results_summary=marking.results_summary,
            created_at=marking.created_at,
            updated_at=marking.updated_at,
            created_by=marking.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get marking job {marking_job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get marking job")

@router.post("/", response_model=MarkingResponse)
async def create_marking(
    marking: MarkingCreateMetadata,
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new marking"""
    user_id = 1 # TODO: Get from authentication
    try:
        marking_record = MarkingJob(
          name=marking.name,
          description=marking.description,
          status=MarkingJobStatus.PENDING,
          template_id=marking.template_id,
          save_intermediate_results=marking.save_intermediate_results,
          priority=marking.priority,
          created_by=user_id
        )
        db.add(marking_record)
        await db.commit()
        await db.refresh(marking_record)

        # Generate paths for future use but don't enqueue yet
        random_id = str(uuid.uuid4())[:8]
        marking_record.intermediate_results_path = f"intermediate/markings/{user_id}/{marking_record.id}_{random_id}_intermediate/"
        marking_record.result_sheet_file_path = f"results/markings/{user_id}/{marking_record.id}_{random_id}_output.xlsx"

        await db.commit()
        await db.refresh(marking_record)
        marking_response = MarkingResponse(
          id=marking_record.id,
          name=marking_record.name,
          description=marking_record.description,
          status=marking_record.status,
          priority=marking_record.priority,
          template_id=marking_record.template_id,
          marking_scheme_id=marking_record.marking_scheme_id,
          marking_config_id=marking_record.marking_config_id,
          answer_sheets_folder_id=marking_record.answer_sheets_folder_id,
          save_intermediate_results=marking_record.save_intermediate_results,
          total_answer_sheets=marking_record.total_answer_sheets,
          processed_answer_sheets=marking_record.processed_answer_sheets,
          failed_answer_sheets=marking_record.failed_answer_sheets,
          processing_started_at=marking_record.processing_started_at,
          processing_completed_at=marking_record.processing_completed_at,
          error_message=marking_record.error_message,
          error_details=marking_record.error_details,
          results_summary=marking_record.results_summary,
          created_at=marking_record.created_at,
          updated_at=marking_record.updated_at,
          created_by=marking_record.created_by
        )
        return marking_response
    except Exception as e:
        logger.error(f"Failed to create marking: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create marking")


@router.put("/{marking_job_id}", response_model=MarkingResponse)
async def update_marking(
    marking_job_id: int,
    marking: MarkingCreateMetadata,
    db: AsyncSession = Depends(get_async_db)
):
    """Update a marking"""
    user_id = 1 # TODO: Get from authentication
    try:
        marking_record = await db.get(MarkingJob, marking_job_id)
        if not marking_record:
            raise HTTPException(status_code=404, detail="Marking job not found")
        
        marking_record.name = marking.name
        marking_record.description = marking.description
        marking_record.template_id = marking.template_id
        marking_record.save_intermediate_results = marking.save_intermediate_results
        marking_record.priority = marking.priority
        await db.commit()
        await db.refresh(marking_record)
        return MarkingResponse(
            id=marking_record.id,
            name=marking_record.name,
            description=marking_record.description,
            status=marking_record.status,
            priority=marking_record.priority,
            template_id=marking_record.template_id,
            save_intermediate_results=marking_record.save_intermediate_results,
            total_answer_sheets=marking_record.total_answer_sheets,
            processed_answer_sheets=marking_record.processed_answer_sheets,
            failed_answer_sheets=marking_record.failed_answer_sheets,
            processing_started_at=marking_record.processing_started_at,
            processing_completed_at=marking_record.processing_completed_at,
            error_message=marking_record.error_message,
            error_details=marking_record.error_details,
            results_summary=marking_record.results_summary,
            created_at=marking_record.created_at,
            updated_at=marking_record.updated_at,
            created_by=marking_record.created_by
        )
    except Exception as e:
        logger.error(f"Failed to update marking: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update marking")


@router.post("/{marking_job_id}/configure-marking-scheme", response_model=MarkingResponse)
async def configure_marking(
    marking_job_id: int,
    scheme_data: MarkingAttachScheme,
    db: AsyncSession = Depends(get_async_db)
):
    """Attach marking scheme and enqueue config job"""
    user_id = 1  # TODO: Get from authentication
    try:
        # Get the marking job
        result = await db.execute(
            select(MarkingJob).where(
                MarkingJob.id == marking_job_id,
                MarkingJob.created_by == user_id
            )
        )
        marking = result.scalar_one_or_none()
        
        if not marking:
            raise HTTPException(status_code=404, detail="Marking job not found")
        
        if marking.status != MarkingJobStatus.PENDING and marking.status != MarkingJobStatus.FAILED and marking.status != MarkingJobStatus.MARKING_SCHEME_CONFIGURED:
            raise HTTPException(status_code=400, detail="Job must be in pending or failed status to configure")
        
        # Update marking scheme ID and generate marking config file path
        marking.marking_scheme_id = scheme_data.marking_scheme_id
        
        # Generate marking config file path
        random_id = str(uuid.uuid4())[:8]
        marking.marking_config_file_path = f"intermediate/markings/{user_id}/{marking.id}_{random_id}_marking_config.json"
        
        await db.commit()
        await db.refresh(marking)
        
        # Submit marking scheme configuration job to the queue
        try:
            logger.info(f"Submitting marking scheme config job for marking job {marking_job_id}")
            success = await submit_marking_scheme_config_job(marking_job_id, db)
            if success:
                marking.status = MarkingJobStatus.QUEUED
                await db.commit()
                await db.refresh(marking)
                logger.info(f"Successfully submitted marking scheme config job {marking_job_id} to queue")
            else:
                logger.error(f"Failed to submit marking scheme config job {marking_job_id} to queue")
                raise HTTPException(status_code=500, detail="Failed to submit marking scheme configuration job to queue")
        except Exception as e:
            logger.error(f"Error submitting marking scheme config job {marking_job_id}: {e}")
            marking.status = MarkingJobStatus.FAILED
            marking.error_message = f"Failed to submit job to queue: {str(e)}"
            await db.commit()
            await db.refresh(marking)
            raise HTTPException(status_code=500, detail=f"Failed to submit marking scheme configuration job: {str(e)}")
        
        return MarkingResponse(
            id=marking.id,
            name=marking.name,
            description=marking.description,
            status=marking.status,
            priority=marking.priority,
            template_id=marking.template_id,
            marking_scheme_id=marking.marking_scheme_id,
            marking_config_id=marking.marking_config_id,
            answer_sheets_folder_id=marking.answer_sheets_folder_id,
            save_intermediate_results=marking.save_intermediate_results,
            total_answer_sheets=marking.total_answer_sheets,
            processed_answer_sheets=marking.processed_answer_sheets,
            failed_answer_sheets=marking.failed_answer_sheets,
            processing_started_at=marking.processing_started_at,
            processing_completed_at=marking.processing_completed_at,
            error_message=marking.error_message,
            error_details=marking.error_details,
            results_summary=marking.results_summary,
            created_at=marking.created_at,
            updated_at=marking.updated_at,
            created_by=marking.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to configure marking job {marking_job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to configure marking job")


@router.post("/{marking_job_id}/attach-answer-sheets", response_model=MarkingResponse)
async def attach_answer_sheets(
    marking_job_id: int,
    sheets_data: MarkingAttachAnswerSheets,
    db: AsyncSession = Depends(get_async_db)
):
    """Attach answer sheets folder to marking job"""
    user_id = 1  # TODO: Get from authentication
    try:
        # Get the marking job
        result = await db.execute(
            select(MarkingJob).where(
                MarkingJob.id == marking_job_id,
                MarkingJob.created_by == user_id
            )
        )
        marking = result.scalar_one_or_none()
        
        if not marking:
            raise HTTPException(status_code=404, detail="Marking job not found")
        
        if marking.status != MarkingJobStatus.MARKING_SCHEME_CONFIGURED and marking.status != MarkingJobStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Job must be in marking scheme configured status to attach answer sheets")
        
        # Update answer sheets folder ID
        marking.answer_sheets_folder_id = sheets_data.answer_sheets_folder_id
        marking.status = MarkingJobStatus.ANSWER_SHEETS_ATTACHED
        await db.commit()
        await db.refresh(marking)
        
        logger.info(f"Answer sheets attached to job {marking_job_id}")
        
        return MarkingResponse(
            id=marking.id,
            name=marking.name,
            description=marking.description,
            status=marking.status,
            priority=marking.priority,
            template_id=marking.template_id,
            marking_scheme_id=marking.marking_scheme_id,
            marking_config_id=marking.marking_config_id,
            answer_sheets_folder_id=marking.answer_sheets_folder_id,
            save_intermediate_results=marking.save_intermediate_results,
            total_answer_sheets=marking.total_answer_sheets,
            processed_answer_sheets=marking.processed_answer_sheets,
            failed_answer_sheets=marking.failed_answer_sheets,
            processing_started_at=marking.processing_started_at,
            processing_completed_at=marking.processing_completed_at,
            error_message=marking.error_message,
            error_details=marking.error_details,
            results_summary=marking.results_summary,
            created_at=marking.created_at,
            updated_at=marking.updated_at,
            created_by=marking.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to attach answer sheets to job {marking_job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to attach answer sheets")


@router.post("/{marking_job_id}/start-marking", response_model=MarkingResponse)
async def start_marking(
    marking_job_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """Start the marking process"""
    user_id = 1  # TODO: Get from authentication
    try:
        # Get the marking job
        result = await db.execute(
            select(MarkingJob).where(
                MarkingJob.id == marking_job_id,
                MarkingJob.created_by == user_id
            )
        )
        marking = result.scalar_one_or_none()
        
        if not marking:
            raise HTTPException(status_code=404, detail="Marking job not found")
        
        if marking.status != MarkingJobStatus.ANSWER_SHEETS_ATTACHED and marking.status != MarkingJobStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Job must be in answer sheets attached status to start")
        
        # Validate preconditions
        if not marking.marking_scheme_id:
            raise HTTPException(status_code=400, detail="Marking scheme must be attached before starting")
        
        if not marking.answer_sheets_folder_id:
            raise HTTPException(status_code=400, detail="Answer sheets must be attached before starting")
        
        # TODO: Check if template config job is completed (when applicable)
        # This would check the status of any associated TemplateConfigJob
        
        # Generate result sheet file path if not already set
        if not marking.result_sheet_file_path or marking.result_sheet_file_path == 'pending':
            random_id = str(uuid.uuid4())[:8]
            marking.result_sheet_file_path = f"results/{user_id}/{marking.id}_{random_id}_output.xlsx"
            await db.commit()
            await db.refresh(marking)
        
        try:
            logger.info(f"Starting marking job {marking_job_id}")
            await submit_marking_job(marking_job_id, db)
            marking.status = MarkingJobStatus.QUEUED
            await db.commit()
            await db.refresh(marking)
            logger.info(f"Successfully submitted marking job {marking_job_id} to queue")
        except Exception as e:
            logger.error(f"Failed to submit marking job {marking_job_id} to queue: {e}")
            # Revert status to pending on queue failure
            marking.status = MarkingJobStatus.FAILED
            marking.error_message = f"Failed to submit job to queue: {str(e)}"
            await db.commit()
            raise HTTPException(status_code=500, detail="Failed to submit job to processing queue")
        
        return MarkingResponse(
            id=marking.id,
            name=marking.name,
            description=marking.description,
            status=marking.status,
            priority=marking.priority,
            template_id=marking.template_id,
            marking_scheme_id=marking.marking_scheme_id,
            marking_config_id=marking.marking_config_id,
            answer_sheets_folder_id=marking.answer_sheets_folder_id,
            save_intermediate_results=marking.save_intermediate_results,
            total_answer_sheets=marking.total_answer_sheets,
            processed_answer_sheets=marking.processed_answer_sheets,
            failed_answer_sheets=marking.failed_answer_sheets,
            processing_started_at=marking.processing_started_at,
            processing_completed_at=marking.processing_completed_at,
            error_message=marking.error_message,
            error_details=marking.error_details,
            results_summary=marking.results_summary,
            created_at=marking.created_at,
            updated_at=marking.updated_at,
            created_by=marking.created_by
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start marking job {marking_job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start marking job")
