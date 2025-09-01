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
    if isinstance(correspondingPoints, np.ndarray):
        correspondingPoints = np.array(correspondingPoints)

    # Returning the corresponding points for the 2nd image related to 1st image
    #return correspondingPoints
    return correspondingPoints


def check_neighbours_pixels(img, points):
    PIXEL_THRESHOLD = 15 # number of active pixels in the search neighborhood

    points = np.array(points)
    points = points.astype('int')
    
    binaryImg = get_binary_image(img)

    x = points.shape[0]
    n = 5
    # finding number of average white pixels around all the points in the inverted image
    answers = np.zeros(x)
    for i in range(0, x):
        ans = 0
        for j in range(points[i, 0]-n, points[i, 0]+n):
            for k in range(points[i, 1]-n, points[i, 1]+n):
                # plt.scatter(j,k)
                if (binaryImg[k][j]):
                    ans += 1
        answers[i] = ans
    answers = answers > PIXEL_THRESHOLD
    return answers.astype('int')


def get_answers(template_img, answers_image, bubble_coordinates, is_marking_scheme, show_intermediate_results=False):
    # Find homography Matrix
    homography = get_homography(template_img, answers_image)
    # Find related points in the two image
    correspondingPoints = get_corresponding_points(bubble_coordinates, homography)
    if(show_intermediate_results):
        plt.figure(figsize=(10,10))
        plt.imshow(np.array(answers_image),cmap='gray')
        plt.scatter(correspondingPoints[:,0],correspondingPoints[:,1])
        plt.title("Corresponding Points - get_answers")
        plt.show()

    # Check neighbouring pixels and get whether option is marked or not
    answer = check_neighbours_pixels(
        answers_image, correspondingPoints, is_marking_scheme, show_intermediate_results)
    '''
    bubble_diameter = 25  # You might need to adjust this based on the actual size of bubbles in your image
    convolution_threshold = 15  # Example threshold; adjust as necessary

    answer = check_bubbles_using_convolution(img2, points, convolution_threshold, 
                                             bubble_diameter, visualize_convolution=True)
    '''
    

    return answer

def calculate_score(marking_scheme, answer_script, choice_distribution, facility_index=None):
    idd = 0
    choice_distribution = np.array(choice_distribution)
    incorrect = []
    correct = []
    more_than_one_marked = []
    not_marked = []
    columnwise_total = {0: 0, 1: 0, 2: 0}
    correct_mark = 0
    for i in range(0, choice_distribution.shape[0]):    # for every question
        correct_choice = False
        marked_choices_per_question = 0
        for k in range(0, choice_distribution[i]):  # for every choice
            if marking_scheme[idd] == 1 and answer_script[idd] == 1:
                correct_choice = True
            if answer_script[idd] == 1:  # count the number of marked choices
                marked_choices_per_question += 1
            idd += 1
        if correct_choice and marked_choices_per_question == 1:
            correct.append(i+1)
            correct_mark += 1
            columnwise_total[i//30] += 1
            if facility_index:
                facility_index[i+1] += 1
        elif marked_choices_per_question > 1:
            more_than_one_marked.append(i+1)
        elif marked_choices_per_question == 0:
            not_marked.append(i+1)
        else:
            incorrect.append(i+1)
    return correct, incorrect, more_than_one_marked, not_marked, columnwise_total