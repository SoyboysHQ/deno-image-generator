# Docker Testing for Two-Image Reel Endpoint

## Quick Start

Test the two-image reel endpoint in Docker:

```bash
# 1. Setup (build and start container)
make docker-test-setup

# 2. Test two-image reel endpoint
make docker-test-two-image-reel

# 3. Or run all tests (includes two-image reel)
make docker-test-all

# 4. Cleanup
make docker-test-cleanup
```

## Individual Commands

### Setup Container
```bash
make docker-test-setup
# or
./docker-test-build.sh
```

### Test Two-Image Reel
```bash
make docker-test-two-image-reel
# or
./docker-test-two-image-reel.sh
```

### Test All Endpoints (5 tests)
```bash
make docker-test-all
# Tests:
# 1. Health endpoint
# 2. Image generation
# 3. Carousel generation
# 4. Reel generation
# 5. Two-image reel generation (NEW)
```

### Cleanup
```bash
make docker-test-cleanup
# or
./docker-test-cleanup.sh
```

## What Gets Tested

The two-image reel test:
1. Checks if Docker container is running
2. Sends POST request to `/generate-two-image-reel` endpoint
3. Uses `example_two_image_reel_input.json` as test data
4. Validates HTTP 200 response
5. Verifies output file `docker_test_two_image_reel.mp4` is created
6. Shows video metadata (duration, size, codec, dimensions)

## Output Files

After running tests, you'll have:
- `docker_test_two_image_reel.mp4` - Generated video (1080x1920, MP4)

## Example Test Output

```bash
$ make docker-test-two-image-reel

🎥 Testing Two-Image Reel Generation in Docker
================================================

📦 Container: instagram-generator-test
🌐 Port: 8000

🎬 Testing two-image reel generation...
----------------------------------------
HTTP Status: 200
✅ Two-image reel generated successfully
   File: docker_test_two_image_reel.mp4
   Size: 1.2M

📊 Video Information:
   -------------------
   width:          1080
   height:         1920
   codec_name:     h264
   r_frame_rate:   30/1
   duration:       15.000000
   size:           1234567

🎉 Two-image reel test PASSED
```

## Troubleshooting

### Container not running
```bash
# Error: Container 'instagram-generator-test' is not running
make docker-test-setup
```

### Test fails
```bash
# Check container logs
docker logs instagram-generator-test

# Or use make command
make docker-logs
```

### Port already in use
```bash
# Stop existing container
make docker-stop

# Or manually
docker stop instagram-generator-test
docker rm instagram-generator-test
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Build Docker Image
  run: make docker-test-setup

- name: Test All Endpoints
  run: make docker-test-all

- name: Cleanup
  if: always()
  run: make docker-test-cleanup
```

## Make Commands Reference

| Command | Description |
|---------|-------------|
| `make docker-test-setup` | Build and start test container |
| `make docker-test-all` | Run all endpoint tests (1-5) |
| `make docker-test-health` | Test health endpoint only |
| `make docker-test-image` | Test image generation only |
| `make docker-test-carousel` | Test carousel generation only |
| `make docker-test-reel` | Test reel generation only |
| `make docker-test-two-image-reel` | Test two-image reel only (NEW) |
| `make docker-test-cleanup` | Stop and cleanup container |
| `make docker-logs` | View container logs |
| `make docker-shell` | Open shell in container |

## Related Documentation

- [TWO_IMAGE_REEL.md](docs/TWO_IMAGE_REEL.md) - Two-image reel API documentation
- [DOCKER_TESTING.md](docs/DOCKER_TESTING.md) - Complete Docker testing guide
- [README.md](README.md) - Main project documentation

