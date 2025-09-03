class MarkingJob:
    def __init__(self, id, name, template_path, template_config_path, marking_path, answers_path, output_path):
        self.job_id = id
        self.name = name
        self.template_path = template_path
        self.marking_path = marking_path
        self.answers_path = answers_path
        self.output_path = output_path
        self.template_config_path = template_config_path

    def __str__(self):
        return f"Job(id={self.job_id}, name={self.name}, template_path={self.template_path}, marking_path={self.marking_path}, answers_path={self.answers_path}, output_path={self.output_path})"