import cv2
import numpy as np

def get_canny_edges(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 1)
    edges = cv2.Canny(blur, 50, 150, apertureSize=3)
    return edges

def detect_rectangles(contours, min_area=400):
    """
    Detect rectangles from contours and return them sorted by area in descending order.
    
    Args:
        contours: List of contours from cv2.findContours()
        min_area: Minimum area to consider (default: 400)
    
    Returns:
        List of tuples: (contour, area, bounding_rect) sorted by area descending
    """
    rectangles = []
    
    for contour in contours:
        # Approximate the contour to a polygon
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        # Check if it's a rectangle (4 corners)
        if len(approx) == 4:
            area = cv2.contourArea(contour)
            if area >= min_area:
                x, y, w, h = cv2.boundingRect(contour)
                rectangles.append((contour, area, (x, y, w, h)))
    
    # Sort by area in descending order
    rectangles.sort(key=lambda x: x[1], reverse=True)
    return rectangles

def detect_circles(contours, min_area=100):
    """
    Detect circles from contours and return them sorted by area in descending order.
    
    Args:
        contours: List of contours from cv2.findContours()
        min_area: Minimum area to consider (default: 100)
    
    Returns:
        List of tuples: (contour, area, center, radius) sorted by area descending
    """
    circles = []
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area >= min_area:
            # Calculate circularity
            perimeter = cv2.arcLength(contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                
                # If circularity is close to 1, it's a circle
                if circularity > 0.85:  # Threshold for circle detection
                    # Find the minimum enclosing circle
                    (x, y), radius = cv2.minEnclosingCircle(contour)
                    circles.append((contour, area, (int(x), int(y)), int(radius)))
    
    # Sort by area in descending order
    circles.sort(key=lambda x: x[1], reverse=True)
    return circles