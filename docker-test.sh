#!/bin/bash

# Docker build and test script

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Build & Test Script${NC}"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Build the image
echo -e "${BLUE}📦 Building Docker image...${NC}"
docker build -t image-generator:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=image-generator-test)" ]; then
    echo -e "${YELLOW}🧹 Removing existing test container...${NC}"
    docker stop image-generator-test > /dev/null 2>&1 || true
    docker rm image-generator-test > /dev/null 2>&1 || true
fi

# Run the container
echo -e "${BLUE}🚀 Starting container...${NC}"
docker run -d \
    --name image-generator-test \
    -p 8000:8000 \
    image-generator:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container started${NC}"
else
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
fi

echo ""

# Wait for container to be ready
echo -e "${BLUE}⏳ Waiting for service to be ready...${NC}"
sleep 5

# Test health endpoint
echo -e "${BLUE}🔍 Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs image-generator-test
    exit 1
fi

echo ""

# Test image generation
echo -e "${BLUE}🎨 Testing image generation...${NC}"
curl -X POST http://localhost:8000 \
    -H "Content-Type: application/json" \
    -d @example_input.json \
    --output docker_test_output.jpg \
    -s -w "HTTP Status: %{http_code}\n"

if [ -f "docker_test_output.jpg" ]; then
    FILE_SIZE=$(ls -lh docker_test_output.jpg | awk '{print $5}')
    echo -e "${GREEN}✅ Image generated successfully${NC}"
    echo "   File: docker_test_output.jpg"
    echo "   Size: $FILE_SIZE"
    
    # Open the image on macOS
    if command -v open &> /dev/null; then
        echo ""
        echo "   Opening image..."
        open docker_test_output.jpg
    fi
else
    echo -e "${RED}❌ Image generation failed${NC}"
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs image-generator-test
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Container is running. You can:"
echo "  • View logs: ${BLUE}docker logs -f image-generator-test${NC}"
echo "  • Stop container: ${BLUE}docker stop image-generator-test${NC}"
echo "  • Remove container: ${BLUE}docker rm image-generator-test${NC}"
echo "  • Or use: ${BLUE}docker-compose down${NC}"
echo ""
echo "Next steps:"
echo "  1. Test the API: ${BLUE}curl http://localhost:8000/health${NC}"
echo "  2. Deploy to cloud (see DOCKER_DEPLOY.md)"
echo "  3. Update n8n with your deployed URL"

