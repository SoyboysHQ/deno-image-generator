#!/bin/bash

# Simple test script for book reveal reel - with progress output

echo "📚 Testing Book Reveal Reel Generation"
echo "======================================"
echo ""

# Check if container is running
if ! docker ps | grep -q instagram-generator-app; then
    echo "❌ Container not running. Start it with: make docker-start"
    exit 1
fi

echo "✅ Container is running"
echo ""

# Check if input file exists
if [ ! -f "example_book_reveal_reel_input.json" ]; then
    echo "❌ example_book_reveal_reel_input.json not found"
    exit 1
fi

echo "📤 Sending request (this may take 1-2 minutes)..."
echo ""

OUTPUT_FILE="docker_test_book_reveal_reel.mp4"

# Test with progress bar
curl -X POST http://localhost:8000/generate-book-reveal-reel \
    -H "Content-Type: application/json" \
    -d @example_book_reveal_reel_input.json \
    --output "$OUTPUT_FILE" \
    --max-time 300 \
    --progress-bar \
    -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"

echo ""

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "✅ Video generated: $OUTPUT_FILE ($FILE_SIZE)"
    
    # Check if it's a valid video file
    if file "$OUTPUT_FILE" | grep -q "MP4\|Video"; then
        echo "✅ Valid MP4 file"
    else
        echo "⚠️  Warning: File may not be a valid video"
        echo "First 100 bytes:"
        head -c 100 "$OUTPUT_FILE" | xxd | head -5
    fi
else
    echo "❌ Video generation failed or file is empty"
    echo ""
    echo "Container logs:"
    docker logs --tail 20 instagram-generator-app
    exit 1
fi

