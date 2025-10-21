#!/bin/bash

echo "🧪 Testing Carousel Generation"
echo "==============================="
echo ""

# Test locally
echo "Testing carousel generation locally..."
deno run --allow-read --allow-write --allow-ffi --allow-sys --allow-env \
  src/generators/carousel.ts \
  "$(cat tests/fixtures/example_carousel_input.json)"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Carousel generated successfully!"
  echo ""
  echo "Generated files:"
  ls -lh sunday_activities_slide_*.jpg
  echo ""
  echo "Preview the slides and confirm they match the Instagram carousel format."
else
  echo ""
  echo "❌ Carousel generation failed"
  exit 1
fi

