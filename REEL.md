# Instagram Reel Generation

Generate beautiful Instagram Reels (short-form videos) with quotes on background images, optionally with background music.

## Overview

The reel generator creates vertical videos (9:16 aspect ratio, 1080x1920px) optimized for Instagram Reels, TikTok, YouTube Shorts, and other short-form video platforms. Videos feature elegant typography with quotes and attributions overlaid on custom background images.

## Features

- 🎬 **9:16 Vertical Video** - Optimized for Instagram Reels and Stories
- 📱 **MP4 Output** - H.264 codec for maximum compatibility
- 🎵 **Background Music** - Optional audio track support
- 🎨 **Custom Backgrounds** - Use your own background images
- ✨ **Beautiful Typography** - Merriweather fonts with shadows for readability
- ⏱️ **Flexible Duration** - Set video length from 1 to 60 seconds
- 🎭 **Quote Styling** - Elegant quote marks and author attribution

## Input Format

### Basic Example

```json
{
  "quote": "The fool doth think he is wise, but the wise man knows himself to be a fool.",
  "author": "William Shakespeare"
}
```

### Full Example with All Options

```json
{
  "quote": "In the middle of difficulty lies opportunity.",
  "author": "Albert Einstein",
  "duration": 15,
  "backgroundImage": "custom_background.jpeg",
  "musicPath": "background_music.mp3"
}
```

## Input Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `quote` | string | **Yes** | - | The quote text to display |
| `author` | string | No | - | Attribution/author of the quote |
| `duration` | number | No | 10 | Video duration in seconds (1-60) |
| `backgroundImage` | string | No | "background.jpeg" | Path to background image file |
| `musicPath` | string | No | - | Path to audio file (MP3, WAV, etc.) |

## Usage

### Via HTTP API

```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d '{
    "quote": "Be yourself; everyone else is already taken.",
    "author": "Oscar Wilde",
    "duration": 10
  }' \
  --output reel.mp4
```

### Direct Script Execution

```bash
deno run --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env generate_reel.ts '{
  "quote": "Life is what happens when you are busy making other plans.",
  "author": "John Lennon"
}'
```

### Using Deno Task

```bash
# Add your JSON as an argument
deno task generate-reel '{"quote": "Your quote here", "author": "Author Name"}'
```

## Adding Background Music

### Supported Audio Formats

FFmpeg supports most audio formats including:
- MP3 (.mp3)
- WAV (.wav)
- AAC (.aac)
- OGG (.ogg)
- FLAC (.flac)

### With Music Example

```json
{
  "quote": "Music is the universal language of mankind.",
  "author": "Henry Wadsworth Longfellow",
  "duration": 15,
  "musicPath": "calm_piano.mp3"
}
```

**Notes:**
- Music will be automatically mixed with the video
- If the music is longer than the video, it will be trimmed
- If the music is shorter than the video, it will loop (or you can adjust FFmpeg params)
- Audio is encoded to AAC at 192kbps for compatibility

## Customization

### Typography

Edit `generate_reel.ts` to customize fonts:

```typescript
const QUOTE_FONT = 'bold 72px Merriweather';
const QUOTE_LINE_HEIGHT = 100;
const AUTHOR_FONT = 'italic 36px Merriweather';
```

### Colors

Default colors used in the generator:

- **Quote Text**: `#FFFFFF` (white)
- **Author Text**: `#F0E231` (yellow/gold)
- **Quote Marks**: `#F0E231` (yellow/gold)
- **Text Shadow**: `rgba(0, 0, 0, 0.3)` (semi-transparent black)
- **Background Overlay**: `rgba(0, 0, 0, 0.3)` (semi-transparent black)

### Video Settings

Modify FFmpeg parameters in the `generateVideo` function:

```typescript
const ffmpegArgs = [
  '-loop', '1',                    // Loop the static image
  '-i', framePath,                 // Input image
  '-c:v', 'libx264',              // H.264 codec
  '-t', duration.toString(),       // Duration
  '-pix_fmt', 'yuv420p',          // Pixel format
  '-vf', 'scale=1080:1920',       // Scale to 9:16
  '-r', '30',                      // Frame rate (30fps)
  '-y',                            // Overwrite output
];
```

**Common adjustments:**
- Change `-r` for different frame rates (24, 30, 60 fps)
- Add `-b:v` to set video bitrate (e.g., `'-b:v', '5M'` for 5 Mbps)
- Modify `-pix_fmt` for different compatibility needs

### Background Images

Requirements for background images:
- **Recommended size**: 1080x1920px (exact match)
- **Aspect ratio**: 9:16 (vertical)
- **Format**: JPEG or PNG
- **File size**: Keep under 5MB for best performance

Tips:
- Use high-quality, high-contrast images
- Darker backgrounds work better for white text
- The generator adds a semi-transparent overlay to improve text readability

## Technical Details

### Process Flow

1. **Frame Generation**: Creates a PNG image with the quote overlay
2. **FFmpeg Processing**: Converts the static image to video
3. **Audio Mixing** (optional): Adds background music
4. **Output**: Generates MP4 file with H.264 encoding

### Output Specifications

- **Dimensions**: 1080x1920px
- **Aspect Ratio**: 9:16
- **Format**: MP4 (H.264 video + AAC audio)
- **Frame Rate**: 30 fps
- **Audio Bitrate**: 192 kbps (if music added)
- **File Size**: Typically 1-5 MB for a 10-second video

### Dependencies

- **Deno**: Runtime environment
- **@napi-rs/canvas**: Image generation
- **FFmpeg**: Video encoding and audio mixing

## Examples

### Motivational Quote

```json
{
  "quote": "The only way to do great work is to love what you do.",
  "author": "Steve Jobs",
  "duration": 12
}
```

### Philosophical Quote

```json
{
  "quote": "I think, therefore I am.",
  "author": "René Descartes",
  "duration": 8
}
```

### Long Quote with Music

```json
{
  "quote": "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.",
  "author": "Robert Frost",
  "duration": 20,
  "musicPath": "soft_ambient.mp3"
}
```

### Short Wisdom

```json
{
  "quote": "Less is more.",
  "author": "Ludwig Mies van der Rohe",
  "duration": 5
}
```

## Troubleshooting

### FFmpeg not found

**Error**: `Failed to generate video with FFmpeg`

**Solution**:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Verify installation
ffmpeg -version
```

### Background image not loading

**Error**: `Error generating frame: Failed to load image`

**Solution**:
- Ensure the background image file exists
- Check the file path is correct
- Verify the image is a valid JPEG or PNG
- Try using the default `background.jpeg`

### Text not readable

**Issue**: Quote text is hard to read on the background

**Solutions**:
- Use a darker background image
- Increase the overlay opacity in `generate_reel.ts`:
  ```typescript
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Increase from 0.3 to 0.5
  ```
- Adjust text shadow settings

### Music not syncing

**Issue**: Audio doesn't match video duration

**Solution**:
- Ensure music file is accessible
- Check FFmpeg supports the audio format
- The `-shortest` flag ensures video ends when the shortest stream (video or audio) ends

### Quote too long

**Issue**: Long quotes get cut off or wrap poorly

**Solutions**:
- Shorten the quote text
- Increase video dimensions (not recommended for Instagram)
- Reduce font size in `generate_reel.ts`
- Break the quote into multiple reels

## Best Practices

### Quote Selection

- **Length**: Keep quotes under 300 characters for best readability
- **Impact**: Choose meaningful, shareable quotes
- **Attribution**: Always include the author when known

### Visual Design

- **Contrast**: Ensure good contrast between text and background
- **Simplicity**: Avoid cluttered background images
- **Branding**: Use consistent backgrounds for a cohesive feed

### Duration

- **Short quotes** (< 10 words): 5-8 seconds
- **Medium quotes** (10-20 words): 8-12 seconds
- **Long quotes** (> 20 words): 12-20 seconds
- Instagram Reels can be up to 90 seconds, but shorter is often better for engagement

### Music Selection

- Use royalty-free music to avoid copyright issues
- Match music mood to quote tone
- Keep volume balanced so text remains the focus

## Integration Examples

### n8n Workflow

Use the HTTP Request node:

```javascript
// Function node to prepare data
const quoteData = {
  quote: $json.quote_text,
  author: $json.author_name,
  duration: 10
};

return { json: quoteData };
```

HTTP Request node settings:
- **Method**: POST
- **URL**: `http://your-server:8000/generate-reel`
- **Response Format**: File
- **Output**: Binary data (video/mp4)

### Make (Integromat)

1. Add HTTP module
2. Set method to POST
3. Set URL to your endpoint
4. Add JSON body with quote data
5. Parse binary response

### Zapier

1. Use Webhooks by Zapier
2. Choose POST method
3. Configure JSON payload
4. Handle file download in next step

## Performance

Typical generation times:
- **10-second video**: 2-5 seconds
- **30-second video**: 5-10 seconds
- **With music**: Add 1-2 seconds

Factors affecting performance:
- Background image size and format
- Video duration
- Music file size
- Server CPU performance

## License

MIT License - Feel free to use and modify for your projects.

