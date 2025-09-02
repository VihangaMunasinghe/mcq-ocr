import cv2
import numpy as np
from mcq_marking.app.autograder.marking import get_answers
from mcq_marking.app.autograder.utils.draw_shapes import draw_scatter_points
from mcq_marking.app.autograder.utils.image_processing import read_image
from mcq_marking.app.autograder.utils.template_parameters import get_coordinates_of_bubbles
from mcq_marking.app.templateconfig.config import get_config

folder_path = "/Users/vihangamunasinghe/WebProjects/DSE Project/mcq-ocr/samples/2023_sample"

def template_config():
  bubble_configs, warped_img, result_img = get_config(f'{folder_path}/templates/1.jpg')

  print(bubble_configs)

def marking_test():
  bubble_configs, warped_img, result_img = get_config(f'{folder_path}/templates/1.jpg')
  # Save the warped image to disk
  cv2.imwrite(f'{folder_path}/templates/1_warped.jpg', warped_img)
  
  template_img = read_image(f'{folder_path}/templates/1_warped.jpg', 1.5)
  marking_img = read_image(f'{folder_path}/marking_schemes/1.jpg', 1.5)

  bubble_configs = {
     'metadata': {
        'num_questions': 90,
        'column_row_distribution': [30, 30, 30]
     },
     'bubble_configs': bubble_configs,
  }
  
  bubble_coordinates = get_coordinates_of_bubbles(bubble_configs)

  answers, correspondingPoints = get_answers(template_img, marking_img, bubble_coordinates)

  answer_points = [correspondingPoints[i] for i in range(len(correspondingPoints)) if answers[i] == 1]
  
  # Convert PIL image to numpy array if needed
  if hasattr(template_img, 'mode'):
      template_img = np.array(template_img)

  if hasattr(marking_img, 'mode'):
      marking_img = np.array(marking_img)

  marking_img = draw_scatter_points(marking_img, answer_points, color=(0, 0, 255), radius=7)

  cv2.imshow('marking_img', marking_img)
  cv2.waitKey(0)
  cv2.destroyAllWindows()

# template_config()
marking_test()