#!/bin/bash

# Test markdown carousel generation via HTTP server

echo "🧪 Testing markdown carousel generation via HTTP..."
echo ""

# Start server in background
echo "🚀 Starting server..."
deno run --allow-net --allow-read --allow-write --allow-env --allow-run --allow-ffi --allow-sys src/server.ts &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Send request
echo "📤 Sending request to /generate-markdown-carousel..."
curl -X POST http://localhost:8000/generate-markdown-carousel \
  -H "Content-Type: application/json" \
  -d @example_markdown_carousel_input.json \
  --output markdown_carousel_test.zip

echo ""
echo "📦 Unzipping slides..."
unzip -o markdown_carousel_test.zip

# Stop server
echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID

echo ""
echo "✅ Test complete!"
echo "📂 Check output files: subconscious_reprogramming_slide_*.jpg"

