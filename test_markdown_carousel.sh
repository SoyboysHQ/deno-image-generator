#!/bin/bash

# Test markdown carousel generation locally

echo "🧪 Testing markdown carousel generation..."
echo ""

# Read the example input
INPUT=$(cat example_markdown_carousel_input.json)

echo "📤 Sending request to generator..."
deno run --allow-read --allow-write --allow-env --allow-run --allow-ffi --allow-sys src/generators/markdownCarousel.ts "$INPUT"

echo ""
echo "✅ Test complete!"
echo "📂 Check output files: subconscious_reprogramming_slide_*.jpg"

