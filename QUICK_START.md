# Quick Start - Three-Part Reel Endpoint

## 🚀 Run in Docker (3 commands)

```bash
# 1. Build and start
make docker-build && make docker-start

# 2. Test the endpoint
make docker-test-three-part-reel

# 3. View the result
open docker_test_three_part_reel.mp4
```

## 📝 Example Request

```bash
curl -X POST http://localhost:8000/generate-three-part-reel \
  -H "Content-Type: application/json" \
  -d '{
    "image1Url": "https://res.cloudinary.com/dzahc280d/image/upload/v1761824929/nano_b_base_sideways_dhbbtq.png",
    "image2Url": "https://res.cloudinary.com/dzahc280d/image/upload/v1761824926/nano_b_base_cover_z5tonh.png",
    "text1": "The journey begins with a single step",
    "text2": "And ends with a thousand memories",
    "audioPath": "assets/audio/background-music-7.mp3"
  }' \
  --output my_reel.mp4
```

## 🎬 What You Get

- **6-second Instagram reel** (1080x1920)
- Part 1: Image 1 with text (2s)
- Part 2: Smooth fade transition (2s)
- Part 3: Image 2 with text (2s)
- Background music included

## 📚 More Info

- Full API docs: `docs/THREE_PART_REEL.md`
- Docker guide: `DOCKER_USAGE.md`
- Setup details: `DOCKER_THREE_PART_REEL_SETUP.md`

