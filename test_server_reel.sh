#!/bin/bash

# Test script for the reel generation endpoint

echo "🎬 Testing Instagram Reel Generator..."
echo "======================================"
echo ""

# Check if server is running
echo "📡 Checking if server is running..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "❌ Error: Server is not running on port 8000"
  echo "💡 Start the server with: deno task server"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Read input from example file
INPUT_FILE="example_reel_input.json"

if [ ! -f "$INPUT_FILE" ]; then
  echo "❌ Error: Input file '$INPUT_FILE' not found"
  exit 1
fi

echo "📥 Using input from: $INPUT_FILE"
cat "$INPUT_FILE"
echo ""
echo ""

# Make POST request
echo "🚀 Sending request to /generate-reel endpoint..."
HTTP_CODE=$(curl -s -w "%{http_code}" -o test_reel_output.mp4 \
  -X POST \
  -H "Content-Type: application/json" \
  -d @"$INPUT_FILE" \
  http://localhost:8000/generate-reel)

echo ""

# Check response
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Success! HTTP $HTTP_CODE"
  
  # Check if file was created and get size
  if [ -f "test_reel_output.mp4" ]; then
    FILE_SIZE=$(ls -lh test_reel_output.mp4 | awk '{print $5}')
    echo "📹 Video saved as: test_reel_output.mp4 ($FILE_SIZE)"
    echo ""
    echo "🎉 You can now view the video!"
    echo "💡 Tip: Open test_reel_output.mp4 to see the result"
  else
    echo "⚠️  Warning: Response received but file not created"
  fi
else
  echo "❌ Error! HTTP $HTTP_CODE"
  echo "Response:"
  cat test_reel_output.mp4
  rm -f test_reel_output.mp4
  exit 1
fi

echo ""
echo "✅ Test completed successfully!"

