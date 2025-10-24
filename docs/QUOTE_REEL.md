# Quote Reel Generation

Generate Instagram Reels with beautiful quote images and author attribution.

## Overview

The reel generator now supports creating videos from quotes with highlighted text and author attribution, similar to popular quote posts on Instagram. This feature automatically generates a styled quote image and converts it to a video.

## Features

- 📝 **Quote Text** - Display inspirational quotes with proper formatting
- ✨ **Full Text Highlighting** - All quote text is highlighted with yellow backgrounds for maximum impact
- 👤 **Author Attribution** - Credit the quote author with professional styling
- 🎨 **Automatic Layout** - Text is automatically wrapped and centered
- 🎬 **Video Generation** - Quote image is converted to a 5-second reel (1080x1920)
- 🎵 **Optional Audio** - Add background music to your quote reel

## Input Format

### Quote with Full Highlighting

```json
{
  "quote": "You're going to realize it one day- that happiness was never about your job or your degree or being in a relationship.\n\nOne day, you will understand that happiness was always about learning how to live with yourself, that your happiness was never in the hands of others. It was always about you.",
  "author": "Bianca Sparacino",
  "duration": 5
}
```

### Fields

- **quote** (required): The quote text. All text will be highlighted with yellow background. Use `\n` for line breaks between paragraphs.
- **author** (optional): Author name. Will be displayed as "- {author}" at the bottom. Default: "Anonymous"
- **audioPath** (optional): Path to background music file (MP3, WAV, AAC, M4A, OGG)
- **duration** (optional): Video duration in seconds. Default: 5

## API Usage

### Basic Quote Reel

```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d '{
    "quote": "The only way to do great work is to <mark>love what you do</mark>.",
    "author": "Steve Jobs"
  }' \
  --output quote_reel.mp4
```

### Quote Reel with Background Music

```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d '{
    "quote": "Be yourself; everyone else is already taken.",
    "author": "Oscar Wilde",
    "audioPath": "assets/audio/music.mp3",
    "duration": 8
  }' \
  --output quote_reel.mp4
```

## Styling Details

### Quote Image Specifications

- **Dimensions**: 1080x1920 (Instagram Reel format)
- **Background**: Textured background from `assets/images/background.jpeg`
- **Font**: Merriweather (48px for quote, 32px for author)
- **Text Color**: Dark gray (#222)
- **Highlight Color**: Yellow (#F0E231 at 70% opacity)
- **Layout**: Vertically centered with horizontal padding

### Text Formatting

- Quote text wraps automatically to fit width
- Line height is optimized for readability
- Author attribution appears below the quote with a dash prefix
- Multiple paragraphs supported using `\n` in the quote text

## Examples

### Motivational Quote

```json
{
  "quote": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "author": "Winston Churchill"
}
```

### Multi-Paragraph Quote

```json
{
  "quote": "Life is what happens to you while you're busy making other plans.\n\nTime you enjoy wasting is not wasted time.",
  "author": "John Lennon"
}
```

### Simple Quote

```json
{
  "quote": "The best time to plant a tree was 20 years ago. The second best time is now.",
  "author": "Chinese Proverb"
}
```

## Testing

### Test Script

Use the provided test script to verify quote reel generation:

```bash
./test_reel_quote.sh
```

### Manual Testing

1. Start the server:
```bash
deno run --allow-net --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env src/server.ts
```

2. Generate a quote reel:
```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output test_reel.mp4
```

3. Verify the output:
```bash
file test_reel.mp4
ffprobe test_reel.mp4
```

## Technical Details

### Image Generation Process

1. Parse quote text and extract highlighted phrases
2. Create 1080x1920 canvas with background image
3. Calculate text layout with automatic wrapping
4. Draw highlight backgrounds for marked phrases
5. Render quote text and author attribution
6. Export as JPEG (95% quality)

### Video Generation Process

1. Generate quote image (if quote provided)
2. Use FFmpeg to convert image to video:
   - Loop the image for specified duration
   - Scale to 1080x1920 (force aspect ratio)
   - Encode with H.264 codec
   - 30fps frame rate
   - Add audio track if provided
3. Clean up temporary image file
4. Return MP4 video

### Temporary Files

The generator creates a temporary file `quote_image_temp.jpg` during processing. This file is automatically cleaned up after the video is generated.

## Backward Compatibility

The reel generator still supports the original image-based input:

```json
{
  "imagePath": "assets/images/custom_image.jpg",
  "duration": 5
}
```

Either `quote` or `imagePath` must be provided, but not both.

## Troubleshooting

### Quote text is cut off

- Reduce the amount of text in the quote
- The generator automatically wraps text, but very long quotes may not fit
- Consider breaking a long quote into multiple reels

### Text not highlighted

- All quote text should have yellow highlight backgrounds automatically
- Verify the background image exists at `assets/images/background.jpeg`
- Check that fonts are properly loaded from `assets/fonts/`

### Font rendering issues

- Verify Merriweather font files are in `assets/fonts/`
- Check file permissions on font files

### Video generation fails

- Ensure FFmpeg is installed: `ffmpeg -version`
- Check that background image exists: `assets/images/background.jpeg`
- Verify server has `--allow-ffi` permission for canvas rendering

## Best Practices

1. **Keep it Short**: Quotes under 200 characters work best
2. **Strategic Highlights**: Highlight 2-3 key phrases maximum
3. **Clear Attribution**: Always include the author name
4. **Line Breaks**: Use `\n` to control paragraph breaks
5. **Preview First**: Generate and review the reel before posting
6. **Background Music**: Choose music that matches the quote's mood
7. **Duration**: 5-8 seconds works well for quote reels

## Integration Examples

### n8n Workflow

```javascript
// n8n Function Node
const quote = $json.quote;
const author = $json.author;

return {
  json: {
    quote: quote,
    author: author,
    duration: 6
  }
};
```

### Make.com Scenario

Use HTTP Request module with:
- URL: `https://your-server.com/generate-reel`
- Method: POST
- Body: JSON with quote and author fields
- Response parsing: Binary (save as file)

## See Also

- [Reel Documentation](REEL.md) - General reel generation guide
- [Main README](../README.md) - Complete API documentation
- [Audio Assets](../assets/audio/README.md) - Background music guide

