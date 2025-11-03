# Three-Part Reel Generator

The Three-Part Reel Generator creates dynamic Instagram reels with three distinct sections:
- **Part 1**: First image with animated text overlays in center (2 seconds total)
  - 0.5s: text1 appears alone
  - 1.5s: text2 appears below text1
- **Part 2**: Smooth fade transition where text1 & text2 fade out with the image (1.5 seconds, 0.5s fade)
- **Part 3**: Second image with text3 fading in at bottom (2 seconds, 0.4s fade)

Total duration: **5.5 seconds**

## Features

- ✨ Downloads images from URLs (Cloudinary, etc.)
- 📝 Animated text overlays with sequential reveals and fade-ins
- 🎨 Smooth fade transitions between images and text
- 💧 Automatic watermark added to all frames
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
  "text1": "First text for first frame",
  "text2": "Second text for first frame",
  "text3": "Text for last frame",
  "audioPath": "assets/audio/background-music-7.mp3",  // Optional
  "watermark": {  // Optional - customize watermark
    "opacity": 1.0,
    "scale": 0.15,
    "padding": 20,
    "horizontalOffset": 0,
    "verticalOffset": 0
  }
}
```

**Required Fields:**
- `image1Url` (string): URL to the first image
- `image2Url` (string): URL to the second image
- `text1` (string): First text overlay for the first frame (centered)
- `text2` (string): Second text overlay for the first frame (centered, below text1)
- `text3` (string): Text overlay for the third frame (bottom positioned)

**Optional Fields:**
- `audioPath` (string): Path to background music file. If not provided, a random background music will be selected automatically.
- `watermark` (object): Watermark configuration options
  - `opacity` (number): Watermark opacity, 0-1 (default: 1.0)
  - `scale` (number): Watermark size relative to image width, 0-1 (default: 0.15)
  - `padding` (number): Padding from edges in pixels (default: 20)
  - `horizontalOffset` (number): Additional horizontal offset - positive moves right, negative moves left (default: 0)
  - `verticalOffset` (number): Additional vertical offset - positive moves down, negative moves up (default: 0)

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
    "text2": "Every moment is an opportunity",
    "text3": "And ends with a thousand memories",
    "audioPath": "assets/audio/background-music-7.mp3",
    "watermark": {
      "scale": 0.12,
      "padding": 30,
      "verticalOffset": -50
    }
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
  "text1": "First text for first frame",
  "text2": "Second text for first frame",
  "text3": "Text for last frame"
}'
```

## Text Overlay Styling

### First Frame (text1 and text2)
The text overlays are styled as follows:
- **Font**: Bold Merriweather, 56px
- **Color**: Black (#000000)
- **Background**: White boxes (#FFFFFF)
- **Alignment**: Center-aligned, vertically centered
- **Line Height**: 90px
- **Spacing**: 120px between text1 and text2 groups
- **Animation**: text1 appears first (0.5s), then text2 appears below it (1.5s)
- **Auto-wrapping**: Text automatically wraps to fit the width with padding

### Last Frame (text3)
The text overlay is styled as follows:
- **Font**: Bold Merriweather, 30px (smaller for bottom position)
- **Color**: Black (#000000)
- **Background**: Single rounded white box (#FFFFFF)
- **Border Radius**: 35px
- **Alignment**: Center-aligned, positioned near bottom
- **Bottom Margin**: 300px from screen bottom
- **Line Height**: 40px
- **Animation**: Fades in smoothly over 0.4 seconds
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
4. Watermark is automatically added to each frame (bottom-right corner by default, customizable)
5. All processing is done server-side using canvas and FFmpeg

### Watermark Customization
The watermark position and appearance can be customized using the `watermark` parameter:
- **Position**: Defaults to bottom-right corner, adjust with `horizontalOffset` and `verticalOffset`
- **Size**: Control with `scale` parameter (percentage of image width)
- **Opacity**: Set transparency level (0 = invisible, 1 = fully opaque)
- **Padding**: Distance from edges in pixels

Example: To move watermark higher and more to the left:
```json
"watermark": {
  "horizontalOffset": -20,
  "verticalOffset": -50
}
```

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
  "text1": "Now is all there ever is.",
  "text2": "Silence speaks louder than thought.",
  "text3": "Be present in the moment.",
  "audioPath": "assets/audio/background-music-7.mp3",
  "watermark": {
    "scale": 0.15,
    "padding": 20,
    "horizontalOffset": 0,
    "verticalOffset": -100
  }
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

