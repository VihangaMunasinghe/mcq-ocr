from PIL import Image, ImageEnhance
import cv2
import numpy as np


def read_image(path, enhance_contrast_val):
    img = Image.open(path).convert('L')
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(enhance_contrast_val)
    color = ImageEnhance.Color(img)
    img = color.enhance(0.0)
    img.resize((1000, 1000))
    return img


def get_homography(img1, img2):
    orig_image = np.array(img1)
    skewed_image = np.array(img2)
    # using surf for feature matching
    try:
        surf = cv2.xfeatures2d.SURF_create(500)
    except Exception:
        surf = cv2.SIFT_create()
    # Finding the matching features between the two images
    kp1, des1 = surf.detectAndCompute(orig_image, None)
    kp2, des2 = surf.detectAndCompute(skewed_image, None)
    # Using the FLANN detector to remove the outliers
    FLANN_INDEX_KDTREE = 0
    index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)
    matches = flann.knnMatch(des1, des2, k=2)
    good = []
    for m, n in matches:
        if m.distance < 0.7 * n.distance:
            good.append(m)
    # Setting the min match count for the match count of labels
    MIN_MATCH_COUNT = 10
    if len(good) > MIN_MATCH_COUNT:
        src_pts = np.float32(
            [kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
        dst_pts = np.float32(
            [kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
    return H

def get_binary_image(img):
    img = np.array(img)
    # Thresholding the image using threshold
    binaryImg = (img < 200).astype(np.uint8)
    # To improve our accuracy we do opening to succesfully white circles
    kernel = np.ones((5, 5), np.uint8)
    binaryImg = cv2.morphologyEx(binaryImg, cv2.MORPH_OPEN, kernel)
    return binaryImg