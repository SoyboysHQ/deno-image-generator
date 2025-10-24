# Instagram Image Generator

Generate beautiful Instagram images and carousels with highlighted text using Deno.

## Features

- 🎨 **Single Images** - Generate 1080x1350px Instagram-ready images
- 📱 **Carousels** - Create multi-slide carousel posts
- 🎬 **Instagram Reels** - Create 5-second vertical videos (1080x1920) from images with background music
- ✨ **Text Highlighting** - Yellow highlight background with `<mark>` tags
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

Generate an Instagram Reel (vertical video) from an image.

**Request Body:**
```json
{
  "imagePath": "assets/images/background.jpeg",
  "audioPath": "assets/audio/music.mp3",
  "duration": 5
}
```

**Fields:**
- `imagePath` (required): Path to the image file
- `audioPath` (optional): Path to background music file (MP3, WAV, AAC, M4A, OGG)
- `duration` (optional): Video duration in seconds (default: 5)

**Response:** MP4 video file (1080x1920, 30fps)

**Example:**
```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output reel.mp4
```

**Note:** If no `audioPath` is provided, the reel will be generated without audio. Place audio files in `assets/audio/` directory. See [assets/audio/README.md](assets/audio/README.md) for more information on finding royalty-free music.

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
# Test reel generator directly
./test_reel.sh

# Test reel generation via server (start server first)
./test_server_reel.sh
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
├── generate_image.ts          # Single image generator
├── generate_carousel.ts       # Carousel generator
├── server.ts                  # HTTP API server
├── Dockerfile                 # Docker configuration
├── deno.json                  # Deno configuration
├── example_input.json         # Example single image input
├── example_carousel_input.json # Example carousel input
├── background.jpeg            # Background image
├── Merriweather-*.ttf         # Font files
└── README.md                  # This file
```

## License

MIT
