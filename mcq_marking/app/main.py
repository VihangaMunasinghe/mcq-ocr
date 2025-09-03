import cv2
import numpy as np
from mcq_marking.app.autograder.marking import calculate_score, get_answers
from mcq_marking.app.autograder.utils.draw_shapes import draw_scatter_points
from mcq_marking.app.autograder.utils.image_processing import read_image
from mcq_marking.app.autograder.utils.template_parameters import get_choice_distribution, get_coordinates_of_bubbles
from mcq_marking.app.templateconfig.config import get_config

folder_path = "/Users/vihangamunasinghe/WebProjects/DSE Project/mcq-ocr/samples"

def template_config():
  bubble_configs, warped_img, result_img = get_config(f'{folder_path}/templates/1.jpg')

  print(bubble_configs)

def marking_test():
  bubble_configs, warped_img, result_img = get_config(f'{folder_path}/templates/1.jpg')
  # Save the warped image to disk
  cv2.imwrite(f'{folder_path}/templates/1_warped.jpg', warped_img)
  
  template_img = read_image(f'{folder_path}/templates/1_warped.jpg', 1.5)
  marking_img = read_image(f'{folder_path}/marking_schemes/1.jpg', 1.5)
  answer_sheet_img = read_image(f'{folder_path}/answers/SKM_558e22122315350_0001.jpg', 1.5)


  bubble_coordinates = get_coordinates_of_bubbles(bubble_configs)
  
  choice_distribution = get_choice_distribution(bubble_configs)

  marking_answers, mark_correspondingPoints = get_answers(template_img, marking_img, bubble_coordinates)
  answers, correspondingPoints = get_answers(template_img, answer_sheet_img, bubble_coordinates)

  correct, incorrect, more_than_one_marked, not_marked, columnwise_total = calculate_score(marking_answers, answers, choice_distribution)
  
  print(correct, incorrect, more_than_one_marked, not_marked, columnwise_total)

  marking_answer_points = [mark_correspondingPoints[i] for i in range(len(mark_correspondingPoints)) if marking_answers[i] == 1]
  answer_points = [correspondingPoints[i] for i in range(len(correspondingPoints)) if answers[i] == 1]
  
  # Convert PIL image to numpy array if needed
  if hasattr(marking_img, 'mode'):
      marking_img = np.array(marking_img)

  if hasattr(answer_sheet_img, 'mode'):
      answer_sheet_img = np.array(answer_sheet_img)

  answer_sheet_img = draw_scatter_points(answer_sheet_img, answer_points, color=(0, 0, 255), radius=7)
  marking_img = draw_scatter_points(marking_img, marking_answer_points, color=(0, 0, 255), radius=7)

  # Stack the images vertically and show
  stacked_img = np.hstack((marking_img, answer_sheet_img))
  cv2.imshow('Side by Side Images (Marking left, Answers right)', stacked_img)
  cv2.waitKey(0)
  cv2.destroyAllWindows()

template_config()
#marking_test()