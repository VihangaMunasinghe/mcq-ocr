import cv2
import numpy as np

##################### Helper Functions #####################
def get_largest_contour_index(contours) -> int:
        largets_index = np.argmax([cv2.contourArea(c) for c in contours])
        return largets_index
    
def get_first_child_contour_index(hierarchy, parent_index) -> int:
    first_child_index = hierarchy[0][parent_index][2]
    return first_child_index

def get_all_child_contour_indices(hierarchy, parent_index) -> list[int]:
    child_indices = []
    first_child_index = hierarchy[0][parent_index][2]
    if first_child_index == -1:
        return child_indices
    child_indices.append(first_child_index)
    next_sibling_index = hierarchy[0][first_child_index][0]
    while next_sibling_index != -1:
        child_indices.append(next_sibling_index)
        next_sibling_index = hierarchy[0][next_sibling_index][0]
    return child_indices

def crop_to_bounding_box(image: np.ndarray, box: np.ndarray) -> np.ndarray:
    s = box.sum(axis=1)
    diff = np.diff(box, axis=1)

    ordered = np.zeros((4, 2), dtype="float32")
    ordered[0] = box[np.argmin(s)]   # top-left (smallest sum)
    ordered[2] = box[np.argmax(s)]   # bottom-right (largest sum)
    ordered[1] = box[np.argmin(diff)] # top-right (smallest diff)
    ordered[3] = box[np.argmax(diff)] # bottom-left (largest diff)

    # Compute new width and height
    (tl, tr, br, bl) = ordered
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = int(max(widthA, widthB))
    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = int(max(heightA, heightB))

    # Destination rectangle
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")
    # Perspective transform
    M = cv2.getPerspectiveTransform(ordered, dst)

    # Warp the image
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped


##################### Main Class #####################
class CV2IndexSectionDetector:
    def __init__(self,image: np.ndarray = None, operating_width: int = 1000, operating_height: int = 1500,
                 blur_spread: int = 5, blur_strength: int = 2):
        self.operating_width = operating_width
        self.operating_height = operating_height
        if image:
            image = cv2.resize(image, (self.operating_width, self.operating_height))
        self.original = image
        self.current = image
        self.blur_spread = blur_spread if blur_spread % 2 == 1 else blur_spread + 1
        self.blur_strength = blur_strength
        self.contours = []
        self.hierarchy = []
    
    def set_image(self, image: np.ndarray):
        image = cv2.resize(image, (self.operating_width, self.operating_height))
        self.original = image
        self.current = image
    
    def reset(self):
        self.current = self.original
    
    def get_current(self) -> np.ndarray:
        return self.current
    
    def get_original(self) -> np.ndarray:
        return self.original
    
    def get_contours(self) -> list[np.ndarray]:
        return self.contours
    
    def get_hierarchy(self) -> np.ndarray:
        return self.hierarchy
    
    def preprocess(self):
        gray = cv2.cvtColor(self.current, cv2.COLOR_BGR2GRAY)
        filtered_image = cv2.GaussianBlur(gray, (self.blur_spread, self.blur_spread), self.blur_strength)
        self.current = cv2.Canny(filtered_image,10,50)

    def detect_contours(self):
        contours, hierarchy = cv2.findContours(self.current, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        self.contours = contours
        self.hierarchy = hierarchy
    
    def filter_contours(self):
        largest_contour_outer_idx = get_largest_contour_index(self.contours)
        largest_contour_inner_idx = get_first_child_contour_index(self.hierarchy, largest_contour_outer_idx)
        if largest_contour_inner_idx == -1:
            raise ValueError("No inner contour found within the largest outer contour.")
        child_indices = get_all_child_contour_indices(self.hierarchy, largest_contour_inner_idx)
        if not child_indices:
            raise ValueError("No child contours found within the largest inner contour.")
        self.contours = [self.contours[i] for i in child_indices]
    
    def extract_index_section(self) -> np.ndarray:
        if not self.contours:
            raise ValueError("No contours available to extract index section.")
        target_contour = self.contours[get_largest_contour_index(self.contours)]
        rect = cv2.minAreaRect(target_contour)
        box = np.array(cv2.boxPoints(rect), dtype="float32")
        cropped_image = crop_to_bounding_box(self.original, box)
        return cropped_image
        