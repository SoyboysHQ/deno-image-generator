# Instagram Content Generator

Generate beautiful Instagram images, carousels, and video reels using Deno.

## Features

- 🎨 **Single Images** - Generate 1080x1350px Instagram-ready images
- 📱 **Carousels** - Create multi-slide carousel posts
- 🎬 **Video Reels** - Generate quote videos with background music (9:16 format)
- ✨ **Text Highlighting** - Yellow highlight background with `<mark>` tags
- 🎭 **Custom Fonts** - Beautiful Merriweather typography
- 🎵 **Background Music** - Add audio to video reels
- 🚀 **HTTP API** - Deploy anywhere and integrate with n8n, Make, etc.
- 🐳 **Docker Ready** - Production-ready containerization

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) installed (v1.40 or higher)
- [FFmpeg](https://ffmpeg.org/) (required for video reel generation)
- Font files: `Merriweather-Regular.ttf`, `Merriweather-Bold.ttf`, `Merriweather-Italic.ttf`
- Background image: `background.jpeg` (1080x1350px for images, 1080x1920px for reels)

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

Generate an Instagram Reel (video) with a quote on a background image.

**Request Body:**
```json
{
  "quote": "The fool doth think he is wise, but the wise man knows himself to be a fool.",
  "author": "William Shakespeare",
  "duration": 10,
  "backgroundImage": "background.jpeg",
  "musicPath": "path/to/music.mp3"
}
```

**Fields:**
- `quote` (required): The quote text to display
- `author` (optional): Attribution for the quote
- `duration` (optional): Video duration in seconds (default: 10)
- `backgroundImage` (optional): Path to background image (default: "background.jpeg")
- `musicPath` (optional): Path to background music file

**Response:** MP4 video file (1080x1920px, 9:16 aspect ratio)

**Example:**
```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output reel.mp4
```

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

### Generate Reel

```bash
deno run --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env generate_reel.ts '{
  "quote": "Your quote here",
  "author": "Author Name"
}'
```

### Test the Server

```bash
# In one terminal
deno run --allow-net --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env server.ts

# In another terminal
./test_multi_endpoints.sh
./test_server_reel.sh  # Test reel generation
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

### Deploy to Railway

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

## Customization

### Images and Carousels

Edit `generate_image.ts` or `generate_carousel.ts` to customize:

- `WIDTH` and `HEIGHT` - Canvas dimensions (default: 1080x1350)
- `TITLE_FONT` - Title font size and weight
- `LIST_FONT` - List item font size
- `PAD_X` - Horizontal padding
- Colors - Search for `#F0E231` (highlight), `#222` (text), etc.

### Video Reels

Edit `generate_reel.ts` to customize:

- `WIDTH` and `HEIGHT` - Video dimensions (default: 1080x1920 for 9:16)
- `QUOTE_FONT` - Quote font size and weight (default: bold 72px)
- `AUTHOR_FONT` - Author font size and style (default: italic 36px)
- Colors - Adjust text and highlight colors
- Video quality - Modify FFmpeg parameters in the `generateVideo` function

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
- Video reel: `instagram_reel.mp4` (1080x1920px, 9:16 aspect ratio)

All images are JPEG format at 95% quality, and videos are MP4 format with H.264 encoding, optimized for Instagram.

## Troubleshooting

### "Failed to load image" error
- Ensure `background.jpeg` exists in the project directory
- Verify the image is a valid JPEG file

### Font rendering issues
- Verify all three Merriweather font files are present
- Ensure font files are valid TTF format

### Permission denied errors
- Make sure you're running with all required flags: `--allow-read`, `--allow-write`, `--allow-ffi`, `--allow-sys`, `--allow-env`
- For video generation, also add `--allow-run` (needed for FFmpeg)

### FFmpeg not found error
- Install FFmpeg: `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Linux)
- Verify installation: `ffmpeg -version`

### Docker: Highlights not showing
- This has been fixed. If you encounter issues, ensure you're using the latest version of the Dockerfile.

## Project Structure

```
deno_deploy/
├── generate_image.ts          # Single image generator
├── generate_carousel.ts       # Carousel generator
├── generate_reel.ts           # Video reel generator
├── server.ts                  # HTTP API server
├── Dockerfile                 # Docker configuration
├── deno.json                  # Deno configuration
├── example_input.json         # Example single image input
├── example_carousel_input.json # Example carousel input
├── example_reel_input.json    # Example reel input
├── test_server_reel.sh        # Test script for reels
├── background.jpeg            # Background image
├── Merriweather-*.ttf         # Font files
└── README.md                  # This file
```

## License

MIT
