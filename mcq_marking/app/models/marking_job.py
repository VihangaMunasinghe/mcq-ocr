import time
from app.autograder.utils.image_processing import read_enhanced_image
from app.models.answer_sheet import AnswerSheet
from app.models.marking_scheme import MarkingScheme
from app.models.template import Template
from app.utils.file_handelling import get_spreadsheet, read_answer_sheet_paths, read_json, save_image_using_folder_and_filename, save_spreadsheet


class MarkingJob:
    def __init__(self, data: dict, save_intermediate_results: bool = False):
        '''
        data is a dictionary with the following keys:
        data:
            id: int
            name: str
            template_path: str
            marking_path: str
            answers_path: str
            output_path: str
            template_config_path: str
            intermediate_results_path: str
        '''
        self.job_id = data['id']
        self.name = data['name']
        self.template_path = data['template_path']
        self.marking_path = data['marking_path']
        self.answers_folder_path = data['answers_folder_path']
        self.output_path = data['output_path']
        self.template_config_path = data['template_config_path']
        self.intermediate_results_path = data['intermediate_results_path']
        self.save_intermediate_results = save_intermediate_results
        self.template = None
        self.marking_scheme = None
        self.answer_sheets = []
        self.spreadsheet_workbook = None
        self.spreadsheet_sheet = None

    def setup(self, force_recalculate=False):
        if self.template is None or self.marking_scheme is None or self.answer_sheets is None or self.spreadsheet_workbook is None or self.spreadsheet_sheet is None or force_recalculate:
            template_img = read_enhanced_image(self.template_path, 'templates', 1.5)
            marking_img = read_enhanced_image(self.marking_path, 'uploads/marking_schemes', 1.5)
            template_config = read_json(self.template_config_path, 'templates')
            self.template = Template(self.job_id, f'${self.name } Template', template_img, template_config)
            self.marking_scheme = MarkingScheme(self.job_id, f'${self.name } Marking Scheme', marking_img, self.template)
            self.answer_sheets = read_answer_sheet_paths(self.answers_folder_path, 'uploads/answer_sheets')
            self.spreadsheet_workbook, self.spreadsheet_sheet = get_spreadsheet(self.output_path, f'${self.name } Results', 'results')
            # Clear the sheet before adding new results
            self.spreadsheet_sheet.delete_rows(1, self.spreadsheet_sheet.max_row)
            self.spreadsheet_sheet.append(['Index No', 'Correct', 'Incorrect', 'More than one marked', 'Not marked', 'Columnwise Total', 'Score', 'Flag', 'Flag Reason'])
    
    def mark_answers(self):
        self.setup()
        self.start_time = time.time()
        for i, answer_sheet_path in enumerate(self.answer_sheets):
            answer_sheet_img = read_enhanced_image(answer_sheet_path, 'uploads/answer_sheets', 1.5)
            answer_sheet = AnswerSheet(self.job_id, i, answer_sheet_path, answer_sheet_img, self.marking_scheme)
            score = answer_sheet.get_score(intermediate_results=self.save_intermediate_results)
            self.add_to_spreadsheet(score)
            if self.save_intermediate_results:
                save_image_using_folder_and_filename(self.intermediate_results_path, f"{answer_sheet.id}.jpg", answer_sheet.result_img)
        save_spreadsheet(self.output_path, self.spreadsheet_workbook)
        print(f"Marking is complete. Results have been saved in {self.output_path}")
        print(f"Total time taken: {time.time() - self.start_time} seconds")

        return self.output_path

    def add_to_spreadsheet(self, score: dict):
        self.spreadsheet_sheet.append([
            score['index_number'], 
            ','.join(map(str, score['correct'])), 
            ','.join(map(str, score['incorrect'])), 
            ','.join(map(str, score['more_than_one_marked'])), 
            ','.join(map(str, score['not_marked'])), 
            ','.join(map(str, score['columnwise_total'])), 
            score['score'], 
            score['flag'], 
            score['flag_reason']])



    def __str__(self):
        return f"Job(id={self.job_id}, name={self.name})"