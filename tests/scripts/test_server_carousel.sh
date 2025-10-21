#!/bin/bash

echo "🧪 Testing Carousel Server Endpoint"
echo "===================================="
echo ""

# Check if server is running
echo "Checking if server is running on port 8000..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "❌ Server is not running on port 8000"
  echo ""
  echo "Please start the server first:"
  echo "  deno run --allow-net --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env server.ts"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Test carousel generation
echo "Sending carousel generation request..."
curl -X POST http://localhost:8000/generate-carousel \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/example_carousel_input.json \
  --output carousel_test.zip \
  --silent \
  --show-error \
  --write-out "\nHTTP Status: %{http_code}\n"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Request completed successfully!"
  echo ""
  
  # Check if ZIP file was created
  if [ -f "carousel_test.zip" ]; then
    echo "📦 ZIP file details:"
    ls -lh carousel_test.zip
    echo ""
    
    # Show ZIP contents
    echo "📋 ZIP contents:"
    unzip -l carousel_test.zip
    echo ""
    
    # Extract images
    echo "📤 Extracting images..."
    unzip -o carousel_test.zip
    echo ""
    
    echo "✅ Test completed successfully!"
    echo ""
    echo "Generated slides:"
    ls -lh focus_micro_boundaries_slide_*.jpg 2>/dev/null || ls -lh *_slide_*.jpg
    echo ""
    echo "To view the slides:"
    echo "  open focus_micro_boundaries_slide_*.jpg"
  else
    echo "❌ ZIP file was not created"
    exit 1
  fi
else
  echo ""
  echo "❌ Request failed"
  exit 1
fi

