#!/bin/bash

# Test script for two-image reel endpoint

echo "🎬 Testing Two-Image Reel Generation"
echo "===================================="

# Read input from example file
INPUT=$(cat example_two_image_reel_input.json)

# Make POST request to the two-image reel endpoint
echo "📤 Sending request to http://localhost:8000/generate-two-image-reel"
echo ""

curl -X POST http://localhost:8000/generate-two-image-reel \
  -H "Content-Type: application/json" \
  -d "$INPUT" \
  --output test_two_image_reel_output.mp4 \
  -w "\n\n📊 Status: %{http_code}\n📦 Size: %{size_download} bytes\n⏱️  Time: %{time_total}s\n"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Video saved to: test_two_image_reel_output.mp4"
  echo ""
  echo "🎥 Video info:"
  ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=width,height,codec_name -of default=noprint_wrappers=1 test_two_image_reel_output.mp4 2>/dev/null
else
  echo ""
  echo "❌ Request failed"
fi

