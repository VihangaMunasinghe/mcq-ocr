# a class for recieving index recognition results from rabbitmq and save to temp store and notify marking job worker
import pika
import logging
from app.utils.EventRegistery import EventRegistery
from app.utils.ThreadSafeDict import ThreadSafeDict

# Configure logging
logger = logging.getLogger(__name__)

class IndexListner:
    def __init__(self, rabbitmq_url: str, event_registery: EventRegistery, temp_data_store: ThreadSafeDict, queue_name: str = 'index_results_queue'):
        self.rabbitmq_url = rabbitmq_url
        self.event_registery = event_registery
        self.temp_data_store = temp_data_store
        self.queue_name = queue_name

        # Set up RabbitMQ connection and channel
        self.connection = pika.BlockingConnection(pika.URLParameters(self.rabbitmq_url))
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.queue_name, durable=True)

    def start(self):
        # Start consuming messages from the queue
        self.channel.basic_consume(queue=self.queue_name, on_message_callback=self.on_message, auto_ack=True)
        logger.info("IndexListner started, waiting for messages...")
        # we will make the thread here, stay tuned for more code. :)

    def on_message(self, ch, method, properties, body):
        try:
            message = body.decode('utf-8')
            logger.info(f"Received index result message: {message}")

            # Assuming the message is in the format "job_id:index_data"
            job_id, index_data = message.split(':', 1)

            # Store the index data in the temporary data store
            self.temp_data_store.set(job_id, index_data)
            logger.info(f"Stored index data for job_id {job_id}")

            # Notify any listeners waiting for this job_id
            self.event_registery.notify(job_id)
            logger.info(f"Notified listeners for job_id {job_id}")

        except Exception as e:
            logger.error(f"Error processing message: {e}")