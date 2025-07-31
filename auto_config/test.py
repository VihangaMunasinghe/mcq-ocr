import cv2

from auto_config.utils import detect_circles, detect_rectangles, get_canny_edges

img = cv2.imread("/Users/vihangamunasinghe/WebProjects/DSE Project/mcq-ocr/samples/templates/2.jpg")

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

# Display both original and result
# Convert edges to BGR for stacking
edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

# Stack the images horizontally for comparison
stacked = cv2.hconcat([edges_bgr, result_img])
cv2.imshow("Original | Rectangles & Circles Detected | Edges", stacked)
cv2.waitKey(0)
cv2.destroyAllWindows()