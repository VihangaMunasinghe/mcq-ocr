from app.autograder.marking import get_answers
from PIL import Image

from app.models.template import Template


class MarkingScheme:
    def __init__(self, job_id : int, name: str, marking_scheme_img : Image, template: Template):
        self.job_id = job_id
        self.name = name
        self.template = template
        self.marking_scheme_img = marking_scheme_img
        self.answers_with_coordinates = None

    def get_answers_and_corresponding_points(self, force_recalculate=False):
        if self.answers_with_coordinates is None or self.correspondingPoints is None or force_recalculate:
          bubble_coordinates = self.template.get_bubble_coordinates()
          self.answers_with_coordinates = get_answers(self.template.template_img, self.marking_scheme_img, bubble_coordinates)
        return self.answers_with_coordinates

    def __str__(self):
        return f"MarkingScheme(job_id={self.job_id}, name={self.name})"