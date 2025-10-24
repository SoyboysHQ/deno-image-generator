#!/bin/bash

echo "🧪 Testing Reel Generation Server Endpoint"
echo "=========================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "❌ Server is not running. Start it with:"
  echo "   deno task server"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Test the generate-reel endpoint
echo "Testing POST /generate-reel endpoint..."
echo ""

curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output test_reel_output.mp4 \
  -w "\nHTTP Status: %{http_code}\n"

if [ $? -eq 0 ] && [ -f test_reel_output.mp4 ]; then
  echo ""
  echo "✅ Reel generated successfully via API!"
  echo ""
  echo "Generated file:"
  ls -lh test_reel_output.mp4
  echo ""
  echo "Preview the video with: open test_reel_output.mp4 (macOS) or xdg-open test_reel_output.mp4 (Linux)"
else
  echo ""
  echo "❌ Reel generation via API failed"
  exit 1
fi

