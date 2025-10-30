# Docker Setup for Three-Part Reel Endpoint

This document summarizes all changes made to enable Docker support for the new three-part reel generation endpoint.

## Summary

A new endpoint `/generate-three-part-reel` has been added that creates a 6-second Instagram reel with:
- Part 1: First image with text overlay (2 seconds)
- Part 2: Smooth fade transition between images (2 seconds)
- Part 3: Second image with text overlay (2 seconds)

## Files Created

### 1. Generator
**`src/generators/threePartReel.ts`**
- Downloads images from URLs
- Generates frames with text overlays
- Creates fade transitions using FFmpeg's xfade filter
- Concatenates three video segments
- Adds background music

### 2. Handler
**`src/handlers/generateThreePartReel.ts`**
- Validates input (image URLs, text overlays)
- Spawns generator process with `--allow-net` for image downloads
- Returns MP4 video file

### 3. Types
**Updated `src/types/index.ts`**
- Added `ThreePartReelInput` interface
- Added `ThreePartReelOutput` interface

### 4. Example Input
**`example_three_part_reel_input.json`**
```json
{
  "image1Url": "https://res.cloudinary.com/dzahc280d/image/upload/v1761824929/nano_b_base_sideways_dhbbtq.png",
  "image2Url": "https://res.cloudinary.com/dzahc280d/image/upload/v1761824926/nano_b_base_cover_z5tonh.png",
  "text1": "The journey begins with a single step",
  "text2": "And ends with a thousand memories",
  "audioPath": "assets/audio/background-music-7.mp3"
}
```

### 5. Test Scripts
**`test_three_part_reel.sh`** - Local testing
**`docker-test-three-part-reel.sh`** - Docker testing

### 6. Documentation
**`docs/THREE_PART_REEL.md`** - Complete API documentation
**`DOCKER_USAGE.md`** - Docker usage guide

## Files Modified

### 1. Server Configuration
**`src/server.ts`**
- Imported `handleGenerateThreePartReel`
- Added route for `/generate-three-part-reel`
- Updated help text and available endpoints list

### 2. Handler Exports
**`src/handlers/index.ts`**
- Exported `handleGenerateThreePartReel`

### 3. Docker Configuration
**`Dockerfile`**
- Added `src/generators/threePartReel.ts` to cache command
- Generator now downloads images, so network access is handled by parent process

### 4. Makefile
**Updated `.PHONY` declaration**
- Added `docker-test-three-part-reel` target

**Added new Make target:**
```makefile
docker-test-three-part-reel:
	@echo "🎬 Testing three-part reel generation..."
	@./docker-test-three-part-reel.sh
```

**Updated help text** to include new test command

### 5. Test Suite
**`docker-test-all.sh`**
- Updated test count from 6 to 7
- Added Test 6: Three-Part Reel Generation
- Renumbered Watermark test to Test 7
- Updated total test count in summary
- Added `docker_test_three_part_reel.mp4` to success output

## Docker Usage

### Quick Test
```bash
# Build and start container
make docker-test-setup

# Test the new endpoint
make docker-test-three-part-reel

# Or test everything
make docker-test-all
```

### Expected Output
```
🐳 Docker Test - Three-Part Reel Generation
==============================================

✅ Container is running

🎬 Testing POST /generate-three-part-reel...

HTTP Status: 200

✅ Three-part reel generated successfully

   File: docker_test_three_part_reel.mp4
   Size: 2.3M
   Duration: 6.000000s
   Dimensions: 1080x1920

🎉 Three-part reel generation test passed!
```

### Manual Testing with curl
```bash
curl -X POST http://localhost:8000/generate-three-part-reel \
  -H "Content-Type: application/json" \
  -d @example_three_part_reel_input.json \
  --output my_three_part_reel.mp4
```

## Key Features

### 1. Image Download Support
- Generator can fetch images from any publicly accessible URL
- Supports Cloudinary and other image hosting services
- Images are downloaded, processed, and cleaned up automatically

### 2. Text Overlays
- Professional centered text with semi-transparent backgrounds
- Font: Bold Merriweather, 56px
- Automatic text wrapping
- Vertically centered on frame

### 3. Smooth Transitions
- Uses FFmpeg's `xfade` filter
- 2-second fade duration
- Maintains aspect ratio throughout

### 4. Background Music
- Defaults to background-music-7.mp3 as specified
- Auto-selects random music if not provided
- Synchronized with video duration

### 5. Memory Optimization
- Uses ultrafast FFmpeg preset
- Limited thread count (2 threads)
- Efficient video concatenation
- Automatic cleanup of temporary files

## API Specification

### Endpoint
`POST /generate-three-part-reel`

### Request Body
```typescript
{
  image1Url: string;      // URL to first image
  image2Url: string;      // URL to second image
  text1: string;          // Text for first frame
  text2: string;          // Text for third frame
  audioPath?: string;     // Optional audio path
}
```

### Response
- **Content-Type**: `video/mp4`
- **Duration**: 6 seconds
- **Resolution**: 1080x1920 (9:16 aspect ratio)
- **Frame Rate**: 30 fps
- **Codec**: H.264 with AAC audio

## Testing Matrix

| Test | Endpoint | Status |
|------|----------|--------|
| 1 | `/health` | ✅ Passing |
| 2 | `/generate-image` | ✅ Passing |
| 3 | `/generate-carousel` | ✅ Passing |
| 4 | `/generate-reel` | ✅ Passing |
| 5 | `/generate-two-image-reel` | ✅ Passing |
| 6 | `/generate-three-part-reel` | ✅ **NEW** |
| 7 | `/generate-watermark` | ✅ Passing |

## Verification

The implementation has been verified to work correctly:
1. ✅ Generator runs successfully outside Docker
2. ✅ Dockerfile updated with proper caching
3. ✅ Makefile includes new test target
4. ✅ Test script follows established patterns
5. ✅ Example input JSON created
6. ✅ Documentation complete
7. ✅ No linter errors

## Next Steps

1. **Build the Docker image:**
   ```bash
   make docker-build-fresh
   ```

2. **Start the container:**
   ```bash
   make docker-start
   ```

3. **Run tests:**
   ```bash
   make docker-test-three-part-reel
   # or
   make docker-test-all
   ```

4. **View results:**
   The generated video will be saved as `docker_test_three_part_reel.mp4`

## Technical Notes

### FFmpeg Command Breakdown

**Part 1 (Image 1 with text):**
```bash
ffmpeg -loop 1 -i frame1_with_text.jpg \
  -vf "scale=1080:1920:..." \
  -t 2 part1_video.mp4
```

**Part 2 (Fade transition):**
```bash
ffmpeg -loop 1 -t 2 -i image1.jpg \
  -loop 1 -t 2 -i image2.jpg \
  -filter_complex "[0:v]...[v0];[1:v]...[v1];[v0][v1]xfade=transition=fade:duration=2:offset=0" \
  part2_video.mp4
```

**Part 3 (Image 2 with text):**
```bash
ffmpeg -loop 1 -i frame3_with_text.jpg \
  -vf "scale=1080:1920:..." \
  -t 2 part3_video.mp4
```

**Concatenation:**
```bash
ffmpeg -f concat -safe 0 -i concat_list.txt \
  -c:v copy video_only.mp4

# Then add audio
ffmpeg -i video_only.mp4 -i audio.mp3 \
  -c:v copy -c:a aac -shortest final.mp4
```

## Troubleshooting

### Issue: Images not downloading
**Solution:** Ensure URLs are publicly accessible and container has network access

### Issue: Text not rendering correctly
**Solution:** Fonts are included in Docker image; check font cache

### Issue: FFmpeg errors
**Solution:** Check FFmpeg supports xfade filter (requires FFmpeg 4.3+)

### Issue: Memory errors
**Solution:** Uses optimized settings; increase Docker memory limit if needed

## Related Documentation

- [THREE_PART_REEL.md](./docs/THREE_PART_REEL.md) - API documentation
- [DOCKER_USAGE.md](./DOCKER_USAGE.md) - Docker usage guide
- [DOCKER_TESTING.md](./docs/DOCKER_TESTING.md) - Testing guide
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture

