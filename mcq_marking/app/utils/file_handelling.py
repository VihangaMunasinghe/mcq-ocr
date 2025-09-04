import json
import os
from PIL import Image
import cv2


def read_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def write_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f)

def read_image(path, convert_to_grayscale=False):
    if convert_to_grayscale:
        return Image.open(path).convert('L')
    else:
        return Image.open(path)

def save_image(path, image):
    if hasattr(image, 'save'):
        image.save(path)
    else:
        cv2.imwrite(path, image)

def read_answer_sheet_paths(folder_path):
    return sorted(os.listdir(folder_path))