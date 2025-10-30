# Three-Part Reel Generator

The Three-Part Reel Generator creates dynamic Instagram reels with three distinct sections:
- **Part 1**: First image with text overlay (2 seconds)
- **Part 2**: Smooth fade transition from first to second image (2 seconds)
- **Part 3**: Second image with text overlay (2 seconds)

Total duration: **6 seconds**

## Features

- ✨ Downloads images from URLs (Cloudinary, etc.)
- 📝 Centered text overlays with semi-transparent backgrounds
- 🎨 Smooth fade transitions between images
- 🎵 Automatic background music selection (or specify your own)
- 🎬 Instagram Reel format (1080x1920, 9:16 aspect ratio)
- 📱 Optimized video encoding (H.264, 30fps)

## API Endpoint

### `POST /generate-three-part-reel`

**Request Body:**
```json
{
  "image1Url": "https://example.com/image1.png",
  "image2Url": "https://example.com/image2.png",
  "text1": "Text for first frame",
  "text2": "Text for last frame",
  "audioPath": "assets/audio/background-music-7.mp3"  // Optional
}
```

**Required Fields:**
- `image1Url` (string): URL to the first image
- `image2Url` (string): URL to the second image
- `text1` (string): Text overlay for the first frame
- `text2` (string): Text overlay for the third frame

**Optional Fields:**
- `audioPath` (string): Path to background music file. If not provided, a random background music will be selected automatically.

**Response:**
- Content-Type: `video/mp4`
- Binary video file (MP4 format)

## Usage Examples

### Using cURL

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
  --output three_part_reel.mp4
```

### Using the Test Script

Run the included test script:
```bash
./test_three_part_reel.sh
```

### Using the Generator Directly

```bash
deno run --allow-all src/generators/threePartReel.ts '{
  "image1Url": "https://example.com/image1.png",
  "image2Url": "https://example.com/image2.png",
  "text1": "First text",
  "text2": "Second text"
}'
```

## Text Overlay Styling

The text overlays are styled as follows:
- **Font**: Bold Merriweather, 56px
- **Color**: White (#FFFFFF)
- **Background**: Semi-transparent black (rgba(0, 0, 0, 0.6))
- **Alignment**: Center-aligned, vertically centered
- **Line Height**: 72px
- **Auto-wrapping**: Text automatically wraps to fit the width with padding

## Technical Details

### Video Specifications
- **Resolution**: 1080x1920 (9:16 aspect ratio)
- **Frame Rate**: 30 fps
- **Video Codec**: H.264 (libx264)
- **CRF Quality**: 23
- **Pixel Format**: yuv420p (for wide compatibility)
- **Audio Codec**: AAC, 128kbps (when audio is included)

### Image Processing
1. Images are downloaded from the provided URLs
2. Images are scaled and cropped to fit the 9:16 aspect ratio
3. Text overlays are rendered on top with proper wrapping
4. All processing is done server-side using canvas and FFmpeg

### Fade Transition
- Uses FFmpeg's `xfade` filter with `fade` transition
- Smooth 2-second fade from first image to second image
- Maintains consistent aspect ratio throughout

### Performance
- Memory-optimized FFmpeg settings (`ultrafast` preset, limited threads)
- Efficient video concatenation using the concat demuxer
- Automatic cleanup of temporary files after generation

## Example Input File

See `example_three_part_reel_input.json` for a complete example:
```json
{
  "image1Url": "https://res.cloudinary.com/dzahc280d/image/upload/v1761824929/nano_b_base_sideways_dhbbtq.png",
  "image2Url": "https://res.cloudinary.com/dzahc280d/image/upload/v1761824926/nano_b_base_cover_z5tonh.png",
  "text1": "The journey begins with a single step",
  "text2": "And ends with a thousand memories",
  "audioPath": "assets/audio/background-music-7.mp3"
}
```

## Troubleshooting

### Images Not Loading
- Ensure the URLs are publicly accessible
- Check that the URLs point to valid image files (PNG, JPG, JPEG)
- Verify network connectivity from the server

### FFmpeg Errors
- Ensure FFmpeg is installed and available in PATH
- Check FFmpeg version supports `xfade` filter (FFmpeg 4.3+)
- Verify sufficient disk space for temporary files

### Audio Issues
- Ensure the audio file exists at the specified path
- Audio file should be in a format supported by FFmpeg (MP3, WAV, etc.)
- If no audio path is provided, ensure background music files exist in `assets/audio/`

### Memory Issues
- The generator uses memory-optimized settings for constrained environments
- Large images or very long videos may still require more memory
- Consider reducing image sizes or adjusting FFmpeg presets if needed

## Related Documentation

- [REEL.md](./REEL.md) - Single-image reel generator
- [TWO_IMAGE_REEL.md](./TWO_IMAGE_REEL.md) - Two-image reel generator
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview

