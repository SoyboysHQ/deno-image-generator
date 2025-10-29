#!/bin/bash

# Docker test script - All Endpoints

set -e  # Exit on error

# Container name (matches Makefile)
CONTAINER_NAME="${DOCKER_CONTAINER:-instagram-generator-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Docker Test - All Endpoints${NC}"
echo "=================================="
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
    echo "Starting container..."
    echo ""
    ./docker-test-build.sh
    echo ""
fi

echo -e "${GREEN}✅ Container is running${NC}"
echo ""

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Health
echo -e "${BLUE}╔═══════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test 1/6: Health Endpoint   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════╝${NC}"
echo ""

if ./docker-test-health.sh > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health endpoint: PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Health endpoint: FAILED${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo ""

# Test 2: Image Generation
echo -e "${BLUE}╔═══════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test 2/6: Image Generation  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════╝${NC}"
echo ""

if ./docker-test-image.sh; then
    echo -e "${GREEN}✅ Image generation: PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Image generation: FAILED${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo ""

# Test 3: Carousel Generation
echo -e "${BLUE}╔═══════════════════════════════╗${NC}"
echo -e "${BLUE}║ Test 3/6: Carousel Generation║${NC}"
echo -e "${BLUE}╚═══════════════════════════════╝${NC}"
echo ""

if ./docker-test-carousel.sh; then
    echo -e "${GREEN}✅ Carousel generation: PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Carousel generation: FAILED${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo ""

# Test 4: Reel Generation
echo -e "${BLUE}╔═══════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test 4/6: Reel Generation   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════╝${NC}"
echo ""

if ./docker-test-reel.sh; then
    echo -e "${GREEN}✅ Reel generation: PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Reel generation: FAILED${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo ""

# Test 5: Two-Image Reel Generation
echo -e "${BLUE}╔═══════════════════════════════╗${NC}"
echo -e "${BLUE}║Test 5/6: Two-Image Reel Gen  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════╝${NC}"
echo ""

if ./docker-test-two-image-reel.sh; then
    echo -e "${GREEN}✅ Two-image reel generation: PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Two-image reel generation: FAILED${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo ""

# Test 6: Watermark Generation
echo -e "${BLUE}╔═══════════════════════════════╗${NC}"
echo -e "${BLUE}║Test 6/6: Watermark Generation║${NC}"
echo -e "${BLUE}╚═══════════════════════════════╝${NC}"
echo ""

if ./docker-test-watermark.sh; then
    echo -e "${GREEN}✅ Watermark generation: PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Watermark generation: FAILED${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════${NC}"
echo -e "${BLUE}       Test Summary            ${NC}"
echo -e "${BLUE}═══════════════════════════════${NC}"
echo ""
echo -e "Total Tests: 6"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Generated files:"
    ls -lh docker_test_image.jpg 2>/dev/null && echo "  ✅ docker_test_image.jpg"
    ls -lh docker_test_slide_*.jpg 2>/dev/null && echo "  ✅ docker_test_slide_*.jpg"
    ls -lh docker_test_reel.mp4 2>/dev/null && echo "  ✅ docker_test_reel.mp4"
    ls -lh docker_test_two_image_reel.mp4 2>/dev/null && echo "  ✅ docker_test_two_image_reel.mp4"
    ls -lh output/docker_watermark_test.jpg 2>/dev/null && echo "  ✅ output/docker_watermark_test.jpg"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Check container logs:"
    echo "  docker logs image-generator-test"
    echo ""
    exit 1
fi

