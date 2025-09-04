from mcq_marking.app.autograder.utils.image_processing import read_enhanced_image
from mcq_marking.app.models.answer_sheet import AnswerSheet
from mcq_marking.app.models.marking_scheme import MarkingScheme
from mcq_marking.app.models.template import Template
from mcq_marking.app.utils.file_handelling import read_answer_sheet_paths, read_json


class MarkingJob:
    def __init__(self, id: int, name: str, data: dict):
        '''
        data is a dictionary with the following keys:
        data:
            template_path: str
            marking_path: str
            answers_path: str
            output_path: str
            template_config_path: str
        '''
        self.job_id = id
        self.name = name
        self.template_path = data['template_path']
        self.marking_path = data['marking_path']
        self.answers_path = data['answers_path']
        self.output_path = data['output_path']
        self.template_config_path = data['template_config_path']
        self.template = None
        self.marking_scheme = None
        self.answer_sheets = []

    def setup(self, force_recalculate=False):
        if self.template is None or self.marking_scheme is None or self.answer_sheets is None or force_recalculate:
            template_img = read_enhanced_image(self.template_path, 1.5)
            marking_img = read_enhanced_image(self.marking_path, 1.5)
            template_config = read_json(self.template_config_path)
            self.template = Template(self.job_id, f'${self.name } Template', template_img, template_config)
            self.marking_scheme = MarkingScheme(self.job_id, f'${self.name } Marking Scheme', marking_img, template_config)
            self.answer_sheets = read_answer_sheet_paths(self.answers_path)
    
    def mark_answers(self):
        for i, answer_sheet_path in enumerate(self.answer_sheets):
            answer_sheet_img = read_enhanced_image(answer_sheet_path, 1.5)
            answer_sheet = AnswerSheet(self.job_id, i, answer_sheet_path, answer_sheet_img, self.marking_scheme)
            answer_sheet.get_score()


    def __str__(self):
        return f"Job(id={self.job_id}, name={self.name})"