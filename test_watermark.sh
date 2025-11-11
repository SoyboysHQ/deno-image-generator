#!/usr/bin/env bash
set -e

echo "🧪 Testing Watermark Generation Endpoint"
echo "=========================================="
echo ""

# Convert test image to base64
echo "📷 Converting test image to base64..."
if [ -f "watermark_target_image.png" ]; then
  base64 -i watermark_target_image.png > temp_base64.txt
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

# Check if example file exists
if [ ! -f "example_watermark_input.json" ]; then
  echo "❌ example_watermark_input.json not found!"
  exit 1
fi

# Create temp JSON by reading example file and replacing placeholder
# Read files directly to avoid "Argument list too long" error
awk '{
  if (/YOUR_BASE64_IMAGE_HERE/) {
    while ((getline line < "temp_base64.txt") > 0) {
      gsub(/YOUR_BASE64_IMAGE_HERE/, line)
      break
    }
  }
  print
}' example_watermark_input.json > temp_watermark_input.json

# Clean up temp base64 file
rm -f temp_base64.txt

echo "📤 Sending request to http://localhost:8000/generate-watermark (using example_watermark_input.json)"
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

