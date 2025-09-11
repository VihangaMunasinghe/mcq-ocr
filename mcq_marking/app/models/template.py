from app.autograder.utils.template_parameters import get_choice_distribution, get_coordinates_of_bubbles_grid,reconstruct_bubbles
from PIL import Image


class Template:
    def __init__(self, id : int, name: str, template_img : Image, template_config : dict, config_type : str):
        self.id = id
        self.name = name
        self.template_img = template_img
        self.template_config = template_config
        self.config_type = config_type
        self.bubble_coordinates = None
        self.choice_distribution = None

    def get_bubble_coordinates(self, force_recalculate=False):
        if self.bubble_coordinates is None or force_recalculate:
          if self.config_type == 'grid_based':
             self.bubble_coordinates = get_coordinates_of_bubbles_grid(self.template_config)
          if self.config_type == 'clustering_based':
             self.bubble_coordinates = reconstruct_bubbles(self.template_config)   
        return self.bubble_coordinates
    
    def get_choice_distribution(self, force_recalculate=False):
        if self.choice_distribution is None or force_recalculate:
          self.choice_distribution = get_choice_distribution(self.template_config)
        return self.choice_distribution

    def __str__(self):
        return f"Template(id={self.id}, name={self.name})"