#!/bin/bash

# Docker test script - Image Generation Endpoint

set -e  # Exit on error

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Test - Image Generation${NC}"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${YELLOW}⚠️  Container '$CONTAINER_NAME' is not running${NC}"
    echo "Start it with: ./docker-test-build.sh or make docker-start"
    exit 1
fi

echo -e "${GREEN}✅ Container is running${NC}"
echo ""

# Check if example input exists
if [ ! -f "example_input.json" ]; then
    echo -e "${RED}❌ example_input.json not found${NC}"
    exit 1
fi

# Test image generation
echo -e "${BLUE}🎨 Testing POST /generate-image...${NC}"
echo ""

OUTPUT_FILE="docker_test_image.jpg"

curl -X POST http://localhost:8000/generate-image \
    -H "Content-Type: application/json" \
    -d @example_input.json \
    --output "$OUTPUT_FILE" \
    -s -w "HTTP Status: %{http_code}\n"

echo ""

if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo -e "${GREEN}✅ Image generated successfully${NC}"
    echo ""
    echo "   File: $OUTPUT_FILE"
    echo "   Size: $FILE_SIZE"
    echo ""
    
    # Open the image on macOS
    if command -v open &> /dev/null; then
        echo "   Opening image..."
        open "$OUTPUT_FILE"
    elif command -v xdg-open &> /dev/null; then
        echo "   Opening image..."
        xdg-open "$OUTPUT_FILE"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Image generation test passed!${NC}"
else
    echo -e "${RED}❌ Image generation failed${NC}"
    echo ""
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs --tail 50 $CONTAINER_NAME
    exit 1
fi

