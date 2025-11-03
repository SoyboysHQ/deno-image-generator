#!/bin/bash

# Test the text reel endpoint on the running server

echo "🧪 Testing Text Reel Endpoint"
echo "============================="
echo ""

# Test with example input
echo "📤 Sending request with example input..."
curl -X POST http://localhost:8000/generate-text-reel \
  -H "Content-Type: application/json" \
  -d @example_text_reel_input.json \
  --output text_reel_output.mp4

echo ""
echo "✅ Response saved to text_reel_output.mp4"
echo ""

# Check file size
if [ -f text_reel_output.mp4 ]; then
  SIZE=$(ls -lh text_reel_output.mp4 | awk '{print $5}')
  echo "📊 File size: $SIZE"
else
  echo "❌ Output file not created"
fi

