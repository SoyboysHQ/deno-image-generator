#!/bin/bash

# Test script for the image generation server

echo "🧪 Testing Image Generator Server"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "1️⃣  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server is running${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Server is not responding${NC}"
    echo -e "${YELLOW}   Make sure the server is running:${NC}"
    echo "   deno task server"
    exit 1
fi

echo ""
echo "2️⃣  Testing image generation..."

# Test image generation
curl -X POST http://localhost:8000 \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/example_input.json \
  --output test_server_output.jpg \
  -w "\n   HTTP Status: %{http_code}\n" \
  -s

if [ -f "test_server_output.jpg" ]; then
    FILE_SIZE=$(ls -lh test_server_output.jpg | awk '{print $5}')
    echo -e "${GREEN}✅ Image generated successfully${NC}"
    echo "   File: test_server_output.jpg"
    echo "   Size: $FILE_SIZE"
    
    # Open the image (macOS)
    if command -v open &> /dev/null; then
        echo ""
        echo "   Opening image..."
        open test_server_output.jpg
    fi
else
    echo -e "${RED}❌ Image generation failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Install CloudFlare Tunnel: brew install cloudflare/cloudflare/cloudflared"
echo "2. Start tunnel: cloudflared tunnel --url http://localhost:8000"
echo "3. Use the public URL in n8n"

