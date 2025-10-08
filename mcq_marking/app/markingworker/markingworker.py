import json
import logging
from datetime import datetime
from typing import Callable, Dict, Any, Optional, Union
import pika
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic, BasicProperties
from app.models.template_config_job import TemplateConfigJob
from app.models.marking_job import MarkingJob
from app.models.marking_scheme_config_job import MarkingSchemeConfigJob


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCQMarkingWorker:
    def __init__(
        self, 
        rabbitmq_url: str, 
        template_config_queue: str, 
        marking_job_queue: str, 
        marking_scheme_config_queue: str, 
        marking_job_results_queue: str, 
        template_config_results_queue: str, 
        marking_scheme_config_results_queue: str
    ) -> None:
        self.rabbitmq_url: str = rabbitmq_url
        self.template_config_queue: str = template_config_queue
        self.marking_job_queue: str = marking_job_queue
        self.marking_scheme_config_queue: str = marking_scheme_config_queue
        self.marking_job_results_queue: str = marking_job_results_queue
        self.template_config_results_queue: str = template_config_results_queue
        self.marking_scheme_config_results_queue: str = marking_scheme_config_results_queue
        self.connection: Optional[pika.BlockingConnection] = None
        self.channel: Optional[BlockingChannel] = None
        
    def connect(self) -> None:
        """Establish connection to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(pika.URLParameters(self.rabbitmq_url))
            self.channel = self.connection.channel()
            
            # Declare queues
            self.channel.queue_declare(queue=self.template_config_queue, durable=True)
            self.channel.queue_declare(queue=self.marking_job_queue, durable=True)
            self.channel.queue_declare(queue=self.marking_scheme_config_queue, durable=True)
            
            logger.info("Connected to RabbitMQ")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    def _publish_result(
        self, 
        ch: BlockingChannel, 
        properties: Optional[BasicProperties], 
        queue: str, 
        reply_data: Dict[str, Any]
    ) -> None:
        """Generic method to publish results to any queue"""
        ch.basic_publish(
            exchange='',
            routing_key=queue,
            body=json.dumps(reply_data),
            properties=pika.BasicProperties(
                content_type='application/json',
                correlation_id=properties.correlation_id if properties else None
            )
        )

    def _create_reply_data(
        self, 
        job_id: Union[int, str], 
        status: str, 
        result: Union[Dict[str, Any], str, bool]
    ) -> Dict[str, Any]:
        """Generic method to create reply data structure"""
        return {
            'job_id': job_id,
            'status': status,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }

    def _send_progress_to_backend(
        self, 
        ch: BlockingChannel, 
        properties: Optional[BasicProperties], 
        job_id: Union[int, str], 
        progress: float, 
        queue: str
    ) -> None:
        """Send progress to backend"""
        reply_data = self._create_reply_data(job_id, 'processing', {
            'progress': progress
        })
        self._publish_result(ch, properties, queue, reply_data)
        
    def _validate_job_id(self, job_data: Dict[str, Any]) -> Optional[Union[int, str]]:
        """Validate job ID and return job_id or None if invalid"""
        job_id: Union[int, str] = job_data.get('id', 'unknown')
        if job_id == 'unknown':
            logger.error("Job ID is unknown")
            return None
        return job_id

    def process_job_with_error_handling(
        self, 
        ch: BlockingChannel, 
        method: Basic.Deliver, 
        properties: BasicProperties, 
        body: bytes, 
        job_type: str, 
        reply_queue: str, 
        job_processor: Callable[[Dict[str, Any], Optional[Callable]], Union[Dict[str, Any], bool]]
    ) -> None:
        """Generic method to process jobs with error handling"""
        try:
            job_data: Dict[str, Any] = json.loads(body)
            job_id = self._validate_job_id(job_data)
            
            if job_id is None:
                reply_data = self._create_reply_data('unknown', 'failed', 'Job ID is unknown')
                self._publish_result(ch, properties, reply_queue, reply_data)
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                logger.error(f"{job_type} Job ID is unknown")
                return
            
            logger.info(f"Processing {job_type} job: {job_id}")
            
            processing_reply_data = self._create_reply_data(job_id, 'processing', {
                'progress': 0
            })
            self._publish_result(ch, properties, reply_queue, processing_reply_data)
            # Execute the job-specific processing
            result = job_processor(job_data, self._send_progress_to_backend)

            if result is False:
                reply_data = self._create_reply_data(job_id, 'failed', 'Job failed')
                self._publish_result(ch, properties, reply_queue, reply_data)
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                logger.error(f"{job_type} job failed: {job_id}")
                return
            
            logger.info(f"{job_type} job completed: {job_id}")
            
            reply_data = self._create_reply_data(job_id, 'completed', result)
            self._publish_result(ch, properties, reply_queue, reply_data)
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing {job_type} job: {e}")
            job_id = job_data.get('id', 'unknown') if 'job_data' in locals() else 'unknown'
            reply_data = self._create_reply_data(job_id, 'failed', str(e))
            self._publish_result(ch, properties, reply_queue, reply_data)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    
    def _process_template_config(
        self, 
        job_data: Dict[str, Any], 
        progress_callback: Optional[Callable] = None
    ) -> Union[Dict[str, Any], bool]:
        """Process template configuration job and return result"""
        template_config_job = TemplateConfigJob(job_data)
        success = template_config_job.configure()
        
        if success:
            return {
                'template_config_path': template_config_job.template_config_path,
                'output_image_path': template_config_job.output_image_path,
                'debug_image_path': template_config_job.debug_image_path,
                'bubble_config': template_config_job.template_config
            }
        else:
            return False

    def _process_marking_scheme_config(
        self, 
        job_data: Dict[str, Any], 
        progress_callback: Optional[Callable] = None
    ) -> Union[Dict[str, Any], bool]:
        """Process marking configuration job and return result"""
        marking_scheme_config_job = MarkingSchemeConfigJob(job_data)
        success = marking_scheme_config_job.configure()
        
        if success:
            return {
                'marking_scheme_path': marking_scheme_config_job.marking_scheme_path,
                'marking_scheme_config_path': marking_scheme_config_job.marking_scheme_config_path,
            }
        else:
            return False

    def _process_marking_job(
        self, 
        job_data: Dict[str, Any], 
        progress_callback: Optional[Callable]
    ) -> bool:
        """Process marking job and return result"""
        marking_job = MarkingJob(job_data, progress_callback, rabbitmq_url=self.rabbitmq_url)
        result = marking_job.mark_answers()
        if result:
            return True
        else:
            logger.error(f"Marking job failed: {job_data['id']}")
            return False

    def process_template_config_job(
        self, 
        ch: BlockingChannel, 
        method: Basic.Deliver, 
        properties: BasicProperties, 
        body: bytes
    ) -> None:
        """Process template configuration job from RabbitMQ"""
        self.process_job_with_error_handling(
            ch, method, properties, body,
            'template config',
            self.template_config_results_queue,
            self._process_template_config
        )

    def process_marking_scheme_config_job(
        self, 
        ch: BlockingChannel, 
        method: Basic.Deliver, 
        properties: BasicProperties, 
        body: bytes
    ) -> None:
        """Process marking configuration job from RabbitMQ"""
        self.process_job_with_error_handling(
            ch, method, properties, body,
            'marking scheme config',
            self.marking_scheme_config_results_queue,
            self._process_marking_scheme_config
        )
    

    def process_marking_job(
        self, 
        ch: BlockingChannel, 
        method: Basic.Deliver, 
        properties: BasicProperties, 
        body: bytes
    ) -> None:
        """Process marking job from RabbitMQ"""
        self.process_job_with_error_handling(
            ch, method, properties, body,
            'marking',
            self.marking_job_results_queue,
            self._process_marking_job
        )
    
    def start_consuming(self) -> None:
        """Start consuming messages from RabbitMQ queues"""
        try:
            if not self.channel:
                raise RuntimeError("Channel not initialized. Call connect() first.")
            
            # Set up consumers
            self.channel.basic_qos(prefetch_count=1)  # Process one message at a time
            
            # Consumer for template config jobs
            self.channel.basic_consume(
                queue=self.template_config_queue,
                on_message_callback=self.process_template_config_job
            )
            
            # Consumer for marking config jobs
            self.channel.basic_consume(
                queue=self.marking_scheme_config_queue,
                on_message_callback=self.process_marking_scheme_config_job
            )
            
            # Consumer for marking jobs
            self.channel.basic_consume(
                queue=self.marking_job_queue,
                on_message_callback=self.process_marking_job
            )
            
            logger.info("Starting to consume messages. Press CTRL+C to stop.")
            self.channel.start_consuming()
            
        except KeyboardInterrupt:
            logger.info("Stopping consumer...")
            if self.channel:
                self.channel.stop_consuming()
            if self.connection:
                self.connection.close()
        except Exception as e:
            logger.error(f"Error in consumer: {e}")
            raise
    
    def run(self) -> None:
        """Main run method"""
        self.connect()
        self.start_consuming()