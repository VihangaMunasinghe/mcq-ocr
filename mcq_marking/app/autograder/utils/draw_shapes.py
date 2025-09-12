import cv2


def draw_scatter_points(img, points, color=(0, 0, 255), radius=5):
    img = img.copy()
    if len(img.shape) == 2 or img.shape[2] == 1:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    for point in points:
        print(point)
        coords = point.get("coordinates")
        # Convert point coordinates to integers
        point_int = (int(coords[0]), int(coords[1]))
        print(point_int)
        cv2.circle(img, point_int, radius, color, -1)
    return img
