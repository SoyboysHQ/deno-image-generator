# Docker Testing Guide

Complete guide for testing all endpoints in Docker.

## Quick Start

### 1. Build and Start Container

```bash
./docker-test-build.sh
```

This will:
- ✅ Build the Docker image
- ✅ Start the container on port 8000
- ✅ Verify health endpoint
- ✅ Prepare for testing

### 2. Run Individual Tests

Test each endpoint separately:

```bash
# Test health endpoint
./docker-test-health.sh

# Test image generation
./docker-test-image.sh

# Test carousel generation
./docker-test-carousel.sh

# Test reel generation
./docker-test-reel.sh
```

### 3. Run All Tests

Test all endpoints at once:

```bash
./docker-test-all.sh
```

### 4. Cleanup

Stop and remove the test container:

```bash
./docker-test-cleanup.sh
```

## Test Scripts Overview

| Script | Purpose | Output |
|--------|---------|--------|
| `docker-test-build.sh` | Build image and start container | Container ready for testing |
| `docker-test-health.sh` | Test GET /health endpoint | JSON health response |
| `docker-test-image.sh` | Test POST /generate-image | `docker_test_image.jpg` |
| `docker-test-carousel.sh` | Test POST /generate-carousel | `docker_test_slide_*.jpg` |
| `docker-test-reel.sh` | Test POST /generate-reel | `docker_test_reel.mp4` |
| `docker-test-all.sh` | Run all endpoint tests | All outputs above |
| `docker-test-cleanup.sh` | Stop and remove container | Clean state |

## Typical Workflow

### First Time Setup

```bash
# Build and start
./docker-test-build.sh

# Test all endpoints
./docker-test-all.sh

# Review generated files
open docker_test_image.jpg
open docker_test_slide_1.jpg
open docker_test_reel.mp4
```

### Development Workflow

```bash
# 1. Make changes to code

# 2. Rebuild and restart
./docker-test-cleanup.sh
./docker-test-build.sh

# 3. Test specific endpoint
./docker-test-image.sh

# 4. Test all if major changes
./docker-test-all.sh
```

### Quick Testing (Container Already Running)

```bash
# Just run the test you need
./docker-test-health.sh
./docker-test-image.sh
./docker-test-carousel.sh
./docker-test-reel.sh
```

## Detailed Test Information

### Health Endpoint Test

**Script**: `docker-test-health.sh`

**What it tests**:
- Container is running
- Health endpoint responds
- Returns valid JSON
- HTTP 200 status code

**Expected output**:
```json
{
  "status": "ok",
  "message": "Instagram Generator Server is running",
  "endpoints": {...},
  "version": "2.0.0"
}
```

### Image Generation Test

**Script**: `docker-test-image.sh`

**What it tests**:
- POST /generate-image endpoint
- Accepts JSON input from `example_input.json`
- Generates valid JPEG file
- Returns proper HTTP headers

**Input**: `example_input.json`
**Output**: `docker_test_image.jpg` (1080x1350px)

### Carousel Generation Test

**Script**: `docker-test-carousel.sh`

**What it tests**:
- POST /generate-carousel endpoint
- Accepts carousel JSON from `example_carousel_input.json`
- Returns JSON with base64-encoded images
- All slides are generated correctly

**Input**: `example_carousel_input.json`
**Output**: 
- `docker_test_carousel_response.json` (JSON response)
- `docker_test_slide_1.jpg`, `docker_test_slide_2.jpg`, etc.

**Note**: Requires `jq` for extracting base64 images. Install with:
- macOS: `brew install jq`
- Linux: `sudo apt-get install jq`

### Reel Generation Test

**Script**: `docker-test-reel.sh`

**What it tests**:
- POST /generate-reel endpoint
- Accepts reel JSON from `example_reel_input.json`
- Generates valid MP4 video file
- FFmpeg is working in container

**Input**: `example_reel_input.json`
**Output**: `docker_test_reel.mp4` (1080x1920, 5 seconds)

**Note**: Uses `ffprobe` to verify video duration (optional).

## All Tests Script

**Script**: `docker-test-all.sh`

Runs all 4 endpoint tests sequentially:

1. ✅ Health endpoint
2. ✅ Image generation  
3. ✅ Carousel generation
4. ✅ Reel generation

**Output summary**:
```
═══════════════════════════════
       Test Summary            
═══════════════════════════════

Total Tests: 4
Passed: 4
Failed: 0

🎉 All tests passed!
```

## Troubleshooting

### Container Not Starting

**Error**: Container exits immediately

**Solutions**:
```bash
# Check build logs
docker build -t image-generator:latest .

# Check container logs
docker logs image-generator-test

# Verify Dockerfile is correct
cat Dockerfile | grep -A 5 "RUN apt-get"
```

### Test Fails But Container Running

**Error**: Test script fails but health check works

**Solutions**:
```bash
# Check container logs in real-time
docker logs -f image-generator-test

# Test endpoint manually
curl http://localhost:8000/health

# Verify input files exist
ls -la example_*.json
```

### Port Already in Use

**Error**: Port 8000 already in use

**Solutions**:
```bash
# Find process using port 8000
lsof -i :8000

# Kill existing container
docker stop image-generator-test
docker rm image-generator-test

# Or use cleanup script
./docker-test-cleanup.sh
```

### FFmpeg Not Working in Container

**Error**: Reel generation fails

**Solutions**:
```bash
# Verify FFmpeg in container
docker exec image-generator-test ffmpeg -version

# Rebuild with fresh image
docker rmi image-generator:latest
./docker-test-build.sh
```

### Test Files Not Generated

**Error**: No output files created

**Solutions**:
```bash
# Check file permissions
ls -la docker_test_*

# Verify curl is working
curl --version

# Test with verbose output
curl -v -X POST http://localhost:8000/generate-image \
  -H "Content-Type: application/json" \
  -d @example_input.json \
  --output test.jpg
```

## Container Management

### View Logs

```bash
# All logs
docker logs image-generator-test

# Follow logs (real-time)
docker logs -f image-generator-test

# Last 50 lines
docker logs --tail 50 image-generator-test
```

### Container Info

```bash
# Container status
docker ps -a | grep image-generator

# Container stats (CPU, Memory)
docker stats image-generator-test

# Inspect container
docker inspect image-generator-test
```

### Execute Commands in Container

```bash
# Interactive shell
docker exec -it image-generator-test /bin/bash

# Check FFmpeg
docker exec image-generator-test ffmpeg -version

# List files
docker exec image-generator-test ls -la /app
```

### Stop and Remove

```bash
# Stop container
docker stop image-generator-test

# Remove container
docker rm image-generator-test

# Or use cleanup script
./docker-test-cleanup.sh
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and start container
        run: ./docker-test-build.sh
      
      - name: Run all tests
        run: ./docker-test-all.sh
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: test-outputs
          path: docker_test_*
      
      - name: Cleanup
        if: always()
        run: ./docker-test-cleanup.sh
```

### GitLab CI Example

```yaml
test:
  image: docker:latest
  services:
    - docker:dind
  script:
    - ./docker-test-build.sh
    - ./docker-test-all.sh
  artifacts:
    paths:
      - docker_test_*
  after_script:
    - ./docker-test-cleanup.sh
```

## Performance Benchmarks

Typical test durations on M1 Mac:

| Test | Duration | Output Size |
|------|----------|-------------|
| Build image | 30-60s | ~500MB |
| Start container | 5-10s | - |
| Health check | <1s | <1KB |
| Image generation | 2-3s | ~500KB |
| Carousel (3 slides) | 5-8s | ~1.5MB |
| Reel (5s video) | 3-5s | ~500KB |
| **Total (all tests)** | **45-90s** | **~3MB** |

## Best Practices

1. **Always cleanup between major changes**
   ```bash
   ./docker-test-cleanup.sh
   ./docker-test-build.sh
   ```

2. **Test individually during development**
   - Faster feedback
   - Easier debugging
   - Save time

3. **Run all tests before deployment**
   ```bash
   ./docker-test-all.sh
   ```

4. **Keep container running for rapid testing**
   - Build once
   - Test multiple times
   - No restart overhead

5. **Check logs when tests fail**
   ```bash
   docker logs --tail 100 image-generator-test
   ```

## Advanced Usage

### Custom Container Name

```bash
# Modify scripts to use custom name
export CONTAINER_NAME=my-custom-generator

# Or edit scripts directly
# Change: image-generator-test
# To: your-custom-name
```

### Different Port

```bash
# In docker-test-build.sh, change:
-p 8000:8000

# To:
-p 3000:8000

# Then update test scripts to use port 3000
```

### Mount Local Files

```bash
# Add volume mount in docker-test-build.sh:
docker run -d \
  --name image-generator-test \
  -p 8000:8000 \
  -v $(pwd)/assets:/app/assets \
  image-generator:latest
```

## Summary

The Docker testing suite provides:

✅ **Modular testing** - Test one endpoint or all
✅ **Fast iteration** - Build once, test many times
✅ **Easy cleanup** - One command to clean up
✅ **CI/CD ready** - Scripts work in pipelines
✅ **Well documented** - Clear output and errors

**Next Steps**:
1. Run `./docker-test-build.sh`
2. Run `./docker-test-all.sh`
3. Deploy with confidence! 🚀

