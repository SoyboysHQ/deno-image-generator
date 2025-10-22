# Instagram Image Generator

Generate beautiful Instagram images and carousels with highlighted text using Deno.

## Features

- 🎨 **Single Images** - Generate 1080x1350px Instagram-ready images
- 📱 **Carousels** - Create multi-slide carousel posts
- ✨ **Text Highlighting** - Yellow highlight background with `<mark>` tags
- 🎭 **Custom Fonts** - Beautiful Merriweather typography
- 🚀 **HTTP API** - Deploy anywhere and integrate with n8n, Make, etc.
- 🐳 **Docker Ready** - Production-ready containerization

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) installed (v1.40 or higher)
- Font files in `assets/fonts/`: `Merriweather-Regular.ttf`, `Merriweather-Bold.ttf`, `Merriweather-Italic.ttf`, `Merriweather_120pt-ExtraBold.ttf`
- Background images in `assets/images/`: `background.jpeg`, `bg-1.jpeg`, `bg-2.jpg` (1080x1350px recommended)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd deno_deploy

# Quick setup - download fonts and create sample background
deno task download-assets

# Or manually:
# Download fonts from https://fonts.google.com/specimen/Merriweather
# Place the .ttf files in assets/fonts/
# Add your background images (1080x1350px) in assets/images/

# Verify setup
deno task test-setup
```

### Running the Server

```bash
# Start the HTTP server
deno task server

# Or manually:
# deno run --allow-net --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env src/server.ts
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
  -d @tests/fixtures/example_input.json \
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
  -d @tests/fixtures/example_carousel_input.json
```

See [docs/CAROUSEL.md](docs/CAROUSEL.md) for detailed carousel documentation.

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
# Using deno task
deno task generate "$(cat tests/fixtures/example_input.json)"

# Or directly
deno run --allow-read --allow-write --allow-ffi --allow-sys --allow-env \
  src/generators/image.ts '[{
  "title": "Your <mark>Title</mark>",
  "list": ["Point 1", "Point 2", ...]
}]'
```

### Generate Carousel

```bash
# Using deno task
deno task generate-carousel "$(cat tests/fixtures/example_carousel_input.json)"

# Or directly
deno run --allow-read --allow-write --allow-ffi --allow-sys --allow-env \
  src/generators/carousel.ts '{
  "slides": [...]
}'
```

### Test the Server

```bash
# In one terminal
deno task server

# In another terminal
./tests/scripts/test_multi_endpoints.sh
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

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment instructions.

## Customization

Edit `src/generators/image.ts` or `src/generators/carousel.ts` to customize:

- `WIDTH` and `HEIGHT` - Canvas dimensions (default: 1080x1350)
- Font sizes and styles
- Padding and spacing
- Colors - Search for `#F0E231` (highlight), `#222` (text), etc.

Edit `src/utils/canvas.ts` for drawing functions and highlight styles.

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

All images are JPEG format at 95% quality, optimized for Instagram.

## Troubleshooting

### "Failed to load image" error
- Ensure background images exist in `assets/images/`
- Verify the images are valid JPEG files
- Check paths: `assets/images/background.jpeg`, `assets/images/bg-1.jpeg`, `assets/images/bg-2.jpg`

### Font rendering issues
- Verify all font files are in `assets/fonts/`
- Ensure font files are valid TTF format
- Run `deno task test-setup` to verify all files

### Permission denied errors
- Make sure you're running with all required flags: `--allow-read`, `--allow-write`, `--allow-ffi`, `--allow-sys`, `--allow-env`

### Docker: Highlights not showing
- This has been fixed. If you encounter issues, ensure you're using the latest version of the Dockerfile.

## Project Structure

```
deno_deploy/
├── src/                       # Source code
│   ├── server.ts              # HTTP API server
│   ├── generators/            # Image generation modules
│   │   ├── image.ts           # Single image generator
│   │   └── carousel.ts        # Carousel generator
│   ├── utils/                 # Shared utilities
│   │   ├── text.ts            # Text parsing and wrapping
│   │   ├── canvas.ts          # Canvas drawing helpers
│   │   └── fonts.ts           # Font registration
│   └── types/                 # TypeScript interfaces
│       └── index.ts           # Shared types
├── assets/                    # Static assets
│   ├── fonts/                 # Font files (.ttf)
│   └── images/                # Background images
├── tests/                     # Test files
│   ├── scripts/               # Shell test scripts
│   └── fixtures/              # Test data & examples
├── scripts/                   # Setup/utility scripts
│   ├── test_setup.ts          # Verify setup
│   └── download_test_assets.ts # Download sample assets
├── docs/                      # Documentation
│   ├── CAROUSEL.md            # Carousel guide
│   └── DEPLOYMENT.md          # Deployment instructions
├── output/                    # Generated images
├── Dockerfile                 # Docker configuration
├── deno.json                  # Deno tasks & config
└── README.md                  # This file
```

## License

MIT
