# a class for recieving index recognition results from rabbitmq and save to temp store and notify marking job worker
import pika
import logging
import threading
import json
from app.utils.EventRegistery import EventRegistery
from app.utils.ThreadSafeDict import ThreadSafeDict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# the thread function in listner
def run(channel, queue_name, on_message_callback):
    channel.basic_consume(queue=queue_name, on_message_callback=on_message_callback, auto_ack=True)
    logger.info(f"Started consuming messages from {queue_name}")
    channel.start_consuming()

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
        logger.info("Starting IndexListner...")
        # Start the message consuming in a separate thread
        threading.Thread(target=run, args=(self.channel, self.queue_name, self.on_message), daemon=True).start()
    def on_message(self, ch, method, properties, body):
        try:
            message = body.decode('utf-8')
            # get the task_id from message
            task = json.loads(message)
            task_id = task.get('task_id')
            if task_id is None:
                logger.error("Received message without task_id")
                return
            # log received message
            logger.info(f"Received index recognition result for task_id: {task_id}")
            logger.info(f"Message content: {message}")

        except Exception as e:
            logger.error(f"Error processing message: {e}")