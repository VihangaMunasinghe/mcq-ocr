import numpy as np
from .CV2IndexSectionDetector import CV2IndexSectionDetector

detector = CV2IndexSectionDetector()

def get_index_section(image: np.ndarray) -> np.ndarray:
    """
    Extracts the section of the input image that contains the student index number.

    Args:
        image: Input image.

    Returns:
        Cropped image containing the student index section.
    """
    detector.set_image(image)
    detector.preprocess()
    detector.detect_contours()
    detector.filter_contours()
    image = detector.extract_index_section()
    return image