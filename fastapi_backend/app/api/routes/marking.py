from fastapi import APIRouter, HTTPException
from sqlalchemy import select
import logging

from app.models.marking_job import MarkingJob, MarkingJobStatus
from app.schemas.marking import MarkingCreate, MarkingResponse
from app.database import get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from typing import List

router = APIRouter(prefix="api/markings", tags=['markings'])

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
              marking_scheme_path=marking.marking_scheme_path,
              answer_sheets_folder_path=marking.answer_sheets_folder_path,
              intermediate_results_path=marking.intermediate_results_path,
              output_path=marking.output_path,
              save_intermediate_results=marking.save_intermediate_results,
              total_answer_sheets=marking.total_answer_sheets,
              processed_answer_sheets=marking.processed_answer_sheets,
              failed_answer_sheets=marking.failed_answer_sheets,
              processing_started_at=marking.processing_started_at,
              processing_completed_at=marking.processing_completed_at,
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


@router.post("/", response_model=MarkingResponse)
async def create_marking(
    marking: MarkingCreate,
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
          marking_scheme_path=marking.marking_scheme_path,
          answer_sheets_folder_path=marking.answer_sheets_folder_path,
          intermediate_results_path=marking.intermediate_results_path,
          output_path=marking.output_path,
          save_intermediate_results=marking.save_intermediate_results,
          priority=marking.priority,
          created_by=user_id
        )
        db.add(marking_record)
        await db.commit()
        await db.refresh(marking_record)
        marking_response = MarkingResponse(
          id=marking_record.id,
          name=marking_record.name,
          description=marking_record.description,
          status=marking_record.status,
          priority=marking_record.priority,
          template_id=marking_record.template_id,
          marking_scheme_path=marking_record.marking_scheme_path,
          answer_sheets_folder_path=marking_record.answer_sheets_folder_path,
          intermediate_results_path=marking_record.intermediate_results_path,
          output_path=marking_record.output_path,
          save_intermediate_results=marking_record.save_intermediate_results,
          total_answer_sheets=marking_record.total_answer_sheets,
          processed_answer_sheets=marking_record.processed_answer_sheets,
          failed_answer_sheets=marking_record.failed_answer_sheets,
          processing_started_at=marking_record.processing_started_at,
          processing_completed_at=marking_record.processing_completed_at,
          results_summary=marking_record.results_summary,
          created_at=marking_record.created_at,
          updated_at=marking_record.updated_at,
          created_by=marking_record.created_by
        )
        return marking_response
    except Exception as e:
        logger.error(f"Failed to create marking: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create marking")
