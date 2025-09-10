################################ Imports ##########################
import Detector
import Recognizer
import numpy as np
import cv2
import os,sys
import json
from task_queue.rabbitMQ import send_message, start_consuming

################################ Configurations ###################
INCOMING_QUEUE = os.getenv('RABBITMQ_INCOMING_QUEUE', 'rabbitmq_incoming_queue')
OUTGOING_QUEUE = os.getenv('RABBITMQ_OUTGOING_QUEUE', 'rabbitmq_outgoing_queue')

################################ Functions ##########################
def preprocess(file_path) -> np.ndarray:
    print(f"Preprocessing file: {file_path}")
    image = cv2.imread(file_path)
    return image
    # Add preprocessing code here
def postprocess(data):
    print(f"Postprocessing data...")
    return data
    # Add postprocessing code here

def callback(ch, method, properties, body):
    print(" [x] Received task")
    task = json.loads(body)
    file_path = task['file_path']
    task_id = task['task_id']
    
    ## Detect the index section from the input image
    image = preprocess(file_path)
    index_image = Detector.get_index_section(image)
    print(f"Index section extracted.")
    data = Recognizer.recognize_student_index(index_image)
    data = postprocess(data)
    print(f"data: {data}")

    ## Send the result to the outgoing queue
    result = {
        'file_path': file_path,
        'data': data,
        'task_id': task_id
    }
    send_message(OUTGOING_QUEUE, result)
    print(" [x] Task completed and result sent")

################################ Main Code ##########################
def main():
    start_consuming(INCOMING_QUEUE, callback)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)