#!/bin/bash

# Docker test script - Carousel Generation Endpoint

set -e  # Exit on error

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Test - Carousel Generation${NC}"
echo "======================================="
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
if [ ! -f "example_carousel_input.json" ]; then
    echo -e "${RED}❌ example_carousel_input.json not found${NC}"
    exit 1
fi

# Test carousel generation
echo -e "${BLUE}📱 Testing POST /generate-carousel...${NC}"
echo ""

OUTPUT_FILE="docker_test_carousel_response.json"

curl -X POST http://localhost:8000/generate-carousel \
    -H "Content-Type: application/json" \
    -d @example_carousel_input.json \
    --output "$OUTPUT_FILE" \
    -s -w "HTTP Status: %{http_code}\n"

echo ""

if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo -e "${GREEN}✅ Carousel generated successfully${NC}"
    echo ""
    echo "   Response file: $OUTPUT_FILE"
    echo "   Size: $FILE_SIZE"
    echo ""
    
    # Parse and extract images from base64
    if command -v jq &> /dev/null; then
        echo -e "${BLUE}📊 Carousel details:${NC}"
        SLIDE_COUNT=$(jq -r '.slideCount' "$OUTPUT_FILE")
        echo "   Slides: $SLIDE_COUNT"
        echo ""
        
        # Extract and save each slide
        echo -e "${BLUE}💾 Extracting slides...${NC}"
        for i in $(seq 0 $((SLIDE_COUNT - 1))); do
            FILENAME=$(jq -r ".slides[$i].filename" "$OUTPUT_FILE")
            BASE64_DATA=$(jq -r ".slides[$i].base64" "$OUTPUT_FILE")
            
            if [ "$BASE64_DATA" != "null" ]; then
                echo "$BASE64_DATA" | base64 --decode > "docker_test_$FILENAME"
                SLIDE_SIZE=$(ls -lh "docker_test_$FILENAME" | awk '{print $5}')
                echo "   ✅ docker_test_$FILENAME ($SLIDE_SIZE)"
            fi
        done
        
        echo ""
        
        # Open first slide
        if [ -f "docker_test_slide_1.jpg" ]; then
            if command -v open &> /dev/null; then
                echo "   Opening first slide..."
                open docker_test_slide_1.jpg
            elif command -v xdg-open &> /dev/null; then
                echo "   Opening first slide..."
                xdg-open docker_test_slide_1.jpg
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  jq not installed - cannot extract slides${NC}"
        echo "Response preview:"
        head -c 200 "$OUTPUT_FILE"
        echo "..."
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Carousel generation test passed!${NC}"
else
    echo -e "${RED}❌ Carousel generation failed${NC}"
    echo ""
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs --tail 50 $CONTAINER_NAME
    exit 1
fi

