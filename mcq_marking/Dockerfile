FROM python:3.13-slim

# Install Poetry with pip
RUN pip install poetry

# Disable Poetry virtualenvs (we're already in a container)
RUN poetry config virtualenvs.create false

WORKDIR /app

# Copy dependency files first (for better caching)
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# Copy the rest of your application
COPY . .

# Run the RabbitMQ worker
CMD ["python", "-m", "app.main"]
