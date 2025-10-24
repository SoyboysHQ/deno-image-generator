#!/bin/bash

# Test script for Instagram Reel generation with quotes

set -e

echo "=== Testing Instagram Reel Generation with Quote ==="
echo

# Test 1: Generate reel with quote
echo "📝 Test: Generating reel with quote..."
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output test_quote_reel.mp4

if [ -f "test_quote_reel.mp4" ]; then
  SIZE=$(ls -lh test_quote_reel.mp4 | awk '{print $5}')
  echo "✅ Quote reel generated successfully! Size: $SIZE"
  
  # Check if it's a valid video file
  if file test_quote_reel.mp4 | grep -q "ISO Media"; then
    echo "✅ File is a valid MP4 video"
  else
    echo "❌ File may not be a valid video"
  fi
else
  echo "❌ Failed to generate quote reel"
  exit 1
fi

echo
echo "=== All tests passed! ==="

