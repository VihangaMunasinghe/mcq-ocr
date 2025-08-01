import cv2
import numpy as np
from auto_config.utils import detect_circles, detect_rectangles, get_canny_edges


def get_first_row_and_column(circles, first_bubble):
    first_row = []
    first_column = []
    for i, (contour, area, center, radius) in enumerate(circles):
        # check if the circle is in the first row
        if center[1] <= first_bubble[2][1]+first_bubble[3] and center[1] >= first_bubble[2][1]-first_bubble[3]:
            first_row.append(circles[i])
            
        # check if the circle is in the first column    
        if center[0] <= first_bubble[2][0]+first_bubble[3] and center[0] >= first_bubble[2][0]-first_bubble[3]:
            first_column.append(circles[i])

    first_row.sort(key=lambda c: c[2][0])
    first_column.sort(key=lambda c: c[2][1])

    return first_row, first_column




def get_bubble_coordinates(img_path):
    img = cv2.imread(img_path)

    edges = get_canny_edges(img)
    # Find contours
    contours, hierarchy = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    # Create a copy of the original image to draw on
    result_img = img.copy()

    # Detect rectangles and circles
    rectangles = detect_rectangles(contours)
    circles = detect_circles(contours)

    print(f"Found {len(rectangles)} rectangles and {len(circles)} circles")

    # Draw rectangles
    for i, (contour, area, (x, y, w, h)) in enumerate(rectangles):
        color = (0, 0, 255)
        cv2.rectangle(result_img, (x, y), (x + w, y + h), color, 2)

    # Draw circles
    for i, (contour, area, center, radius) in enumerate(circles):
        color = (0, 255, 0)
        cv2.circle(result_img, center, radius, color, 2)

    # Draw the first bubble
    first_bubble = min(circles, key=lambda c: c[2][1] + c[2][0]) if circles else None
    if first_bubble is not None:
        center = first_bubble[2]
        cv2.circle(result_img, center, 3, (255, 0, 0), -1)

    first_row, first_column = get_first_row_and_column(circles, first_bubble)

    x_offset = first_row[1][2][0] - first_row[0][2][0]
    y_offset = first_column[1][2][1] - first_column[0][2][1]

    # get the column starting points
    column_starting_points = [first_bubble]
    for i in range(1,len(first_row)):
        if first_row[i][2][0] - first_row[i-1][2][0] > 1.6*x_offset:
            column_starting_points.append(first_row[i])
            cv2.circle(result_img, first_row[i][2], 3, (0, 0, 255), -1)

    # bubble coordinate json
    bubble_coordinates = {
            "starting_x" : first_bubble[2][0],
            "starting_y" : first_bubble[2][1],
            "x_offset" : x_offset,
            "y_offset" : y_offset,
            "x_column_offset" : column_starting_points[1][2][0] - column_starting_points[0][2][0],
            "x_adjustment" : 0.7,
            "columns": {
                str(i+1): {
                    "starting_y": pt[2][1]
                } for i, pt in enumerate(column_starting_points)
            }
        }






    # Display both original and result
    # Convert edges to BGR for stacking
    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

    # Stack the images horizontally for comparison
    stacked = cv2.hconcat([edges_bgr, result_img])
    cv2.imshow("Original | Rectangles & Circles Detected | Edges", stacked)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    return bubble_coordinates

print(get_bubble_coordinates("/Users/vihangamunasinghe/WebProjects/DSE Project/mcq-ocr/samples/templates/1.jpg"))