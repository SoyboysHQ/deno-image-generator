#!/bin/bash

# Test text reel generation endpoint in Docker
# Usage: ./docker-test-text-reel.sh

set -e  # Exit on error

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Test - Text Reel Generation${NC}"
echo "========================================"
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

# Test endpoint
echo -e "${BLUE}📤 Testing text reel generation endpoint...${NC}"
echo ""

# Send request
HTTP_CODE=$(curl -X POST http://localhost:8000/generate-text-reel \
  -H "Content-Type: application/json" \
  -d @example_text_reel_input.json \
  --output docker_text_reel_test.mp4 \
  -w "%{http_code}" \
  -s)

echo ""

# Check response
if [ "$HTTP_CODE" -eq 200 ]; then
    if [ -f docker_text_reel_test.mp4 ]; then
        SIZE=$(ls -lh docker_text_reel_test.mp4 | awk '{print $5}')
        echo -e "${GREEN}✅ Text reel generated successfully!${NC}"
        echo -e "${GREEN}📊 File size: $SIZE${NC}"
        echo -e "${GREEN}📹 Output: docker_text_reel_test.mp4${NC}"
        echo ""
        
        # Verify it's a valid video file
        file docker_text_reel_test.mp4
        echo ""
        
        echo -e "${GREEN}🎉 Test passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Output file not created${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Request failed with HTTP code: $HTTP_CODE${NC}"
    exit 1
fi
