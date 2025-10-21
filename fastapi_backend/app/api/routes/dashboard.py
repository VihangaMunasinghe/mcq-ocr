from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, cast
from sqlalchemy.types import TIMESTAMP
from typing import List
import logging
from datetime import datetime

from app.database import get_async_db
from app.models.user import User
from app.models.template import Template, TemplateConfigType, TemplateConfigStatus
from app.models.marking_job import MarkingJob, MarkingJobStatus
from app.schemas.dashboard import (
    DashboardStatsResponse,
    KeyStatsResponse,
    RecentMarkingJobResponse,
    RecentTemplateResponse,
    ConfigTypeComparison,
    UserActivityResponse
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    user_id: int = 1,  # TODO: Get from authentication token
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get comprehensive dashboard statistics including:
    - User information
    - Key statistics (users, templates, marking jobs, completion rate)
    - Recent marking jobs (last 5)
    - Recent templates (last 3)
    - Config type comparison (grid_based vs cluster_based)
    - User recent activities
    """
    try:
        # 1. Get user information
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.email
        
        # 2. Get key statistics
        # Total users count
        total_users_result = await db.execute(
            select(func.count(User.id))
        )
        total_users = total_users_result.scalar() or 0
        
        # Active templates count (status = COMPLETED)
        active_templates_result = await db.execute(
            select(func.count(Template.id)).where(
                Template.status == TemplateConfigStatus.COMPLETED
            )
        )
        active_templates = active_templates_result.scalar() or 0
        
        # Completed marking jobs count
        completed_jobs_result = await db.execute(
            select(func.count(MarkingJob.id)).where(
                MarkingJob.status == MarkingJobStatus.COMPLETED
            )
        )
        completed_jobs = completed_jobs_result.scalar() or 0
        
        # Overall completion rate
        total_jobs_result = await db.execute(
            select(func.count(MarkingJob.id)).where(
                MarkingJob.status.in_([
                    MarkingJobStatus.COMPLETED,
                    MarkingJobStatus.FAILED,
                    MarkingJobStatus.CANCELLED
                ])
            )
        )
        total_finished_jobs = total_jobs_result.scalar() or 0
        completion_rate = (completed_jobs / total_finished_jobs * 100) if total_finished_jobs > 0 else 0
        
        key_stats = KeyStatsResponse(
            total_users=total_users,
            active_templates=active_templates,
            completed_marking_jobs=completed_jobs,
            completion_rate=round(completion_rate, 2)
        )
        
        # 3. Get recent marking jobs (last 5)
        recent_jobs_result = await db.execute(
            select(MarkingJob, Template.name.label('template_name'))
            .join(Template, MarkingJob.template_id == Template.id)
            .order_by(MarkingJob.created_at.desc())
            .limit(5)
        )
        recent_jobs_data = recent_jobs_result.all()
        
        recent_marking_jobs = []
        for job, template_name in recent_jobs_data:
            total = job.total_answer_sheets or 0
            processed = job.processed_answer_sheets or 0
            progress = (processed / total * 100) if total > 0 else 0
            
            recent_marking_jobs.append(
                RecentMarkingJobResponse(
                    id=job.id,
                    name=job.name,
                    status=job.status,
                    priority=job.priority,
                    total_answer_sheets=job.total_answer_sheets,
                    processed_answer_sheets=job.processed_answer_sheets,
                    failed_answer_sheets=job.failed_answer_sheets,
                    progress_percentage=round(progress, 2),
                    created_at=job.created_at,
                    template_name=template_name
                )
            )
        
        # 4. Get recent templates (last 3)
        recent_templates_result = await db.execute(
            select(Template)
            .order_by(Template.created_at.desc())
            .limit(3)
        )
        recent_templates_data = recent_templates_result.scalars().all()
        
        recent_templates = [
            RecentTemplateResponse(
                id=template.id,
                name=template.name,
                description=template.description,
                config_type=template.config_type,
                status=template.status,
                num_questions=template.num_questions,
                created_at=template.created_at
            )
            for template in recent_templates_data
        ]
        
        # 5. Config type comparison (grid_based vs cluster_based)
        config_type_comparison = []
        
        for config_type in [TemplateConfigType.GRID_BASED, TemplateConfigType.CLUSTER_BASED]:
            # Count templates by type
            template_count_result = await db.execute(
                select(func.count(Template.id)).where(
                    Template.config_type == config_type
                )
            )
            template_count = template_count_result.scalar() or 0
            
            # Count marking jobs by template type
            job_count_result = await db.execute(
                select(func.count(MarkingJob.id))
                .join(Template, MarkingJob.template_id == Template.id)
                .where(Template.config_type == config_type)
            )
            job_count = job_count_result.scalar() or 0
            
            # Count completed jobs
            completed_jobs_result = await db.execute(
                select(func.count(MarkingJob.id))
                .join(Template, MarkingJob.template_id == Template.id)
                .where(
                    Template.config_type == config_type,
                    MarkingJob.status == MarkingJobStatus.COMPLETED
                )
            )
            completed_jobs_count = completed_jobs_result.scalar() or 0
            
            # Count failed jobs
            failed_jobs_result = await db.execute(
                select(func.count(MarkingJob.id))
                .join(Template, MarkingJob.template_id == Template.id)
                .where(
                    Template.config_type == config_type,
                    MarkingJob.status == MarkingJobStatus.FAILED
                )
            )
            failed_jobs_count = failed_jobs_result.scalar() or 0
            
            # Calculate completion rate for this type
            total_finished = completed_jobs_count + failed_jobs_count
            type_completion_rate = (completed_jobs_count / total_finished * 100) if total_finished > 0 else 0
            
            # Calculate average completion time per answer sheet
            # Get total time consumed and total processed answer sheets for fair average
            time_and_sheets_result = await db.execute(
                select(
                    func.sum(
                        func.extract(
                            'epoch',
                            cast(MarkingJob.processing_completed_at, TIMESTAMP)
                        ) - 
                        func.extract(
                            'epoch',
                            cast(MarkingJob.processing_started_at, TIMESTAMP)
                        )
                    ).label('total_time'),
                    func.sum(MarkingJob.processed_answer_sheets).label('total_sheets')
                )
                .join(Template, MarkingJob.template_id == Template.id)
                .where(
                    Template.config_type == config_type,
                    MarkingJob.status == MarkingJobStatus.COMPLETED,
                    MarkingJob.processing_started_at.isnot(None),
                    MarkingJob.processing_completed_at.isnot(None),
                    MarkingJob.processed_answer_sheets.isnot(None),
                    MarkingJob.processed_answer_sheets > 0
                )
            )
            result = time_and_sheets_result.first()
            total_time = result.total_time if result else None
            total_sheets = result.total_sheets if result else None
            
            # Calculate average time per answer sheet
            avg_time = (total_time / total_sheets) if (total_time and total_sheets and total_sheets > 0) else None
            
            config_type_comparison.append(
                ConfigTypeComparison(
                    config_type=config_type.value,
                    template_count=template_count,
                    marking_job_count=job_count,
                    completed_jobs=completed_jobs_count,
                    failed_jobs=failed_jobs_count,
                    completion_rate=round(type_completion_rate, 2),
                    avg_completion_time_seconds=round(avg_time, 2) if avg_time else None
                )
            )
        
        # 6. User recent activities (last 10 activities)
        user_activities = []
        
        # Get user's recent templates
        user_templates_result = await db.execute(
            select(Template)
            .where(Template.created_by == user_id)
            .order_by(Template.created_at.desc())
            .limit(5)
        )
        user_templates = user_templates_result.scalars().all()
        
        for template in user_templates:
            user_activities.append(
                UserActivityResponse(
                    activity_type="template_created",
                    description=f"Created template: {template.name}",
                    timestamp=template.created_at,
                    related_id=template.id,
                    related_name=template.name
                )
            )
        
        # Get user's recent marking jobs
        user_jobs_result = await db.execute(
            select(MarkingJob)
            .where(MarkingJob.created_by == user_id)
            .order_by(MarkingJob.created_at.desc())
            .limit(5)
        )
        user_jobs = user_jobs_result.scalars().all()
        
        for job in user_jobs:
            if job.status == MarkingJobStatus.COMPLETED:
                activity_type = "marking_job_completed"
                description = f"Completed marking job: {job.name}"
            else:
                activity_type = "marking_job_created"
                description = f"Created marking job: {job.name}"
            
            user_activities.append(
                UserActivityResponse(
                    activity_type=activity_type,
                    description=description,
                    timestamp=job.updated_at if job.status == MarkingJobStatus.COMPLETED else job.created_at,
                    related_id=job.id,
                    related_name=job.name
                )
            )
        
        # Sort activities by timestamp and limit to 10
        user_activities.sort(key=lambda x: x.timestamp, reverse=True)
        user_activities = user_activities[:10]
        
        return DashboardStatsResponse(
            user_name=user_name,
            key_stats=key_stats,
            recent_marking_jobs=recent_marking_jobs,
            recent_templates=recent_templates,
            config_type_comparison=config_type_comparison,
            user_activities=user_activities
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard statistics: {str(e)}")
