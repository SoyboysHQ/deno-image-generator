#!/bin/bash

echo "🧪 Testing Instagram Generator Server"
echo "======================================"
echo ""

# Test 1: Health check
echo "1️⃣ Testing health check endpoint..."
curl -s http://localhost:8000/health | jq '.'
echo ""
echo ""

# Test 2: Generate single image (download to file)
echo "2️⃣ Testing /generate-image endpoint..."
echo "   Generating and saving image..."
curl -s -X POST http://localhost:8000/generate-image \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/example_input.json \
  --output test_generated_image.jpg
if [ -f test_generated_image.jpg ]; then
  SIZE=$(du -h test_generated_image.jpg | cut -f1)
  echo "   ✅ Image saved to test_generated_image.jpg ($SIZE)"
else
  echo "   ❌ Failed to generate image"
fi
echo ""
echo ""

# Test 3: Generate carousel (metadata only - images are large)
echo "3️⃣ Testing /generate-carousel endpoint..."
echo "   Generating carousel (getting metadata only)..."
RESPONSE=$(curl -s -X POST http://localhost:8000/generate-carousel \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/example_carousel_input.json)

# Extract just the metadata (without base64 data)
echo "$RESPONSE" | jq '{success: .success, slideCount: .slideCount, slides: [.slides[] | {filename: .filename, size: (.base64 | length)}]}'
echo ""
echo ""

# Test 4: Test backward compatibility (root endpoint)
echo "4️⃣ Testing backward compatibility (POST /)..."
echo "   Using root endpoint (should work like /generate-image)..."
curl -s -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/example_input.json \
  --output test_root_endpoint.jpg
if [ -f test_root_endpoint.jpg ]; then
  SIZE=$(du -h test_root_endpoint.jpg | cut -f1)
  echo "   ✅ Root endpoint works! Image saved ($SIZE)"
  rm test_root_endpoint.jpg
else
  echo "   ❌ Root endpoint failed"
fi
echo ""
echo ""

# Test 5: Invalid endpoint
echo "5️⃣ Testing invalid endpoint (should return 404)..."
curl -s -X POST http://localhost:8000/invalid-endpoint \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""
echo ""

# Test 6: Invalid input format
echo "6️⃣ Testing invalid input (should return 400)..."
curl -s -X POST http://localhost:8000/generate-image \
  -H "Content-Type: application/json" \
  -d '{"wrong": "format"}' | jq '.'
echo ""
echo ""

echo "✅ All tests completed!"
echo ""
echo "📁 Generated files:"
echo "   - test_generated_image.jpg (from /generate-image)"
echo ""


