#!/bin/bash

# Production Build and Push Script for MCQ OCR System
# Usage: ./build-and-push.sh [dockerhub-username]

set -e

# Configuration
DOCKER_REGISTRY=${1:-your-dockerhub-username}
PROJECT_NAME="edumark"

echo "Building and pushing MCQ OCR System images..."
echo "Registry: $DOCKER_REGISTRY"
echo "Project: $PROJECT_NAME"
echo ""

# Function to build and push image
build_and_push() {
    local service=$1
    local dockerfile=$2
    local context=$3
    
    echo "Building $service..."
    docker build --platform linux/amd64 -f "$dockerfile" -t "$DOCKER_REGISTRY/$PROJECT_NAME:$service" "$context"
    
    echo "Pushing $service..."
    docker push "$DOCKER_REGISTRY/$PROJECT_NAME:$service"
    
    echo "✅ $service completed"
    echo ""
}

# Build and push all services
# build_and_push "backend" "fastapi_backend/Dockerfile" "fastapi_backend"
build_and_push "frontend" "next_frontend/Dockerfile" "next_frontend"
# build_and_push "marking" "mcq_marking/Dockerfile" "mcq_marking"
# build_and_push "recognizer" "index_recognision/Dockerfile" "index_recognision"

echo "🎉 All images built and pushed successfully!"
echo ""
echo "Images pushed:"
echo "- $DOCKER_REGISTRY/$PROJECT_NAME:backend"
echo "- $DOCKER_REGISTRY/$PROJECT_NAME:frontend"
echo "- $DOCKER_REGISTRY/$PROJECT_NAME:marking"
echo "- $DOCKER_REGISTRY/$PROJECT_NAME:recognizer"
echo ""
echo "To deploy on your VM:"
echo "1. Copy docker-compose.prod.yml and env.prod.example to your VM"
echo "2. Create .env.prod file with your production values"
echo "3. Run: docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d"
