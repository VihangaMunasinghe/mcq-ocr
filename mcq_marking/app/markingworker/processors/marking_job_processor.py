"""
Marking job processor.
Handles processing of marking jobs for answer sheets.
"""

import logging
from typing import Dict, Any, Optional, Callable, Union
from app.markingworker.job_processor_interface import JobProcessorInterface
from app.models.marking_job import MarkingJob


logger = logging.getLogger(__name__)


class MarkingJobProcessor(JobProcessorInterface):
    """
    Processor for marking jobs.
    Handles the marking of student answer sheets.
    """
    
    def __init__(
        self, 
        job_data: Dict[str, Any], 
        progress_callback: Optional[Callable] = None,
        rabbitmq_url: Optional[str] = None
    ):
        """
        Initialize the marking job processor.
        
        Args:
            job_data: Dictionary containing marking job parameters
            progress_callback: Optional callback function to report progress
            rabbitmq_url: RabbitMQ connection URL for publishing progress
        """
        super().__init__(job_data, progress_callback)
        self.rabbitmq_url = rabbitmq_url
        self.marking_job: Optional[MarkingJob] = None
    
    def validate(self) -> bool:
        """
        Validate the marking job data.
        
        Returns:
            True if job data is valid, False otherwise
        """
        required_fields = ['id', 'answer_sheets_folder', 'marking_scheme_config_path']
        
        for field in required_fields:
            if field not in self.job_data:
                logger.error(f"Missing required field: {field}")
                return False
        
        return True
    
    def process(self) -> bool:
        """
        Process the marking job.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.validate():
                logger.error(f"Marking job validation failed: {self.job_id}")
                return False
            
            logger.info(f"Processing marking job: {self.job_id}")
            
            # Create and execute the marking job
            self.marking_job = MarkingJob(
                self.job_data, 
                self.progress_callback, 
                rabbitmq_url=self.rabbitmq_url
            )
            result = self.marking_job.mark_answers()
            
            if result:
                logger.info(f"Marking job completed successfully: {self.job_id}")
                return True
            else:
                logger.error(f"Marking job failed: {self.job_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error processing marking job {self.job_id}: {e}")
            return False

