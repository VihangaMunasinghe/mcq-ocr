from PIL import Image
from mcq_marking.app.autograder.marking import calculate_score, get_answers
from mcq_marking.app.models.marking_scheme import MarkingScheme

class AnswerSheet:
    def __init__(self, job_id : int, id : int, name: str, answer_sheet_img : Image, marking_scheme: MarkingScheme):
        self.job_id = job_id
        self.id = id
        self.name = name
        self.answer_sheet_img = answer_sheet_img
        self.marking_scheme = marking_scheme
        self.index_number = None
        self.answers = None
        self.correspondingPoints = None
        self.correct = None
        self.incorrect = None
        self.more_than_one_marked = None
        self.not_marked = None
        self.columnwise_total = None

    def get_answers_and_corresponding_points(self, force_recalculate=False):
        if self.answers is None or self.correspondingPoints is None or force_recalculate:
          bubble_coordinates = self.marking_scheme.template.get_bubble_coordinates()
          self.answers, self.correspondingPoints = get_answers(self.answer_sheet_img, self.answer_sheet_img, bubble_coordinates)
        return self.answers, self.correspondingPoints
    
    def get_score(self):
        self.answers, self.correspondingPoints = self.get_answers_and_corresponding_points()
        choice_distribution = self.marking_scheme.template.get_choice_distribution()
        (
            self.correct,
            self.incorrect,
            self.more_than_one_marked,
            self.not_marked,
            self.columnwise_total,
        ) = calculate_score(self.marking_scheme.answers, self.answers, choice_distribution) # TODO: add facility_index

        return {
            "correct": self.correct,
            "incorrect": self.incorrect,
            "more_than_one_marked": self.more_than_one_marked,
            "not_marked": self.not_marked,
            "columnwise_total": self.columnwise_total,
            "score": len(self.correct),
        }

    def __str__(self):
        return f"AnswerSheet(job_id={self.job_id}, id={self.id}, name={self.name})"