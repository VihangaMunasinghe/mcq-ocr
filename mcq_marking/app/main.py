from mcq_marking.app.autograder.autograder import autograde
from mcq_marking.app.models.marking_job import MarkingJob
from mcq_marking.app.models.template_config_job import TemplateConfigJob

root_path = "/Users/vihangamunasinghe/WebProjects/DSE Project/mcq-ocr/samples/2023_sample"

template_config_job_data = {
  "id": 1,
  "name": "Template Config Job",
  "template_path": f"{root_path}/templates/1.jpg",
  "template_config_path": f"{root_path}/templates/configs/1_config.json",
  "output_image_path": f"{root_path}/templates/1_template_warped.jpg"
}


marking_job_data = {
  "id": 1,
  "name": "Test Marking Job",
  "template_path": f"{root_path}/templates/1_template_warped.jpg",
  "template_config_path": f"{root_path}/templates/configs/1_config.json",
  "marking_path": f"{root_path}/marking_schemes/1.jpg",
  "answers_folder_path": f"{root_path}/answers",
  "output_path": f"{root_path}/outputs/results.xlsx"
}

if __name__ == "__main__":
  # template_config_job = TemplateConfigJob(template_config_job_data, save_intermediate_results=False)
  # template_config_job.configure()
  
  marking_job = MarkingJob(marking_job_data, save_intermediate_results=False)
  marking_job.mark_answers()