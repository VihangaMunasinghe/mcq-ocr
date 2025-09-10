import pika
import json
import logging
import os
from typing import Dict, Any
from app.models.marking_job import MarkingJob
from app.models.template_config_job import TemplateConfigJob

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCQMarkingWorker:
    def __init__(self, rabbitmq_url: str = "amqp://localhost"):
        self.rabbitmq_url = rabbitmq_url
        self.connection = None
        self.channel = None
        
    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(pika.URLParameters(self.rabbitmq_url))
            self.channel = self.connection.channel()
            
            # Declare queues
            self.channel.queue_declare(queue='template_config_queue', durable=True)
            self.channel.queue_declare(queue='marking_job_queue', durable=True)
            
            logger.info("Connected to RabbitMQ")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    def process_template_config_job(self, ch, method, properties, body):
        """Process template configuration job from RabbitMQ"""
        try:
            job_data = json.loads(body)
            logger.info(f"Processing template config job: {job_data.get('id', 'unknown')}")
            
            # Create and process template config job
            template_config_job = TemplateConfigJob(job_data, save_intermediate_results=True)
            template_config_job.configure()
            
            logger.info(f"Template config job completed: {job_data.get('id', 'unknown')}")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing template config job: {e}")
            # Reject the message and don't requeue
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    
    def process_marking_job(self, ch, method, properties, body):
        """Process marking job from RabbitMQ"""
        try:
            job_data = json.loads(body)
            logger.info(f"Processing marking job: {job_data.get('id', 'unknown')}")
            
            # Create and process marking job
            marking_job = MarkingJob(job_data, save_intermediate_results=True)
            marking_job.mark_answers()
            
            logger.info(f"Marking job completed: {job_data.get('id', 'unknown')}")
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing marking job: {e}")
            # Reject the message and don't requeue
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    
    def start_consuming(self):
        """Start consuming messages from RabbitMQ queues"""
        try:
            # Set up consumers
            self.channel.basic_qos(prefetch_count=1)  # Process one message at a time
            
            # Consumer for template config jobs
            self.channel.basic_consume(
                queue='template_config_queue',
                on_message_callback=self.process_template_config_job
            )
            
            # Consumer for marking jobs
            self.channel.basic_consume(
                queue='marking_job_queue',
                on_message_callback=self.process_marking_job
            )
            
            logger.info("Starting to consume messages. Press CTRL+C to stop.")
            self.channel.start_consuming()
            
        except KeyboardInterrupt:
            logger.info("Stopping consumer...")
            self.channel.stop_consuming()
            self.connection.close()
        except Exception as e:
            logger.error(f"Error in consumer: {e}")
            raise
    
    def run(self):
        """Main run method"""
        self.connect()
        self.start_consuming()

def main():
    # Get RabbitMQ URL from environment variable or use default
    rabbitmq_url = os.getenv('RABBITMQ_URL', 'amqp://localhost')
    
    worker = MCQMarkingWorker(rabbitmq_url)
    worker.run()

if __name__ == "__main__":
    main()