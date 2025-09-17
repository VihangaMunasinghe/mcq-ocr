import os
from app.markingworker.markingworker import MCQMarkingWorker


def main():
    # Get RabbitMQ URL from environment variable or use default
    rabbitmq_url = os.getenv('RABBITMQ_URL', 'amqp://admin:secret@localhost:5672/')
    
    worker = MCQMarkingWorker(rabbitmq_url)
    worker.run()

if __name__ == "__main__":
    main()