#!/bin/bash

# Docker test script - Health Endpoint

set -e  # Exit on error

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Test - Health Endpoint${NC}"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${YELLOW}⚠️  Container '$CONTAINER_NAME' is not running${NC}"
    echo "Start it with: ./docker-test-build.sh or make docker-start"
    exit 1
fi

echo -e "${GREEN}✅ Container is running${NC}"
echo ""

# Test health endpoint
echo -e "${BLUE}🔍 Testing GET /health...${NC}"
echo ""

HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo ""
    echo "HTTP Status: $HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
    echo ""
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "HTTP Status: $HTTP_CODE"
    echo ""
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs --tail 50 $CONTAINER_NAME
    exit 1
fi

echo -e "${GREEN}🎉 Health endpoint test passed!${NC}"

