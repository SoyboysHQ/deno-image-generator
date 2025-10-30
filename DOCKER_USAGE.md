# Docker Usage Guide

This guide explains how to build, test, and run the Instagram Generator service using Docker and Make commands.

## Quick Start

### Build and Test
```bash
# Build Docker image and start container
make docker-test-setup

# Run all tests (includes the new three-part reel endpoint)
make docker-test-all

# Or test individual endpoints
make docker-test-three-part-reel
```

### Production Deployment
```bash
# Build and start the service
make docker-build
make docker-start

# Or rebuild everything from scratch
make docker-rebuild
```

## Available Make Commands

### Building

- `make docker-build` - Build Docker image (uses cache for speed)
- `make docker-build-fresh` - Build Docker image without cache (clean build)
- `make docker-rebuild` - Clean everything and rebuild from scratch

### Running

- `make docker-start` - Start the Docker container
- `make docker-stop` - Stop the Docker container  
- `make docker-update` - Quick update for local dev (uses cache)
- `make docker-restart` - Restart with fresh build (no cache)

### Testing

All test commands automatically check if the container is running:

- `make docker-test-setup` - Build and start test container
- `make docker-test-all` - Run all 7 endpoint tests
- `make docker-test-health` - Test health endpoint
- `make docker-test-image` - Test image generation
- `make docker-test-carousel` - Test carousel generation
- `make docker-test-reel` - Test single-image reel generation
- `make docker-test-two-image-reel` - Test two-image reel generation
- `make docker-test-three-part-reel` - **NEW: Test three-part reel generation**
- `make docker-test-watermark` - Test watermark generation
- `make docker-test-cleanup` - Stop and cleanup test container

### Monitoring

- `make docker-logs` - Show container logs (follow mode)
- `make docker-shell` - Open a bash shell inside the container

### Cleanup

- `make clean` - Remove all Docker images and containers

## Testing the New Three-Part Reel Endpoint

The three-part reel endpoint creates a 6-second video with:
1. First image with text overlay (2s)
2. Fade transition between images (2s)
3. Second image with text overlay (2s)

### Using Make
```bash
# Test just the three-part reel endpoint
make docker-test-three-part-reel
```

### Manual Testing

1. **Start the container:**
   ```bash
   make docker-start
   ```

2. **Run the test script:**
   ```bash
   ./docker-test-three-part-reel.sh
   ```

3. **Or use curl directly:**
   ```bash
   curl -X POST http://localhost:8000/generate-three-part-reel \
     -H "Content-Type: application/json" \
     -d @example_three_part_reel_input.json \
     --output my_reel.mp4
   ```

## Example Input

The `example_three_part_reel_input.json` file contains:

```json
{
  "image1Url": "https://res.cloudinary.com/dzahc280d/image/upload/v1761824929/nano_b_base_sideways_dhbbtq.png",
  "image2Url": "https://res.cloudinary.com/dzahc280d/image/upload/v1761824926/nano_b_base_cover_z5tonh.png",
  "text1": "The journey begins with a single step",
  "text2": "And ends with a thousand memories",
  "audioPath": "assets/audio/background-music-7.mp3"
}
```

## Test Output Files

When running tests, the following files are generated:

- `docker_test_image.jpg` - Single image generation test
- `docker_test_slide_*.jpg` - Carousel slides
- `docker_test_reel.mp4` - Single-image reel
- `docker_test_two_image_reel.mp4` - Two-image reel
- **`docker_test_three_part_reel.mp4`** - Three-part reel (NEW)
- `output/docker_watermark_test.jpg` - Watermarked image

Clean up test files with:
```bash
make docker-test-cleanup
```

## Common Workflows

### Local Development
```bash
# Make code changes
# ...

# Quick update (uses cache, much faster)
make docker-update

# Test your changes
make docker-test-all
```

### Testing a Single Endpoint
```bash
# Start container if not running
make docker-start

# Test specific endpoint
make docker-test-three-part-reel

# Check logs if needed
make docker-logs
```

### Full Clean Rebuild
```bash
# Clean everything and rebuild
make clean
make docker-build-fresh
make docker-start
make docker-test-all
```

### Debugging
```bash
# Open shell inside container
make docker-shell

# Inside container, you can:
deno --version
ffmpeg -version
ls -la assets/
cat src/server.ts
# etc.
```

## Container Details

**Container Name:** `instagram-generator-app`  
**Image Name:** `instagram-generator`  
**Port:** `8000`  
**Base Image:** `denoland/deno:2.0.6`

### Installed Dependencies
- Deno runtime
- FFmpeg (for video processing)
- Font packages (Liberation fonts)
- Canvas native dependencies

### Health Check
The container includes a health check that runs every 30 seconds:
```bash
curl http://localhost:8000/health
```

## Troubleshooting

### Container won't start
```bash
# Check if port 8000 is already in use
lsof -i :8000

# Check Docker daemon is running
docker info

# View container logs
make docker-logs
```

### Tests failing
```bash
# Check container logs
make docker-logs

# Open shell and debug
make docker-shell

# Rebuild from scratch
make docker-rebuild
```

### Memory issues
The Docker configuration uses memory-optimized FFmpeg settings. If you still encounter issues:

1. Increase Docker memory limit (Docker Desktop settings)
2. Check available system resources
3. Try processing smaller images

### File not found errors
Make sure you're running commands from the project root directory where the `Makefile` is located.

## Performance Tips

1. **Use `docker-update` for rapid iteration** - It's much faster than `docker-restart`
2. **Cache is your friend** - The build process caches dependencies
3. **Test individual endpoints** - Faster than running all tests
4. **Keep container running** - Start/stop is slower than keeping it running

## CI/CD Integration

For automated testing in CI/CD pipelines:

```bash
# Build and test in one go
make docker-test-setup && make docker-test-all

# Or use individual commands
docker build -t instagram-generator .
docker run -d -p 8000:8000 --name instagram-generator-app instagram-generator
./docker-test-all.sh
```

## See Also

- [THREE_PART_REEL.md](./docs/THREE_PART_REEL.md) - Three-part reel endpoint documentation
- [DOCKER_TESTING.md](./docs/DOCKER_TESTING.md) - Detailed Docker testing guide
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Production deployment guide

