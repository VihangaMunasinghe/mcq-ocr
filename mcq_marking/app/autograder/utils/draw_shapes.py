import cv2


def draw_scatter_points(img, points, color=(0, 0, 255), radius=5):
    img = img.copy()
    if len(img.shape) == 2 or img.shape[2] == 1:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    for point in points:
        # Convert point coordinates to integers
        point_int = (int(point[0]), int(point[1]))
        cv2.circle(img, point_int, radius, color, -1)
    return img
