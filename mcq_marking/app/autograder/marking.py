import cv2
import numpy as np
from PIL import Image
from app.autograder.utils.image_processing import get_binary_image, get_homography
import logging

from app.utils.file_handelling import save_image

logger = logging.getLogger(__name__)

def get_corresponding_points(points, H):
    points = np.array(points)
    x = points.shape[0]
    # Appending one for the homography to work for the points matching
    point = np.hstack((points, np.ones((x, 1))))
    point = point.T
    # print(H.shape)
    # print(point.shape)
    correspondingPoints = np.matmul(H, point)
    correspondingPoints = correspondingPoints.T
    for i in range(0, x):
        correspondingPoints[i][0] = correspondingPoints[i][0] / \
            correspondingPoints[i][2]
        correspondingPoints[i][1] = correspondingPoints[i][1] / \
            correspondingPoints[i][2]
        
    adjusted_points = [(x[0], x[1]) for x in correspondingPoints]
    if isinstance(adjusted_points, np.ndarray):
        adjusted_points = np.array(adjusted_points)

    #return correspondingPoints
    return adjusted_points


def check_neighbours_pixels(img, points):
    PIXEL_THRESHOLD = 15 # number of active pixels in the search neighborhood
    NEIGHBOURHOOD_SIZE = 5

    points = np.array(points)
    points = points.astype('int')
    
    binaryImg = get_binary_image(img)

    x = points.shape[0]
    n = NEIGHBOURHOOD_SIZE
    # finding number of average white pixels around all the points in the inverted image
    answers = np.zeros(x)
    for i in range(0, x):
        ans = 0
        for j in range(points[i, 0]-n, points[i, 0]+n):
            for k in range(points[i, 1]-n, points[i, 1]+n):
                if (binaryImg[k][j]):
                    ans += 1
        answers[i] = ans
    answers = answers > PIXEL_THRESHOLD
    return answers.astype('int')


def get_answers(template_img, answers_image, bubble_coordinates):
    # Find homography Matrix
    homography = get_homography(template_img, answers_image)
    logger.info(f"Homography matrix: {homography}")
    logger.info(f"Bubble coordinates count: {len(bubble_coordinates)}")
    
    if homography is None:
        logger.error("Failed to calculate homography matrix - not enough feature matches")
        # Return empty results or handle the error appropriately
        return []
    
    # Check if homography is essentially an identity matrix (indicating poor feature matching)
    identity_threshold = 0.1
    is_identity = (abs(homography[0, 0] - 1.0) < identity_threshold and 
                   abs(homography[1, 1] - 1.0) < identity_threshold and
                   abs(homography[0, 1]) < identity_threshold and
                   abs(homography[1, 0]) < identity_threshold and
                   abs(homography[0, 2]) < identity_threshold and
                   abs(homography[1, 2]) < identity_threshold)
    
    if is_identity:
        logger.warning("Homography matrix is essentially identity - feature matching may have failed")
        logger.warning("This may indicate that the template and answer sheet are too similar or too different")
        # Continue with the identity matrix but log the issue
    
    # Find related points in the two image
    correspondingPoints = get_corresponding_points(bubble_coordinates, homography)
    logger.info(f"Corresponding points count: {len(correspondingPoints)}")
    logger.info(f"First few corresponding points: {correspondingPoints[:3]}")
    # Draw corresponding points on the answers image
    answers_image_with_points = answers_image.copy()
    # Convert PIL Image to numpy array for OpenCV
    answers_image_with_points_array = np.array(answers_image_with_points)
    # Convert RGB to BGR for OpenCV
    answers_image_with_points_array = cv2.cvtColor(answers_image_with_points_array, cv2.COLOR_RGB2BGR)
    for point in correspondingPoints:
        # Convert point to tuple of integers, rounding for better precision
        if isinstance(point, (list, np.ndarray)):
            point_tuple = (int(round(point[0])), int(round(point[1])))
        else:
            point_tuple = (int(round(point[0])), int(round(point[1])))
        cv2.circle(answers_image_with_points_array, point_tuple, 5, (0, 0, 255), -1)
    
    # Convert back to PIL Image for saving
    answers_image_with_points = Image.fromarray(cv2.cvtColor(answers_image_with_points_array, cv2.COLOR_BGR2RGB))
    # Save the answers image with points
    save_image(f"intermediate/answers/answers_image_with_points.jpg", answers_image_with_points)
    # Check neighbouring pixels and get whether option is marked or not
    answers = check_neighbours_pixels(answers_image, correspondingPoints)
    answers_with_coordinates = [(answer, coordinate) for answer, coordinate in zip(answers, correspondingPoints)]
    return answers_with_coordinates

def calculate_score(marking_scheme, answer_script, choice_distribution, facility_index=None):
    idd = 0
    choice_distribution = np.array(choice_distribution)
    incorrect = []
    correct = []
    more_than_one_marked = []
    not_marked = []
    columnwise_total = {0: 0, 1: 0, 2: 0}
    correct_mark = 0
    points = {
        "correct": [],
        "incorrect": [],
        "more_than_one_marked": [],
        "not_marked": [],
    }
    for i in range(0, choice_distribution.shape[0]):    # for every question
        correct_choice = False
        marked_points = []
        for k in range(0, choice_distribution[i]):  # for every choice
            if marking_scheme[idd][0] == 1 and answer_script[idd][0] == 1:
                correct_choice = True
            if answer_script[idd][0] == 1:  # count the number of marked choices
                marked_points.append(answer_script[idd])
            idd += 1
        if correct_choice and len(marked_points) == 1:
            correct.append(i+1)
            correct_mark += 1
            columnwise_total[i//30] += 1
            points["correct"].append({"question_number": i+1, "answer": "correct", "coordinates": marked_points[0][1]})
            if facility_index:
                facility_index[i+1] += 1
        elif len(marked_points) > 1:
            more_than_one_marked.append(i+1)
            for point in marked_points:
                points["more_than_one_marked"].append({"question_number": i+1, "answer": "more than one marked", "coordinates": point[1]})
        elif len(marked_points) == 0:
            not_marked.append(i+1)
            for point in marked_points:
                points["not_marked"].append({"question_number": i+1, "answer": "not marked", "coordinates": point[1]})
        else:
            for point in marked_points:
                points["incorrect"].append({"question_number": i+1, "answer": "incorrect", "coordinates": point[1]})
            incorrect.append(i+1)
    return correct, incorrect, more_than_one_marked, not_marked, columnwise_total, points