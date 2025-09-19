import cv2
import pyautogui
import numpy as np
from sklearn.cluster import KMeans

img = cv2.imread("../samples/templates/1.2.jpg")

#change accordingly
num_of_options_per_question= 5
num_of_rows_per_column=30
num_of_columns=3

screen_width, screen_height = pyautogui.size()
scale = min(screen_width / img.shape[1], screen_height / img.shape[0])
new_width = int(img.shape[1] * scale*0.9)
new_height = int(img.shape[0] * scale*0.9)
resized_img=cv2.resize(img,(new_width,new_height))
imGray = cv2.cvtColor(resized_img,cv2.COLOR_BGR2GRAY)

template_width = imGray.shape[1]
min_thickness = 3  # Minimum thickness in pixels for a thick line (adjust this)

#_, thresh = cv2.threshold(imGray, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)
#thresh_inv = cv2.bitwise_not(thresh)

blur = cv2.GaussianBlur(imGray, (5, 5), 1)
edges = cv2.Canny(blur, 50, 150, apertureSize=3)
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

line_y=None
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
     
    #cv2.rectangle(resized_img, (x, y), (x + w, y + h), (0, 0, 255), 1) 
    # Check if contour is horizontal thick line meeting both conditions
    if h >= min_thickness and w >= (template_width / 2):
        
        # Optionally, further confirm it's a horizontal line by aspect ratio
        aspect_ratio = w / h
        if aspect_ratio > 3:  # e.g., width at least 3 times thickness
            #cv2.rectangle(resized_img, (x, y), (x + w, y + h), (0, 0, 255), 2)
            
            line_thickness = h
            print(f"Detected thick horizontal line, thickness: {line_thickness}px, width: {w}px")
            line_y = y + h
            break  # process only the first matching line  

if line_y is not None:
    img_below = resized_img[line_y+1:, :]  # crop everything below the line
    gray_below = imGray[line_y+1:, :]
else:
    img_below=resized_img
    gray_below=imGray

blur = cv2.GaussianBlur(gray_below, (5, 5), 1)
edges = cv2.Canny(blur, 50, 150, apertureSize=3)
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
#_,thrash =  cv2.threshold(gray_below,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)

#contours,_ = cv2.findContours(thrash,cv2.RETR_TREE,cv2.CHAIN_APPROX_NONE)
bubble_areas = []
circles=[]
for contour in contours :
    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour,True)
    if perimeter == 0 :
        continue
    circularity = 4* np.pi*(area / (perimeter * perimeter))
    x, y, w, h = cv2.boundingRect(contour)
    aspect_ratio = w / float(h)
    if (0.7 < circularity < 1.2) and (0.8<aspect_ratio<1.25):
        bubble_areas.append(area)
        circles.append(contour)
        #cv2.drawContours(img_below, [contour], -1, (0, 255, 0), 1)
    #else:
        #cv2.drawContours(img_below, [contour], -1, (0,0,255), 1)

filtered_circles = []
filtered_areas = []

# First pass: keep only circles (not rectangles)
for contour, area in zip(circles, bubble_areas):
    epsilon = 0.01 * cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, epsilon, True)
    if len(approx) != 4:  # skip rectangles
        filtered_circles.append(contour)
        filtered_areas.append(area)
        
# Now filter by area
mean_area = np.mean(filtered_areas)
lower_threshold = mean_area * 0.5
upper_threshold = mean_area * 1.5

final_circles = []

for contour, area in zip(filtered_circles, filtered_areas):
    if lower_threshold <= area and area <= upper_threshold:
        final_circles.append(contour)
        



centers = []  # will store (cx, cy) for each contour in the same order

for cnt in final_circles:
    M = cv2.moments(cnt)
    if M["m00"] != 0:  # avoid division by zero
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
    else:
        # fallback: use bounding box center
        x, y, w, h = cv2.boundingRect(cnt)
        cx = x + w // 2
        cy = y + h // 2
    
    centers.append((cx, cy))
#for (cx, cy) in centers:
   # cv2.circle(img_below, (cx, cy), radius=2, color=(255, 0, 0), thickness=-1)
    # or you can use cv2.drawMarker:
    # cv2.drawMarker(template_image, (cx, cy), color=(0, 255, 0), markerType=cv2.MARKER_CROSS, 
    #                markerSize=10, thickness=2)



# Assume centers is a list of (cx, cy)
# Convert to numpy array
points = np.array(centers)

# Extract only X coordinates for column clustering
X_coords = points[:, 0].reshape(-1, 1)

# K-Means with safe parameters
kmeans_cols = KMeans(
    n_clusters=num_of_columns,
    init='k-means++',
    n_init=15,      # retry with 50 different seeds
    random_state=42 # fixed for reproducibility
)
col_labels = kmeans_cols.fit_predict(X_coords)

# Group points by column label
columns = [[] for _ in range(3)]
for point, label in zip(points, col_labels):
    columns[label].append(tuple(point))

# Sort columns by their X-center so it's always left-to-right
col_centers_x = [np.mean([p[0] for p in col]) for col in columns]
sorted_indices = np.argsort(col_centers_x)
columns = [columns[i] for i in sorted_indices]

# Create an empty structure: 3 columns, each with 30 empty slots
bubbles = [[[] for _ in range(num_of_rows_per_column)] for _ in range(num_of_columns)]

row_bubbles=[]
for i in range(num_of_columns):
    if len(columns[i]) == num_of_options_per_question*num_of_rows_per_column:
        columns[i] = sorted(columns[i], key=lambda p: p[1])  # sort by y-coordinate
        for x in range(num_of_rows_per_column):
            row_bubbles=columns[i][:num_of_options_per_question]
            columns[i]=columns[i][num_of_options_per_question:]
            # Sort in place by x-coordinate (tuple[0])
            row_bubbles.sort(key=lambda p: p[0])
            bubbles[i][x]=row_bubbles
# Now `columns[0]`, `columns[1]`, `columns[2]` are left, middle, right columns
    else:
        # Convert the column points to numpy array
        col_points = np.array(columns[i])
        
        # Extract only Y coords for clustering
        Y_coords = col_points[:, 1].reshape(-1, 1)
        
        # Perform KMeans clustering into 30 rows
        kmeans_rows = KMeans(
            n_clusters=num_of_rows_per_column,
            init='k-means++',
            n_init=20,
            random_state=42
        )
        row_labels = kmeans_rows.fit_predict(Y_coords)
        
        # Group points by their cluster (row)
        clustered_rows = [[] for _ in range(num_of_rows_per_column)]
        for point, label in zip(col_points, row_labels):
            clustered_rows[label].append(tuple(point))
        
        # Sort clusters top-to-bottom by the cluster center (Y mean)
        row_centers_y = [np.mean([p[1] for p in row]) if row else 1e9 for row in clustered_rows]
        sorted_row_indices = np.argsort(row_centers_y)
        
        # Now process each row
        for row_idx, cluster_idx in enumerate(sorted_row_indices):
            row_points = clustered_rows[cluster_idx]
            
            # Sort row bubbles left-to-right by X coordinate
            row_points.sort(key=lambda p: p[0])
            
            # Assign into bubbles array
            bubbles[i][row_idx] = row_points
            

        
        rows = bubbles[i]   # all 30 rows for this column

        # --- Step 1: Find reference row ---
        tolerance = 10  # pixels, adjust based on template spacing
        reference_x = None
        #for row in rows:
            #if len(row) == num_of_options_per_question:
                #reference_x = [p[0] for p in row]  # store X only
                #break
                # --- Step 1: Find reference_x using all complete rows ---
        valid_rows = [row for row in rows if len(row) == num_of_options_per_question]

        if not valid_rows:
            print(f"No reference row found in column {i}")
            continue

        # Collect X values for each option position across valid rows
        all_x_positions = [[] for _ in range(num_of_options_per_question)]
        for row in valid_rows:
            #row_sorted = sorted(row, key=lambda p: p[0])  # ensure left-to-right
            for idx, (x, _) in enumerate(row):
                all_x_positions[idx].append(x)

        # Mean X for each bubble position
        reference_x = [int(np.mean(x_list)) for x_list in all_x_positions]

        if reference_x is None:
            print(f"No reference row found in column {i}")
            continue

        # --- Step 2: Fix each row ---
        for row_idx, row in enumerate(rows):
            if len(row) == num_of_options_per_question:
                continue  # this row is fine

            elif len(row) < num_of_options_per_question:
                # Missing bubbles
                avg_y = np.mean([p[1] for p in row]) if row else 0
                new_row = row.copy()
                for ref_x in reference_x:
                    # Check if a bubble already near ref_x
                    found = any(abs(p[0] - ref_x) <= tolerance for p in row)
                    if not found:
                        new_row.append((ref_x, int(avg_y)))  # impute missing
                # Sort by X again
                new_row.sort(key=lambda p: p[0])
                bubbles[i][row_idx] = new_row

            elif len(row) > num_of_options_per_question:
                # Extra bubbles
                new_row = []
                for ref_x in reference_x:
                    # Find bubble closest to ref_x
                    candidates = [p for p in row if abs(p[0] - ref_x) <= tolerance]
                    if candidates:
                        # Pick the one closest to ref_x
                        best = min(candidates, key=lambda p: abs(p[0] - ref_x))
                        new_row.append(best)
                # Sort by X again
                new_row.sort(key=lambda p: p[0])
                bubbles[i][row_idx] = new_row

# --- Final step: adjust coordinates back to resized_img space ---
# final_bubbles = [[[] for _ in range(num_of_rows_per_column)] for _ in range(num_of_columns)]

# y_offset = (line_y + 1) if line_y is not None else 0

# for i in range(num_of_columns):
#     for row_idx in range(num_of_rows_per_column):
#         adjusted_row = [(x, y + y_offset) for (x, y) in bubbles[i][row_idx]]
#         final_bubbles[i][row_idx] = adjusted_row

# Now final_bubbles contains all coordinates in resized_img reference
 # Save
#np.save("final_bubbles.npy", final_bubbles)

# In another file
#import numpy as np
#final_bubbles = np.load("final_bubbles.npy", allow_pickle=True)




font = cv2.FONT_HERSHEY_SIMPLEX
font_scale = 0.5
color = (0, 0, 255)   # red
thickness = 1

for col_idx in range(num_of_columns):        # Loop through columns
    count = 1
    for row_idx in range(num_of_rows_per_column):   # Loop through rows/questions
        for opt_idx in range(num_of_options_per_question):   # Loop through options
            cx, cy = bubbles[col_idx][row_idx][opt_idx]   # coordinates of bubble center
            
            # Draw the number on the image
            cv2.putText(
                img_below, str(count), (cx, cy), 
                font, font_scale, color, thickness, cv2.LINE_AA
            )
            count += 1  # increase numbering

# Show the result
cv2.imshow("Bubbles with numbering", resized_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
