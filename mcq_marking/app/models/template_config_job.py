import json

import cv2
from mcq_marking.app.templateconfig.config import get_config
from mcq_marking.app.utils.file_handelling import save_image, write_json


class TemplateConfigJob:
    def __init__(self, id : int, name : str, template_path : str, template_config_path : str, output_image_path : str):
        self.id = id
        self.name = name
        self.template_path = template_path
        self.template_config_path = template_config_path
        self.output_image_path = output_image_path

    def configure(self, want_intermediate_results=False):
        bubble_configs, warped_img, result_img = get_config(self.template_path, want_intermediate_results)
        write_json(self.template_config_path, bubble_configs)
        save_image(self.output_image_path, warped_img)
        
        return bubble_configs, warped_img, result_img
            

    def __str__(self):
        return f"TemplateConfigJob(id={self.id}, name={self.name})"