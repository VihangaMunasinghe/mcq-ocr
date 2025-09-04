import json
import os
from PIL import Image
import cv2
from openpyxl import Workbook, load_workbook


def read_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def write_json(path, data):
    dir_name = os.path.dirname(path)
    if dir_name and not os.path.exists(dir_name):
        os.makedirs(dir_name)
    with open(path, 'w') as f:
        json.dump(data, f)

def read_image(path, convert_to_grayscale=False):
    if convert_to_grayscale:
        return Image.open(path).convert('L')
    else:
        return Image.open(path)

def save_image(path, image):
    dir_name = os.path.dirname(path)
    if dir_name and not os.path.exists(dir_name):
        os.makedirs(dir_name)
    if hasattr(image, 'save'):
        image.save(path)
    else:
        cv2.imwrite(path, image)

def read_answer_sheet_paths(folder_path):
    return sorted([os.path.join(folder_path, fname) for fname in os.listdir(folder_path)])

def get_spreadsheet(path, title: str):
    workbook = None
    sheet = None
    if os.path.exists(path):
        workbook = load_workbook(path)
        # Optionally, check if a sheet with the given title exists
        if title in workbook.sheetnames:
            sheet = workbook[title]
        else:
            sheet = workbook.create_sheet(title)
    else:
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = title
    return workbook, sheet

def save_spreadsheet(path, workbook):
    dir_name = os.path.dirname(path)
    if dir_name and not os.path.exists(dir_name):
        os.makedirs(dir_name)
    workbook.save(path)