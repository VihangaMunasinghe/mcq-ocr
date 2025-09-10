import os
import pika
import json
################################ Configurations ###################
HOST = os.getenv('RABBITMQ_HOST', 'localhost')
PORT = os.getenv('RABBITMQ_PORT', 5672)



################################ Functions #######################
def send_message(queue: str, data: dict, routing_key: str = ''):
    outgoing_connection = pika.BlockingConnection(pika.ConnectionParameters(host=HOST, port=PORT))
    message = json.dumps(data)
    outgoing_channel = outgoing_connection.channel()
    outgoing_channel.queue_declare(queue=queue)
    outgoing_channel.basic_publish(exchange='', routing_key=queue, body=message)
    outgoing_connection.close()

def start_consuming(queue: str, callback: callable):
    incoming_connection = pika.BlockingConnection(pika.ConnectionParameters(host=HOST, port=PORT))
    incoming_channel = incoming_connection.channel()
    incoming_channel.queue_declare(queue=queue)
    incoming_channel.basic_consume(queue=queue, on_message_callback=callback, auto_ack=True)
    print(f" [*] Waiting for tasks in {queue}")
    incoming_channel.start_consuming()