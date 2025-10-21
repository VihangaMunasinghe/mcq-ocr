# pytest test cases for integration of Queue and the system
import pytest
import pika
import threading
import json

# This test is designed to test the integration of RabbitMQ queue with the main system.
# Make sure that RabbitMQ server is running and accessible.

# RabbitMQ configurations - should match with actual queue configurations and system configurations
RABBITMQ_URL = 'amqp://admin:secret@localhost:5673/'
INCOMING_QUEUE = 'index_results'
OUTGOING_QUEUE = 'index_tasks'

# Test File Path
TEST_FILE_PATH = 'test/resources/sample_student_sheet.jpg'

# Shared dictionary of events for communication between threads
events = {}
# Shared database for task results
results_db = {}

# We create the queue listener in a separate thread to simulate real-world usage
@pytest.fixture(scope="module", autouse=True)
def rabbit_channel():
    connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
    channel = connection.channel()
    channel.queue_declare(queue=INCOMING_QUEUE, durable=True)
    channel.queue_declare(queue=OUTGOING_QUEUE, durable=True)
    yield channel


@pytest.fixture(scope="module", autouse=True)
def start_listener(rabbit_channel):
    def callback(ch, method, properties, body):
        message = body.decode()
        task = json.loads(message)
        task_id = task.get('task_id')
        results_db[task_id] = task
        if task_id in events:
            events[task_id].set()
        else:
            raise ValueError(f"Received task_id {task_id} not in events dictionary")

    def listen():
        rabbit_channel.basic_consume(queue=INCOMING_QUEUE, on_message_callback=callback, auto_ack=True)
        print(f" [*] Waiting for messages in {INCOMING_QUEUE}")
        rabbit_channel.start_consuming()

    listener_thread = threading.Thread(target=listen, daemon=True)
    listener_thread.start()
    yield
    rabbit_channel.stop_consuming()
    listener_thread.join()

def test_queue_integration(rabbit_channel):
    file_path = TEST_FILE_PATH
    # Unique task ID for tracking
    task_id = 'test_task_001'
    task = {
        'task_id': task_id,
        'file_path': file_path
    }
    message = json.dumps(task)
    # Create an event for this task_id
    index_event = threading.Event()
    events[task_id] = index_event
    # Send message to the outgoing queue
    rabbit_channel.basic_publish(exchange='', routing_key=OUTGOING_QUEUE, body=message)
    print(f" [x] Sent task to {OUTGOING_QUEUE}")
    # Wait for the event to be set by the listener callback
    event_set = index_event.wait(timeout=30)  # Wait up to 30 seconds
    assert event_set, "Did not receive response in time"
    # Check results in the shared database
    assert task_id in results_db, "Task ID not found in results"
    result = results_db[task_id]
    assert 'confidence' in result, "Result does not contain confidence"
    assert 0 <= result['confidence'] <= 1, "Confidence score out of range"
    assert 'index_number' in result, "Result does not contain recognized_index"
    assert isinstance(result['index_number'], str) and len(result['index_number']) > 0, "Invalid recognized_index"
    print(f" [x] Received result: {result}")