#!/bin/bash

# Test script for text reel generation

echo "🎬 Testing Text Reel Generator..."
echo "================================="

# Run the generator directly
deno run \
  --allow-read \
  --allow-write \
  --allow-run \
  --allow-ffi \
  --allow-sys \
  --allow-env \
  src/generators/textReel.ts \
  "$(cat example_text_reel_input.json)"

echo ""
echo "✅ Test complete!"
echo "📹 Check text_reel.mp4 for output"

