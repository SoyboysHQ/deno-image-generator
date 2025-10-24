#!/bin/bash

# Docker build and start container script

set -e  # Exit on error

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Build & Start${NC}"
echo "========================"
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
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo -e "${YELLOW}🧹 Removing existing container...${NC}"
    docker stop $CONTAINER_NAME > /dev/null 2>&1 || true
    docker rm $CONTAINER_NAME > /dev/null 2>&1 || true
fi

# Run the container
echo -e "${BLUE}🚀 Starting container...${NC}"
docker run -d \
    --name $CONTAINER_NAME \
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

# Quick health check
echo -e "${BLUE}🔍 Testing health endpoint...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Service is ready${NC}"
else
    echo -e "${RED}❌ Service not responding correctly${NC}"
    echo "HTTP Status: $HTTP_CODE"
    echo ""
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Container is ready for testing!${NC}"
echo ""
echo "Run individual endpoint tests:"
echo "  • Health:    ${BLUE}./docker-test-health.sh${NC}"
echo "  • Image:     ${BLUE}./docker-test-image.sh${NC}"
echo "  • Carousel:  ${BLUE}./docker-test-carousel.sh${NC}"
echo "  • Reel:      ${BLUE}./docker-test-reel.sh${NC}"
echo ""
echo "Or test all endpoints:"
echo "  • All tests: ${BLUE}./docker-test-all.sh${NC}"
echo ""
echo "Container management:"
echo "  • View logs:      ${BLUE}docker logs -f $CONTAINER_NAME${NC}"
echo "  • Stop:           ${BLUE}docker stop $CONTAINER_NAME${NC}"
echo "  • Remove:         ${BLUE}docker rm $CONTAINER_NAME${NC}"
echo "  • Stop & Remove:  ${BLUE}./docker-test-cleanup.sh${NC}"

