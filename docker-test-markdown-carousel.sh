#!/bin/bash

# Test markdown carousel generation endpoint in Docker
# Usage: ./docker-test-markdown-carousel.sh

set -e  # Exit on error

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Test - Markdown Carousel Generation${NC}"
echo "==============================================="
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
echo -e "${BLUE}📤 Testing markdown carousel generation endpoint...${NC}"
echo ""

# Send request
HTTP_CODE=$(curl -X POST http://localhost:8000/generate-markdown-carousel \
  -H "Content-Type: application/json" \
  -d @example_markdown_carousel_input.json \
  --output docker_markdown_carousel_test.zip \
  -w "%{http_code}" \
  -s)

echo ""

# Check response
if [ "$HTTP_CODE" -eq 200 ]; then
    if [ -f docker_markdown_carousel_test.zip ]; then
        SIZE=$(ls -lh docker_markdown_carousel_test.zip | awk '{print $5}')
        echo -e "${GREEN}✅ Markdown carousel ZIP generated successfully!${NC}"
        echo -e "${GREEN}📊 File size: $SIZE${NC}"
        echo -e "${GREEN}📦 Output: docker_markdown_carousel_test.zip${NC}"
        echo ""
        
        # Unzip and check contents
        echo -e "${BLUE}📂 Extracting slides...${NC}"
        mkdir -p output/docker_markdown_carousel_test/
        unzip -o docker_markdown_carousel_test.zip -d output/docker_markdown_carousel_test/ > /dev/null 2>&1
        
        # Count files
        FILE_COUNT=$(ls -1 output/docker_markdown_carousel_test/*.jpg 2>/dev/null | wc -l | tr -d ' ')
        echo -e "${GREEN}📊 Extracted $FILE_COUNT slides${NC}"
        
        if [ "$FILE_COUNT" -gt 0 ]; then
            echo ""
            echo -e "${GREEN}🎉 Test passed!${NC}"
            exit 0
        else
            echo -e "${RED}❌ No slides found in ZIP${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Output file not created${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Request failed with HTTP code: $HTTP_CODE${NC}"
    exit 1
fi

