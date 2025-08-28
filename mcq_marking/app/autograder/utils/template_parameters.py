def get_coordinates_of_bubbles(config):
    # Configuration parameters
    x_offset = config['bubble_coordinates']['x_offset']
    y_offset = config['bubble_coordinates']['y_offset']
    column_row_distribution = config['column_row_distribution']
    
    coordinates = []

    for column, num_rows in enumerate(column_row_distribution):  # Loop through each column
        # Starting x for the column
        x_row = config['bubble_coordinates']['columns'][str(column+1)]['starting_x']
        column_y_start = config['bubble_coordinates']['columns'][str(column+1)]['starting_y']

        for row in range(num_rows):  # Process each question (row) in the column
            y_row = column_y_start + row * y_offset

            # TODO: Make this dynamic based on the number of choices for each question
            for choice in range(5):  # Process the 5 answer choices (a, b, c, d, e)
                x = x_row + (choice * x_offset)
                coordinates.append([int(x), int(y_row)])

    return coordinates


def get_choice_distribution(config):
    return [5 for _ in range(config['num_questions'])]