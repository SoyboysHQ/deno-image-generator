#!/usr/bin/env bash
set -e

echo "🐳 Docker Watermark Endpoint Test"
echo "=================================="
echo ""

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Service is ready!"
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting..."
    sleep 1
  fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ Service did not start within 30 seconds"
  echo "💡 Check container logs: docker logs instagram-generator-app"
  exit 1
fi

echo ""
echo "🧪 Testing watermark endpoint..."
echo ""

# Convert test image to base64
if [ -f "watermark_target_image.png" ]; then
  BASE64_IMAGE=$(base64 -i watermark_target_image.png)
else
  echo "❌ Test image watermark_target_image.png not found!"
  docker-compose down
  exit 1
fi

# Create JSON input
cat > temp_watermark_input.json <<EOF
{
  "targetImage": "data:image/png;base64,${BASE64_IMAGE}"
}
EOF

# Send request
echo "📤 Sending watermark request..."
RESPONSE=$(curl -X POST \
  http://localhost:8000/generate-watermark \
  -H "Content-Type: application/json" \
  -d @temp_watermark_input.json \
  -o output/docker_watermark_test.jpg \
  -w "%{http_code}" \
  -s)

# Create output directory if it doesn't exist
mkdir -p output

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Watermark generated successfully!"
  SIZE=$(ls -lh output/docker_watermark_test.jpg | awk '{print $5}')
  echo "📊 Output size: $SIZE"
  echo ""
  echo "🎉 Docker test passed!"
else
  echo "❌ Request failed with status code: $RESPONSE"
  cat output/docker_watermark_test.jpg
  rm -f temp_watermark_input.json
  exit 1
fi

# Cleanup
rm -f temp_watermark_input.json

echo ""
echo "✅ Docker test completed successfully!"

