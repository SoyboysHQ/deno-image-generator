# Instagram Image Generator

Generate beautiful Instagram images and carousels with highlighted text using Deno.

## Features

- 🎨 **Single Images** - Generate 1080x1350px Instagram-ready images
- 📱 **Carousels** - Create multi-slide carousel posts
- 🎬 **Quote Reels** - Create stunning quote videos with full text highlighting and author attribution
- 🎥 **Two-Image Reels** - Create engaging listicle reels with a title slide + content slide
- 🎞️ **Three-Part Reels** - NEW! Create dynamic reels with image transitions and text overlays
- 🖼️ **Watermark** - Add customizable watermarks to any image
- 🎵 **Background Music** - Add royalty-free music to your reels for maximum engagement
- ✨ **Text Highlighting** - Full-line yellow highlight backgrounds for quotes
- 🎭 **Custom Fonts** - Beautiful Merriweather typography
- 🚀 **HTTP API** - Deploy anywhere and integrate with n8n, Make, etc.
- 🐳 **Docker Ready** - Production-ready containerization with FFmpeg support

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) installed (v1.40 or higher)
- [FFmpeg](https://ffmpeg.org/) installed (for reel generation)
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt-get install ffmpeg`
- Font files: `Merriweather-Regular.ttf`, `Merriweather-Bold.ttf`, `Merriweather-Italic.ttf`
- Background image: `background.jpeg` (1080x1350px recommended)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd deno_deploy

# Download fonts from Google Fonts
# https://fonts.google.com/specimen/Merriweather
# Place the three .ttf files in the project root

# Add your background image as background.jpeg
```

### Running the Server

```bash
# Start the HTTP server
deno run --allow-net --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env server.ts
```

Server will be available at `http://localhost:8000`

## API Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Instagram Generator Server is running",
  "endpoints": { ... },
  "version": "2.0.0"
}
```

### `POST /generate-image`

Generate a single Instagram image.

**Request Body:**
```json
{
  "title": "Real Life <mark>Cheat Codes</mark>",
  "list": [
    "<mark>Wake up early</mark> and establish a morning routine",
    "Practice gratitude daily",
    ... (20 items total)
  ]
}
```

**Response:** JPEG image file

**Example:**
```bash
curl -X POST http://localhost:8000/generate-image \
  -H "Content-Type: application/json" \
  -d @example_input.json \
  --output image.jpg
```

### `POST /generate-carousel`

Generate a multi-slide carousel.

**Request Body:**
```json
{
  "slides": [
    {
      "title": "Slide 1 <mark>Title</mark>",
      "list": ["Point 1", "Point 2", ...]
    },
    {
      "title": "Slide 2 <mark>Title</mark>",
      "list": ["Point 1", "Point 2", ...]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "slideCount": 2,
  "slides": [
    {
      "filename": "slide_1.jpg",
      "base64": "base64-encoded-image-data"
    },
    ...
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/generate-carousel \
  -H "Content-Type: application/json" \
  -d @example_carousel_input.json
```

See [CAROUSEL.md](CAROUSEL.md) for detailed carousel documentation.

### `POST /generate-reel`

Generate an Instagram Reel (vertical video) from a quote or image.

**Request Body (Quote):**
```json
{
  "quote": "You're going to realize it one day- that happiness was never about your job or your degree...",
  "author": "Bianca Sparacino",
  "audioPath": "assets/audio/music.mp3",
  "duration": 5
}
```

**Request Body (Image):**
```json
{
  "imagePath": "assets/images/background.jpeg",
  "audioPath": "assets/audio/music.mp3",
  "duration": 5
}
```

**Fields:**
- `quote` (optional): Quote text. All text will be highlighted with yellow background. If provided, a quote image will be generated
- `author` (optional): Author attribution for the quote (default: "Anonymous")
- `imagePath` (optional): Path to a custom image file (used if no quote provided)
- `audioPath` (optional): Path to background music file (MP3, WAV, AAC, M4A, OGG). **If not provided, a random background music will be auto-selected from available files**
- `duration` (optional): Video duration in seconds (default: 5)

**Note:** Either `quote` or `imagePath` must be provided.

**Response:** MP4 video file (1080x1920, 30fps)

**Example (Quote - Default):**
```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output quote_reel.mp4
```

**Example (Custom Image):**
```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d '{"imagePath": "assets/images/background.jpeg", "duration": 5}' \
  --output reel.mp4
```

**Adding Music:**

To add background music to your reels:

1. Place MP3 files in `assets/audio/` directory with names:
   - `background-music-1.mp3` 
   - `background-music-2.mp3`
2. Music will be **automatically and randomly selected** if no `audioPath` is specified
3. To use a specific song, add `"audioPath": "assets/audio/your-music.mp3"` to your request

```bash
# Example with auto-selected music (just add music files, no code changes needed)
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d '{
    "quote": "Your quote here...",
    "author": "Author Name",
    "duration": 5
  }' \
  --output reel_with_music.mp4
```

**📖 See [ADDING_MUSIC.md](ADDING_MUSIC.md) for a complete guide on adding music to your reels.**

**Note:** If no music files are found in `assets/audio/`, the reel will be generated without audio. The system automatically tries to add background music by randomly selecting between `background-music-1.mp3` and `background-music-2.mp3`. See [assets/audio/README.md](assets/audio/README.md) for information on finding royalty-free music.

### `POST /generate-two-image-reel`

Generate an Instagram Reel with two images: a title slide (0.5s) followed by a list slide (remaining duration).

**Request Body:**
```json
{
  "title": "<mark>20 Real-Life Cheat Codes</mark>",
  "items": [
    "Read 30 minutes daily - <mark>Compound knowledge over time</mark>",
    "Wake up at 5 AM - <mark>Own your morning, own your day</mark>",
    "Exercise 3x per week - <mark>Energy amplifier</mark>"
  ],
  "audioPath": "assets/audio/music.mp3",
  "duration": 15
}
```

**Fields:**
- `title` (required): Title text for the first slide (shows for 0.5 seconds). Supports `<mark>` tags
- `items` (required): Array of list items for the second slide. Each item supports `<mark>` tags
- `audioPath` (optional): Path to background music file. **If not provided, random music will be auto-selected**
- `duration` (optional): Total video duration in seconds. If not provided and audio exists, uses audio duration (default: 5)

**Response:** MP4 video file (1080x1920, 30fps)

**Example:**
```bash
curl -X POST http://localhost:8000/generate-two-image-reel \
  -H "Content-Type: application/json" \
  -d @example_two_image_reel_input.json \
  --output two_image_reel.mp4

# Or use the test script
./test_two_image_reel.sh
```

**📖 See [docs/TWO_IMAGE_REEL.md](docs/TWO_IMAGE_REEL.md) for complete documentation.**

### `POST /generate-watermark`

Add a watermark to any image with customizable positioning and appearance.

**Request Body:**
```json
{
  "targetImage": "data:image/png;base64,YOUR_BASE64_IMAGE_HERE"
}
```

**Fields:**
- `targetImage` (required): Base64-encoded image data (with or without data URL prefix)
- `opacity` (optional): Watermark opacity from 0-1 (default: 1.0 - fully opaque)
- `scale` (optional): Watermark size relative to image width, 0-1 (default: 0.12)
- `padding` (optional): Distance from edges in pixels (default: 10)

**Watermark Image:** `assets/images/watermark.png`

**Response:** JPEG image file with watermark in bottom-right corner

**Example:**
```bash
# Using the helper script to convert image to base64
deno run --allow-read --allow-write scripts/convert_to_base64.ts your_image.png

# Send request with generated JSON
curl -X POST http://localhost:8000/generate-watermark \
  -H "Content-Type: application/json" \
  -d @watermark_input_generated.json \
  -o watermarked_output.jpg

# Or use the test script
./test_server_watermark.sh
```

**📖 See [docs/WATERMARK.md](docs/WATERMARK.md) for complete documentation.**

### `POST /`

Backward compatibility endpoint. Works the same as `/generate-image`.

## Input Format

### Text Highlighting

Use `<mark>` tags to highlight text with a yellow background:

```json
{
  "title": "This is <mark>highlighted</mark> text",
  "list": ["<mark>Important point</mark> with normal text"]
}
```

### Multiple Points Per Line

Use `§§§` to split one list item into multiple points:

```json
{
  "list": [
    "First point §§§ Second point §§§ Third point"
  ]
}
```

This splits into three separate list items.

### List Length

- **Single images**: Expects exactly 20 list items (after splitting by `§§§`)
- **Carousel slides**: Flexible, but each slide follows the same 20-item rule

## Local Development

### Generate Single Image

```bash
deno run --allow-read --allow-write --allow-ffi --allow-sys generate_image.ts '[{
  "title": "Your <mark>Title</mark>",
  "list": ["Point 1", "Point 2", ...]
}]'
```

### Generate Carousel

```bash
deno run --allow-read --allow-write --allow-ffi --allow-sys generate_carousel.ts '{
  "slides": [...]
}'
```

### Test the Server

```bash
# In one terminal
deno run --allow-net --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env src/server.ts

# In another terminal
./test_multi_endpoints.sh
```

### Test Reel Generation

```bash
# Test reel generator with custom image
./test_reel.sh

# Test reel with quote generation
./test_reel_quote.sh

# Test reel generation via server (start server first)
./test_server_reel.sh

# Test two-image reel generation
./test_two_image_reel.sh
```

## Docker Deployment

### Build and Run

```bash
# Build
docker build -t instagram-generator .

# Run
docker run -p 8000:8000 instagram-generator

# Test
curl http://localhost:8000/health
```

### Docker Testing Suite

Test all endpoints in Docker with dedicated test scripts:

```bash
# 1. Build and start container
./docker-test-build.sh

# 2. Test individual endpoints
./docker-test-health.sh      # Health check
./docker-test-image.sh        # Image generation
./docker-test-carousel.sh     # Carousel generation
./docker-test-reel.sh         # Reel generation

# 3. Or test all at once
./docker-test-all.sh

# 4. Cleanup
./docker-test-cleanup.sh
```

See [docs/DOCKER_TESTING.md](docs/DOCKER_TESTING.md) for complete Docker testing guide.

### Deploy to Railway

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

## Customization

Edit `generate_image.ts` to customize:

- `WIDTH` and `HEIGHT` - Canvas dimensions (default: 1080x1350)
- `TITLE_FONT` - Title font size and weight
- `LIST_FONT` - List item font size
- `PAD_X` - Horizontal padding
- Colors - Search for `#F0E231` (highlight), `#222` (text), etc.

## n8n Integration

Use the HTTP Request node in n8n:

**Configuration:**
- **URL**: `http://your-server:8000/generate-image`
- **Method**: `POST`
- **Body Content Type**: `JSON`
- **Body**: Your JSON data with `<mark>` tags
- **Response Format**: `File` (for images) or `JSON` (for carousels)

**Example Function Node:**
```javascript
const formattedData = {
  title: $json.title,
  list: $json.list
};

return { json: formattedData };
```

## Output

Generated files:
- Single image: `real_life_cheat_codes_instagram.jpg` (1080x1350px)
- Carousel: `slide_1.jpg`, `slide_2.jpg`, etc.
- Reel: `instagram_reel.mp4` (1080x1920, MP4/H.264)

All images are JPEG format at 95% quality, optimized for Instagram. Videos are MP4 format with H.264 codec at 30fps.

## Troubleshooting

### "Failed to load image" error
- Ensure `background.jpeg` exists in the project directory
- Verify the image is a valid JPEG file

### Font rendering issues
- Verify all three Merriweather font files are present
- Ensure font files are valid TTF format

### Permission denied errors
- Make sure you're running with all required flags: `--allow-read`, `--allow-write`, `--allow-ffi`, `--allow-sys`, `--allow-env`

### Docker: Highlights not showing
- This has been fixed. If you encounter issues, ensure you're using the latest version of the Dockerfile.

## Project Structure

```
deno_deploy/
├── src/
│   ├── generators/            # Image, carousel, and reel generators
│   ├── handlers/              # API endpoint handlers
│   ├── middleware/            # CORS and other middleware
│   ├── services/              # File and generator services
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Canvas, text, and font utilities
├── assets/
│   ├── images/                # Background images
│   ├── fonts/                 # Merriweather font files
│   └── audio/                 # Background music (optional)
├── docs/                      # Documentation
├── tests/                     # Test scripts and fixtures
├── Dockerfile                 # Docker configuration
├── deno.json                  # Deno configuration
├── example_input.json         # Example single image input
├── example_carousel_input.json # Example carousel input
├── example_reel_input.json    # Example quote reel input
├── example_two_image_reel_input.json # Example two-image reel input
└── README.md                  # This file
```

## License

MIT
