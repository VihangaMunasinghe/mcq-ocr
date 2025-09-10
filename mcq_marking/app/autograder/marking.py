import numpy as np
from mcq_marking.app.autograder.utils.image_processing import get_binary_image, get_homography

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
        
    # # Adjusting
    # delta_x = -4  # The observed shift in the x direction
    # delta_y = -9  # The observed shift in the y direction

    # Apply the shift to each point in correspondingPoints
    adjusted_points = [(x[0], x[1]) for x in correspondingPoints]
    if isinstance(adjusted_points, np.ndarray):
        adjusted_points = np.array(adjusted_points)

    # Returning the corresponding points for the 2nd image related to 1st image
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
    # Find related points in the two image
    correspondingPoints = get_corresponding_points(bubble_coordinates, homography)

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