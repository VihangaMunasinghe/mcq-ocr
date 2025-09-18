from enum import Enum
from app.autograder.utils.template_parameters import get_choice_distribution, get_coordinates_of_bubbles_grid,reconstruct_bubbles
from PIL import Image

import logging

logger = logging.getLogger(__name__)

class TemplateConfigType(Enum):
    GRID_BASED = "grid_based"
    CLUSTERING_BASED = "clustering_based"

class Template:
    def __init__(self, id : int, name: str, template_img : Image, template_config : dict, config_type : TemplateConfigType):
        self.id = id
        self.name = name
        self.template_img = template_img
        self.template_config = template_config
        self.config_type = config_type
        self.bubble_coordinates = None
        self.choice_distribution = None

    def get_bubble_coordinates(self, force_recalculate=False):
        if self.bubble_coordinates is None or force_recalculate:
            logger.info(f"Getting bubble coordinates. Config type: {self.config_type}")
            if self.config_type == TemplateConfigType.GRID_BASED:
                logger.info(f"Template config: {self.template_config}")
                self.bubble_coordinates = get_coordinates_of_bubbles_grid(self.template_config)
                logger.info(f"Bubble coordinates: {self.bubble_coordinates}")
            elif self.config_type == TemplateConfigType.CLUSTERING_BASED:
                logger.info(f"Template config: {self.template_config}")
                self.bubble_coordinates = reconstruct_bubbles(self.template_config)   
                logger.info(f"Bubble coordinates: {self.bubble_coordinates}")
        return self.bubble_coordinates
    
    def get_choice_distribution(self, force_recalculate=False):
        if self.choice_distribution is None or force_recalculate:
          self.choice_distribution = get_choice_distribution(self.template_config)
        return self.choice_distribution

    def __str__(self):
        return f"Template(id={self.id}, name={self.name})"