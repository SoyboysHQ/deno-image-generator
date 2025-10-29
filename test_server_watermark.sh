#!/usr/bin/env bash

# Test script for watermark endpoint with running server
# Usage: ./test_server_watermark.sh

echo "🧪 Testing Watermark Endpoint (with running server)"
echo "===================================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:8000/health > /dev/null; then
  echo "❌ Server is not running on port 8000"
  echo "💡 Start the server first with: deno task dev"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Convert test image to base64
echo "📷 Converting test image to base64..."
if [ -f "watermark_target_image.png" ]; then
  BASE64_IMAGE=$(base64 -i watermark_target_image.png)
else
  echo "❌ Test image watermark_target_image.png not found!"
  exit 1
fi

# Create JSON input
cat > temp_watermark_input.json <<EOF
{
  "targetImage": "data:image/png;base64,${BASE64_IMAGE}"
}
EOF

echo "📤 Sending request to /generate-watermark..."
echo ""

# Send request
curl -X POST \
  http://localhost:8000/generate-watermark \
  -H "Content-Type: application/json" \
  -d @temp_watermark_input.json \
  -o watermarked_test_output.jpg

echo ""
echo ""

# Check if file was created
if [ -f "watermarked_test_output.jpg" ]; then
  SIZE=$(ls -lh watermarked_test_output.jpg | awk '{print $5}')
  echo "✅ Watermarked image saved: watermarked_test_output.jpg ($SIZE)"
  echo ""
  echo "🎉 Test completed successfully!"
else
  echo "❌ Failed to generate watermarked image"
  exit 1
fi

# Cleanup
rm -f temp_watermark_input.json

