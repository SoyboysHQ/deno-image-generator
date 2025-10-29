#!/usr/bin/env bash
set -e

echo "🧪 Testing Watermark Generation Endpoint"
echo "=========================================="
echo ""

# Convert test image to base64
echo "📷 Converting test image to base64..."
if [ -f "watermark_target_image.png" ]; then
  BASE64_IMAGE=$(base64 -i watermark_target_image.png)
else
  echo "❌ Test image watermark_target_image.png not found!"
  exit 1
fi

# Check if watermark exists
if [ ! -f "assets/images/watermark.png" ]; then
  echo "❌ Watermark file assets/images/watermark.png not found!"
  exit 1
fi

echo "✅ Images loaded"
echo ""

# Create JSON input
cat > temp_watermark_input.json <<EOF
{
  "targetImage": "data:image/png;base64,${BASE64_IMAGE}"
}
EOF

echo "📤 Sending request to http://localhost:8000/generate-watermark"
echo ""

# Send request
RESPONSE=$(curl -X POST \
  http://localhost:8000/generate-watermark \
  -H "Content-Type: application/json" \
  -d @temp_watermark_input.json \
  -o watermarked_test_output.jpg \
  -w "%{http_code}" \
  -s)

# Check response
if [ "$RESPONSE" = "200" ]; then
  echo "✅ Success! Watermarked image saved to: watermarked_test_output.jpg"
  
  # Get file size
  SIZE=$(ls -lh watermarked_test_output.jpg | awk '{print $5}')
  echo "📊 File size: $SIZE"
  echo ""
  echo "🎉 Test completed successfully!"
else
  echo "❌ Request failed with status code: $RESPONSE"
  cat watermarked_test_output.jpg
  exit 1
fi

# Cleanup
rm -f temp_watermark_input.json

echo ""
echo "🧹 Temporary files cleaned up"

