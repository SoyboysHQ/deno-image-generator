#!/bin/bash

# Docker cleanup script - Stop and remove test container

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Test Cleanup${NC}"
echo "======================="
echo ""

# Check if container exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo -e "${YELLOW}🧹 Stopping and removing container...${NC}"
    docker stop $CONTAINER_NAME > /dev/null 2>&1 || true
    docker rm $CONTAINER_NAME > /dev/null 2>&1 || true
    echo -e "${GREEN}✅ Container removed${NC}"
else
    echo -e "${YELLOW}ℹ️  No container found${NC}"
fi

echo ""

# Optionally remove test output files
read -p "Remove test output files? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧹 Removing test output files...${NC}"
    rm -f docker_test_*.jpg docker_test_*.json docker_test_*.mp4 2>/dev/null
    echo -e "${GREEN}✅ Test files removed${NC}"
else
    echo -e "${YELLOW}ℹ️  Test files kept${NC}"
fi

echo ""
echo -e "${GREEN}✅ Cleanup complete${NC}"

