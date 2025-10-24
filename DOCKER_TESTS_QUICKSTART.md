# Docker Testing - Quick Reference

## 🚀 Quick Start (3 Commands)

```bash
# 1. Build and start container
./docker-test-build.sh

# 2. Test all endpoints
./docker-test-all.sh

# 3. Done! Cleanup when finished
./docker-test-cleanup.sh
```

## 📋 All Test Scripts

| Script | What It Tests | Output |
|--------|---------------|--------|
| `docker-test-build.sh` | Build & start container | Container running |
| `docker-test-health.sh` | GET /health | JSON response |
| `docker-test-image.sh` | POST /generate-image | `docker_test_image.jpg` |
| `docker-test-carousel.sh` | POST /generate-carousel | `docker_test_slide_*.jpg` |
| `docker-test-reel.sh` | POST /generate-reel | `docker_test_reel.mp4` |
| `docker-test-all.sh` | All 4 endpoints | All outputs |
| `docker-test-cleanup.sh` | Stop & remove | Clean state |

## 🎯 Common Workflows

### Test Everything

```bash
./docker-test-build.sh && ./docker-test-all.sh
```

### Test One Endpoint

```bash
./docker-test-build.sh    # Build once
./docker-test-image.sh     # Test specific endpoint
./docker-test-reel.sh      # Test another endpoint
```

### Development Cycle

```bash
# 1. Make code changes

# 2. Rebuild
./docker-test-cleanup.sh
./docker-test-build.sh

# 3. Test
./docker-test-image.sh
```

## 🛠️ Using Make

```bash
# Setup
make docker-test-setup

# Test individual endpoints
make docker-test-health
make docker-test-image
make docker-test-carousel
make docker-test-reel

# Test all
make docker-test-all

# Cleanup
make docker-test-cleanup
```

## ✅ Expected Results

### Health Check
- HTTP 200
- JSON with status: "ok"

### Image Generation
- HTTP 200
- JPG file ~500KB
- 1080x1350 pixels

### Carousel Generation
- HTTP 200
- JSON with base64 images
- Multiple slide_*.jpg files

### Reel Generation
- HTTP 200
- MP4 file ~500KB
- 1080x1920, 5 seconds

## 🔍 Troubleshooting

### Container Won't Start
```bash
docker logs image-generator-test
```

### Test Fails
```bash
# Check if container is running
docker ps | grep image-generator-test

# View logs
docker logs --tail 50 image-generator-test
```

### Port Already in Use
```bash
./docker-test-cleanup.sh
```

## 📖 Documentation

- Full guide: [docs/DOCKER_TESTING.md](docs/DOCKER_TESTING.md)
- Main README: [README.md](README.md)
- Reel docs: [docs/REEL.md](docs/REEL.md)

## 💡 Pro Tips

1. **Keep container running** for fast testing
   ```bash
   ./docker-test-build.sh    # Once
   ./docker-test-image.sh     # Many times
   ```

2. **View logs in real-time**
   ```bash
   docker logs -f image-generator-test
   ```

3. **Test in CI/CD**
   ```bash
   ./docker-test-build.sh && ./docker-test-all.sh
   ```

4. **View test outputs**
   ```bash
   open docker_test_image.jpg      # macOS
   xdg-open docker_test_reel.mp4   # Linux
   ```

## 🎬 One-Liner Commands

```bash
# Complete test suite
./docker-test-build.sh && ./docker-test-all.sh && ./docker-test-cleanup.sh

# Quick image test
./docker-test-build.sh && ./docker-test-image.sh

# Rebuild and test
./docker-test-cleanup.sh && ./docker-test-build.sh && ./docker-test-all.sh
```

## 🔗 Related Commands

```bash
# View all containers
docker ps -a

# Stop container
docker stop image-generator-test

# Remove container
docker rm image-generator-test

# View images
docker images

# Remove everything
make clean
```

---

**Ready to test?** Run: `./docker-test-build.sh && ./docker-test-all.sh` 🚀

