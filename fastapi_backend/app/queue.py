"""
RabbitMQ queue management for MCQ OCR System.
Handles producers and consumers for template configuration and marking jobs.
"""

import json
import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timezone
import aio_pika
from aio_pika import Connection, Channel, Queue, Message, ExchangeType
from aio_pika.abc import AbstractIncomingMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from .config import get_settings
from .database import get_async_db, AsyncSessionLocal
from .models import MarkingJob, TemplateConfigJob, MarkingJobStatus, TemplateConfigJobStatus

logger = logging.getLogger(__name__)
settings = get_settings()


class RabbitMQManager:
    """
    RabbitMQ connection and queue management.
    """
    
    def __init__(self):
        self.connection: Optional[Connection] = None
        self.channel: Optional[Channel] = None
        self.queues: Dict[str, Queue] = {}
        self.exchange = None
        
    async def connect(self):
        """Establish connection to RabbitMQ with retry logic."""
        max_retries = 5
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempting to connect to RabbitMQ (attempt {attempt + 1}/{max_retries})...")
                logger.info(f"Using RabbitMQ URL: {settings.rabbitmq.rabbitmq_url}")
                
                self.connection = await aio_pika.connect_robust(
                    settings.rabbitmq.rabbitmq_url,
                    heartbeat=60,
                    client_properties={"connection_name": "MCQ-OCR-FastAPI"}
                )
                self.channel = await self.connection.channel()
                await self.channel.set_qos(prefetch_count=1)
                
                # Create exchange for routing
                self.exchange = await self.channel.declare_exchange(
                    "mcq_ocr", 
                    ExchangeType.DIRECT,
                    durable=True
                )
                
                # Declare queues
                await self._declare_queues()
                
                logger.info("Connected to RabbitMQ successfully")
                return
                
            except Exception as e:
                logger.error(f"Failed to connect to RabbitMQ (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error("All connection attempts failed")
                    raise
    
    async def _declare_queues(self):
        """Declare all required queues."""
        queue_configs = [
            {
                "name": "template_config_queue",
                "routing_key": "template.config",
                "durable": True
            },
            {
                "name": "marking_job_queue", 
                "routing_key": "marking.job",
                "durable": True
            },
            {
                "name": "template_config_results",
                "routing_key": "template.config.result",
                "durable": True
            },
            {
                "name": "marking_job_results",
                "routing_key": "marking.job.result", 
                "durable": True
            }
        ]
        
        for config in queue_configs:
            queue = await self.channel.declare_queue(
                config["name"], 
                durable=config["durable"]
            )
            await queue.bind(self.exchange, config["routing_key"])
            self.queues[config["name"]] = queue
            logger.info(f"Declared queue: {config['name']}")
    
    async def disconnect(self):
        """Close RabbitMQ connection."""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Disconnected from RabbitMQ")
    
    async def publish_message(self, 
                            routing_key: str, 
                            message: Dict[str, Any],
                            priority: int = 0):
        """Publish message to exchange."""
        try:
            message_body = json.dumps(message, default=str)
            
            await self.exchange.publish(
                Message(
                    message_body.encode(),
                    priority=priority,
                    timestamp=datetime.now(timezone.utc),
                    content_type="application/json"
                ),
                routing_key=routing_key
            )
            
            logger.info(f"Published message to {routing_key}: {message.get('id', 'unknown')}")
            
        except Exception as e:
            logger.error(f"Failed to publish message to {routing_key}: {e}")
            raise


# Global RabbitMQ manager instance
rabbitmq_manager = RabbitMQManager()


class TemplateConfigProducer:
    """Producer for template configuration jobs."""
    
    def __init__(self, rabbitmq_manager: RabbitMQManager):
        self.rabbitmq = rabbitmq_manager
    
    async def submit_template_config_job(self, job_id: int, db: AsyncSession):
        """Submit a template configuration job to the queue."""
        try:
            # Get job from database with Template eagerly loaded to avoid async lazy-load
            result = await db.execute(
                select(TemplateConfigJob)
                .options(selectinload(TemplateConfigJob.template))
                .where(TemplateConfigJob.id == job_id)
            )
            job = result.scalar_one_or_none()
            if not job:
                raise ValueError(f"TemplateConfigJob with id {job_id} not found")
            
            # Update job status
            job.status = TemplateConfigJobStatus.PENDING
            job.processing_started_at = datetime.now(timezone.utc).isoformat()
            await db.commit()
            
            # Create message payload
            message = job.to_job_data()
            
            # Determine priority based on job priority
            priority_map = {
                "urgent": 9,
                "high": 7,
                "normal": 5,
                "low": 1
            }
            priority = priority_map.get(job.priority.value, 5)
            
            # Publish to queue
            await self.rabbitmq.publish_message(
                routing_key="template.config",
                message=message,
                priority=priority
            )
            
            logger.info(f"Submitted template config job {job_id} to queue")
            return True
            
        except Exception as e:
            logger.error(f"Failed to submit template config job {job_id}: {e}")
            # Update job status to failed
            if 'job' in locals():
                job.status = TemplateConfigJobStatus.FAILED
                await db.commit()
            raise


class MarkingJobProducer:
    """Producer for marking jobs."""
    
    def __init__(self, rabbitmq_manager: RabbitMQManager):
        self.rabbitmq = rabbitmq_manager
    
    async def submit_marking_job(self, job_id: int, db: AsyncSession):
        """Submit a marking job to the queue."""
        try:
            # Get job from database
            result = await db.get(MarkingJob, job_id)
            if not result:
                raise ValueError(f"MarkingJob with id {job_id} not found")
            
            job = result
            
            # Update job status
            job.status = MarkingJobStatus.PENDING
            job.processing_started_at = datetime.now(timezone.utc).isoformat()
            await db.commit()
            
            # Create message payload
            message = job.to_job_data()
            
            # Determine priority based on job priority
            priority_map = {
                "urgent": 9,
                "high": 7,
                "normal": 5,
                "low": 1
            }
            priority = priority_map.get(job.priority.value, 5)
            
            # Publish to queue
            await self.rabbitmq.publish_message(
                routing_key="marking.job",
                message=message,
                priority=priority
            )
            
            logger.info(f"Submitted marking job {job_id} to queue")
            return True
            
        except Exception as e:
            logger.error(f"Failed to submit marking job {job_id}: {e}")
            # Update job status to failed
            if 'job' in locals():
                job.status = MarkingJobStatus.FAILED
                await db.commit()
            raise


class TemplateConfigResultConsumer:
    """Consumer for template configuration job results."""
    
    def __init__(self, rabbitmq_manager: RabbitMQManager):
        self.rabbitmq = rabbitmq_manager
        self.is_consuming = False
    
    async def process_template_config_result(self, message: AbstractIncomingMessage):
        """Process template configuration result message."""
        async with message.process():
            try:
                # Parse message
                result_data = json.loads(message.body.decode())
                job_id = result_data.get('job_id')
                
                if not job_id:
                    logger.error("No job_id in template config result message")
                    return
                
                # Get database session
                async for db in get_async_db():
                    try:
                        # Get job from database with Template eagerly loaded to avoid async lazy-load
                        sel = (
                            select(TemplateConfigJob)
                            .options(selectinload(TemplateConfigJob.template))
                            .where(TemplateConfigJob.id == job_id)
                        )
                        job_result = await db.execute(sel)
                        job_result = job_result.scalar_one_or_none()
                        if not job_result:
                            logger.error(f"TemplateConfigJob {job_id} not found")
                            return
                        
                        job = job_result
                        
                        # Update job with results
                        if result_data.get('success', False):
                            job.status = TemplateConfigJobStatus.COMPLETED
                            job.processing_completed_at = datetime.now(timezone.utc).isoformat()
                            
                            # Store results and update template
                            if 'template_config_path' in result_data:
                                job.template.configuration_path = result_data['template_config_path']
                            
                            if 'output_image_path' in result_data:
                                job.template.template_file_path = result_data['output_image_path']
                            
                            if 'result_image_path' in result_data:
                                job.result_image_path = result_data['result_image_path']
                            
                            # Update template with configuration results
                            if 'bubble_config' in result_data:
                                config_data = result_data['bubble_config']
                                if 'metadata' in config_data:
                                    metadata = config_data['metadata']
                                    if 'num_questions' in metadata:
                                        job.template.total_questions = metadata['num_questions']
                                    if 'num_options_per_question' in metadata:
                                        job.template.options_per_question = metadata['num_options_per_question']
                                
                            job.processing_completed_at = datetime.now(timezone.utc).isoformat()
                            
                            # Update image dimensions if provided
                            if 'image_dimensions' in result_data:
                                dims = result_data['image_dimensions']
                                job.original_image_width = dims.get('original_width')
                                job.original_image_height = dims.get('original_height')
                                job.processed_image_width = dims.get('processed_width')
                                job.processed_image_height = dims.get('processed_height')
                            
                            logger.info(f"Template config job {job_id} completed successfully")
                            
                        else:
                            job.status = TemplateConfigJobStatus.FAILED
                            error_message = result_data.get('error_message', 'Unknown error')
                            
                            logger.error(f"Template config job {job_id} failed: {error_message}")
                        
                        await db.commit()
                        
                    except Exception as e:
                        logger.error(f"Error processing template config result for job {job_id}: {e}")
                        await db.rollback()
                    finally:
                        await db.close()
                        break
                        
            except Exception as e:
                logger.error(f"Error parsing template config result message: {e}")
    
    async def start_consuming(self):
        """Start consuming template configuration result messages."""
        if self.is_consuming:
            return
        
        self.is_consuming = True
        queue = self.rabbitmq.queues.get("template_config_results")
        if not queue:
            raise RuntimeError("template_config_results queue not found")
        
        logger.info("Starting template config result consumer")
        
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                if not self.is_consuming:
                    break
                await self.process_template_config_result(message)
    
    def stop_consuming(self):
        """Stop consuming messages."""
        self.is_consuming = False


class MarkingJobResultConsumer:
    """Consumer for marking job results."""
    
    def __init__(self, rabbitmq_manager: RabbitMQManager):
        self.rabbitmq = rabbitmq_manager
        self.is_consuming = False
    
    async def process_marking_job_result(self, message: AbstractIncomingMessage):
        """Process marking job result message."""
        async with message.process():
            try:
                # Parse message
                result_data = json.loads(message.body.decode())
                job_id = result_data.get('job_id')
                
                if not job_id:
                    logger.error("No job_id in marking job result message")
                    return
                
                # Get database session
                async for db in get_async_db():
                    try:
                        # Get job from database
                        job_result = await db.get(MarkingJob, job_id)
                        if not job_result:
                            logger.error(f"MarkingJob {job_id} not found")
                            return
                        
                        job = job_result
                        
                        # Update job with results
                        if result_data.get('success', False):
                            job.status = MarkingJobStatus.COMPLETED
                            job.processing_completed_at = datetime.utcnow().isoformat()
                            
                            # Store processing metrics
                            if 'total_answer_sheets' in result_data:
                                job.total_answer_sheets = result_data['total_answer_sheets']
                            
                            if 'processed_answer_sheets' in result_data:
                                job.processed_answer_sheets = result_data['processed_answer_sheets']
                            
                            if 'failed_answer_sheets' in result_data:
                                job.failed_answer_sheets = result_data['failed_answer_sheets']
                            
                            if 'processing_duration' in result_data:
                                job.processing_duration_seconds = result_data['processing_duration']
                            
                            # Store results summary
                            if 'results_summary' in result_data:
                                job.results_summary = result_data['results_summary']
                            
                            logger.info(f"Marking job {job_id} completed successfully")
                            
                        else:
                            job.status = MarkingJobStatus.FAILED
                            error_message = result_data.get('error_message', 'Unknown error')
                            
                            logger.error(f"Marking job {job_id} failed: {error_message}")
                        
                        await db.commit()
                        
                    except Exception as e:
                        logger.error(f"Error processing marking job result for job {job_id}: {e}")
                        await db.rollback()
                    finally:
                        await db.close()
                        break
                        
            except Exception as e:
                logger.error(f"Error parsing marking job result message: {e}")
    
    async def start_consuming(self):
        """Start consuming marking job result messages."""
        if self.is_consuming:
            return
        
        self.is_consuming = True
        queue = self.rabbitmq.queues.get("marking_job_results")
        if not queue:
            raise RuntimeError("marking_job_results queue not found")
        
        logger.info("Starting marking job result consumer")
        
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                if not self.is_consuming:
                    break
                await self.process_marking_job_result(message)
    
    def stop_consuming(self):
        """Stop consuming messages."""
        self.is_consuming = False


# Global producer and consumer instances
template_config_producer = TemplateConfigProducer(rabbitmq_manager)
marking_job_producer = MarkingJobProducer(rabbitmq_manager)
template_config_consumer = TemplateConfigResultConsumer(rabbitmq_manager)
marking_job_consumer = MarkingJobResultConsumer(rabbitmq_manager)


async def initialize_queue_system():
    """Initialize the complete queue system."""
    try:
        await rabbitmq_manager.connect()
        
        # Start consumers in background tasks
        asyncio.create_task(template_config_consumer.start_consuming())
        asyncio.create_task(marking_job_consumer.start_consuming())
        
        logger.info("Queue system initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize queue system: {e}")
        raise


async def shutdown_queue_system():
    """Shutdown the queue system gracefully."""
    try:
        # Stop consumers
        template_config_consumer.stop_consuming()
        marking_job_consumer.stop_consuming()
        
        # Disconnect from RabbitMQ
        await rabbitmq_manager.disconnect()
        
        logger.info("Queue system shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during queue system shutdown: {e}")


# # Convenience functions for external use
# async def submit_template_config_job(job_id: int, db: AsyncSession) -> bool:
#     """Submit a template configuration job to the queue."""
#     return await template_config_producer.submit_template_config_job(job_id, db)


# async def submit_marking_job(job_id: int, db: AsyncSession) -> bool:
#     """Submit a marking job to the queue."""
#     return await marking_job_producer.submit_marking_job(job_id, db)


# Helpers for background tasks (manage own session; avoid using request-scoped session)
async def submit_template_config_job(job_id: int) -> bool:
    """Submit a template configuration job to the queue."""
    async with AsyncSessionLocal() as session:
        return await template_config_producer.submit_template_config_job(job_id, session)

async def submit_marking_job(job_id: int) -> bool:
    """Submit a marking job to the queue."""
    async with AsyncSessionLocal() as session:
        return await marking_job_producer.submit_marking_job(job_id, session)
