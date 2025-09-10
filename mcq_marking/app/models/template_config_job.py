import json

import cv2
from mcq_marking.app.templateconfig.config import get_config
from mcq_marking.app.utils.file_handelling import save_image, write_json


class TemplateConfigJob:
    def __init__(self, data: dict, save_intermediate_results: bool = False):
        '''
        data is a dictionary with the following keys:
        data:
            id: int
            name: str
            template_path: str
            template_config_path: str
            output_image_path: str
        '''
        self.id = data['id']
        self.name = data['name']
        self.template_path = data['template_path']
        self.template_config_path = data['template_config_path']
        self.output_image_path = data['output_image_path']
        self.save_intermediate_results = save_intermediate_results
        self.template_config = None
        self.warped_img = None
        self.result_img = None

    def configure(self):
        bubble_configs, warped_img, result_img = get_config(self.template_path, self.save_intermediate_results)
        self.template_config = bubble_configs
        self.warped_img = warped_img
        self.result_img = result_img
        write_json(self.template_config_path, self.template_config)
        save_image(self.output_image_path, warped_img)
        
        return self.template_config, self.warped_img, self.result_img
            

    def __str__(self):
        return f"TemplateConfigJob(id={self.id}, name={self.name})"