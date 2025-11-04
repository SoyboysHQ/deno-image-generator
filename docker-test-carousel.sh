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

OUTPUT_FILE="docker_test_carousel_response.zip"
EXTRACT_DIR="docker_test_carousel_slides"

HTTP_STATUS=$(curl -X POST http://localhost:8000/generate-carousel \
    -H "Content-Type: application/json" \
    -d @example_carousel_input.json \
    --output "$OUTPUT_FILE" \
    -s -w "%{http_code}")

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    
    # Check if it's a ZIP file
    if file "$OUTPUT_FILE" | grep -q "Zip archive"; then
        echo -e "${GREEN}✅ Carousel ZIP generated successfully${NC}"
        echo ""
        echo "   Response file: $OUTPUT_FILE"
        echo "   Size: $FILE_SIZE"
        echo ""
        
        # Extract the ZIP file
        if command -v unzip &> /dev/null; then
            echo -e "${BLUE}📊 Extracting carousel slides...${NC}"
            
            # Create extraction directory
            rm -rf "$EXTRACT_DIR"
            mkdir -p "$EXTRACT_DIR"
            
            # Extract ZIP
            unzip -q "$OUTPUT_FILE" -d "$EXTRACT_DIR"
            
            # Count slides
            SLIDE_COUNT=$(find "$EXTRACT_DIR" -name "*.png" -o -name "*.jpg" | wc -l)
            echo "   Slides extracted: $SLIDE_COUNT"
            echo ""
            
            # List extracted files
            echo -e "${BLUE}📄 Extracted files:${NC}"
            ls -lh "$EXTRACT_DIR"
            echo ""
            
            # Open first slide
            FIRST_SLIDE=$(find "$EXTRACT_DIR" -name "*.png" -o -name "*.jpg" | head -n 1)
            if [ -n "$FIRST_SLIDE" ]; then
                if command -v open &> /dev/null; then
                    echo "   Opening first slide..."
                    open "$FIRST_SLIDE"
                elif command -v xdg-open &> /dev/null; then
                    echo "   Opening first slide..."
                    xdg-open "$FIRST_SLIDE"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  unzip not found, skipping extraction${NC}"
        fi
    else
        echo -e "${RED}❌ Response is not a ZIP file${NC}"
        echo "   File type: $(file "$OUTPUT_FILE")"
        echo ""
        echo "   First 500 characters of response:"
        head -c 500 "$OUTPUT_FILE"
        echo ""
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

