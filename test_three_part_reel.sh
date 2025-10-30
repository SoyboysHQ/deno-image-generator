#!/bin/bash

# Test script for three-part reel generation endpoint
# This script tests the /generate-three-part-reel endpoint

set -e

echo "🧪 Testing Three-Part Reel Generation Endpoint"
echo "=============================================="
echo ""

SERVER_URL="http://localhost:8000"
ENDPOINT="${SERVER_URL}/generate-three-part-reel"
OUTPUT_FILE="test_three_part_reel_output.mp4"

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "${SERVER_URL}/health" > /dev/null; then
    echo "❌ Error: Server is not running at ${SERVER_URL}"
    echo "Please start the server first with: deno run --allow-all src/server.ts"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Read example input
if [ ! -f "example_three_part_reel_input.json" ]; then
    echo "❌ Error: example_three_part_reel_input.json not found"
    exit 1
fi

INPUT_JSON=$(cat example_three_part_reel_input.json)
echo "📝 Input JSON:"
echo "$INPUT_JSON" | jq '.'
echo ""

# Send request
echo "📤 Sending request to ${ENDPOINT}..."
HTTP_CODE=$(curl -s -o "${OUTPUT_FILE}" -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$INPUT_JSON" \
    "${ENDPOINT}")

echo ""
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Request successful (HTTP ${HTTP_CODE})"
    
    if [ -f "${OUTPUT_FILE}" ]; then
        FILE_SIZE=$(du -h "${OUTPUT_FILE}" | cut -f1)
        echo "📹 Video file created: ${OUTPUT_FILE} (${FILE_SIZE})"
        
        # Check if ffprobe is available to get video info
        if command -v ffprobe &> /dev/null; then
            echo ""
            echo "📊 Video information:"
            ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 "${OUTPUT_FILE}"
            echo ""
            echo "🎬 You can play the video with: open ${OUTPUT_FILE}"
        fi
    else
        echo "⚠️  Warning: Response received but no file was created"
    fi
else
    echo "❌ Request failed (HTTP ${HTTP_CODE})"
    echo "Response:"
    cat "${OUTPUT_FILE}"
    rm -f "${OUTPUT_FILE}"
    exit 1
fi

echo ""
echo "✅ Test completed successfully!"

