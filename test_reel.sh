#!/bin/bash

echo "🧪 Testing Reel Generation"
echo "==============================="
echo ""

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed. Please install FFmpeg first:"
    echo "  - macOS: brew install ffmpeg"
    echo "  - Linux: sudo apt-get install ffmpeg"
    exit 1
fi

echo "✅ FFmpeg is installed"
echo ""

# Test locally
echo "Testing reel generation locally..."
deno run --allow-read --allow-write --allow-run \
  src/generators/reel.ts \
  "$(cat example_reel_input.json)"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Reel generated successfully!"
  echo ""
  echo "Generated file:"
  ls -lh instagram_reel.mp4
  echo ""
  echo "Preview the video with: open instagram_reel.mp4 (macOS) or xdg-open instagram_reel.mp4 (Linux)"
else
  echo ""
  echo "❌ Reel generation failed"
  exit 1
fi

