#!/bin/bash

# Docker test script - Book Reveal Reel Generation Endpoint

set -e  # Exit on error

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Test - Book Reveal Reel Generation${NC}"
echo "=============================================="
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
if [ ! -f "example_book_reveal_reel_input.json" ]; then
    echo -e "${RED}❌ example_book_reveal_reel_input.json not found${NC}"
    exit 1
fi

# Test book reveal reel generation
echo -e "${BLUE}📚 Testing POST /generate-book-reveal-reel...${NC}"
echo ""

OUTPUT_FILE="docker_test_book_reveal_reel.mp4"

curl -X POST http://localhost:8000/generate-book-reveal-reel \
    -H "Content-Type: application/json" \
    -d @example_book_reveal_reel_input.json \
    --output "$OUTPUT_FILE" \
    --max-time 300 \
    -s -w "\nHTTP Status: %{http_code}\n"

echo ""

if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo -e "${GREEN}✅ Book reveal reel generated successfully${NC}"
    echo ""
    echo "   File: $OUTPUT_FILE"
    echo "   Size: $FILE_SIZE"
    
    # Get video duration if ffprobe is available
    if command -v ffprobe &> /dev/null; then
        DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE" 2>/dev/null)
        if [ ! -z "$DURATION" ]; then
            echo "   Duration: ${DURATION}s"
        fi
        
        # Get video dimensions
        DIMENSIONS=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$OUTPUT_FILE" 2>/dev/null)
        if [ ! -z "$DIMENSIONS" ]; then
            echo "   Dimensions: $DIMENSIONS"
        fi
    fi
    
    echo ""
    
    # Open the video
    if command -v open &> /dev/null; then
        echo "   Opening video..."
        open "$OUTPUT_FILE"
    elif command -v xdg-open &> /dev/null; then
        echo "   Opening video..."
        xdg-open "$OUTPUT_FILE"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Book reveal reel generation test passed!${NC}"
    echo ""
    echo -e "${YELLOW}Container logs (last 30 lines):${NC}"
    docker logs --tail 30 $CONTAINER_NAME
else
    echo -e "${RED}❌ Book reveal reel generation failed${NC}"
    echo ""
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs --tail 50 $CONTAINER_NAME
    exit 1
fi

