# Carousel Generation Guide

Generate beautiful multi-slide Instagram carousels with highlighted text.

## Overview

The carousel feature allows you to create multiple Instagram-ready slides (1080x1350px each) in a single API call. Perfect for creating educational posts, listicles, or step-by-step guides.

## Quick Example

**Input:**
```json
{
  "slides": [
    {
      "title": "Morning <mark>Routine</mark>",
      "list": [
        "<mark>Wake up at 6 AM</mark> consistently",
        "Hydrate with 16oz of water",
        "10 minutes of meditation",
        ... (20 items total)
      ]
    },
    {
      "title": "Evening <mark>Routine</mark>",
      "list": [
        "<mark>No screens after 9 PM</mark>",
        "Read for 30 minutes",
        ... (20 items total)
      ]
    }
  ]
}
```

**Output:**
- `slide_1.jpg` (Morning Routine)
- `slide_2.jpg` (Evening Routine)

## API Usage

### Endpoint

```
POST /generate-carousel
```

### Request Format

```json
{
  "slides": [
    {
      "title": "Slide Title with <mark>Highlighting</mark>",
      "list": [
        "Point 1 with optional <mark>highlight</mark>",
        "Point 2",
        ... (up to 20 items)
      ]
    }
  ]
}
```

### Response Format

```json
{
  "success": true,
  "slideCount": 2,
  "slides": [
    {
      "filename": "slide_1.jpg",
      "base64": "base64-encoded-image-data..."
    },
    {
      "filename": "slide_2.jpg",
      "base64": "base64-encoded-image-data..."
    }
  ]
}
```

## Examples

### Example 1: Two-Slide Carousel

```bash
curl -X POST http://localhost:8000/generate-carousel \
  -H "Content-Type: application/json" \
  -d '{
    "slides": [
      {
        "title": "Productivity <mark>Hacks</mark>",
        "list": [
          "<mark>Time blocking</mark> for deep work",
          "Batch similar tasks together",
          "Use the 2-minute rule",
          ... (17 more items)
        ]
      },
      {
        "title": "Focus <mark>Techniques</mark>",
        "list": [
          "<mark>Pomodoro technique</mark> - 25 min work blocks",
          "Eliminate distractions",
          ... (18 more items)
        ]
      }
    ]
  }'
```

### Example 2: Save Images Locally

```bash
# Generate carousel
RESPONSE=$(curl -X POST http://localhost:8000/generate-carousel \
  -H "Content-Type: application/json" \
  -d @example_carousel_input.json)

# Extract and save each slide
echo $RESPONSE | jq -r '.slides[] | .base64' | \
  base64 -d > output.jpg
```

### Example 3: Using with n8n

**HTTP Request Node Configuration:**
- **URL**: `https://your-server.com/generate-carousel`
- **Method**: `POST`
- **Body Content Type**: `JSON`
- **Body**: Your carousel JSON

**Process Response in Function Node:**
```javascript
// Decode base64 images
const slides = $json.slides.map((slide, index) => ({
  filename: slide.filename,
  data: Buffer.from(slide.base64, 'base64')
}));

return slides.map(slide => ({
  json: { filename: slide.filename },
  binary: { data: slide.data }
}));
```

## Slide Configuration

### Title

- Use `<mark>text</mark>` for highlighting
- Automatically wraps for optimal readability
- Font: Merriweather Bold 64px
- Centered with balanced line breaks

### List Items

- Each slide accepts up to 20 list items
- Use `<mark>text</mark>` for highlighting
- Use `§§§` to split one item into multiple points
- Font: Merriweather Regular 26px
- Numbered automatically (1-20)

### Highlighting

Yellow background (`#F0E231` at 70% opacity) applied to text wrapped in `<mark>` tags:

```json
"<mark>This text</mark> will have a yellow highlight"
```

## Slide Types

### Type 1: Full List (20 items)

Perfect for comprehensive lists:

```json
{
  "title": "Complete <mark>Guide</mark>",
  "list": [
    "Item 1", "Item 2", ... (20 items)
  ]
}
```

### Type 2: Split Items (using §§§)

Perfect for shorter lists with more detail:

```json
{
  "title": "Key <mark>Points</mark>",
  "list": [
    "Point A with detail §§§ Point B with detail",
    "Point C §§§ Point D §§§ Point E",
    ... (splits into 20 total)
  ]
}
```

### Type 3: Mixed

Combine both approaches:

```json
{
  "list": [
    "Single point",
    "Two points §§§ combined",
    "Another single",
    ...
  ]
}
```

## Best Practices

### Content

1. **Keep titles short** - 3-8 words work best
2. **Highlight key terms** - Use `<mark>` sparingly (1-2 per slide)
3. **Consistent length** - Similar list lengths across slides look better
4. **Clear numbering** - Let the automatic numbering do the work

### Visual Design

1. **Background image** - Use the same `background.jpeg` for all slides
2. **Consistent highlighting** - Use similar highlighting patterns
3. **Readable text** - Avoid very long list items (they'll wrap)

### Performance

1. **Slide limit** - No hard limit, but 5-10 slides is optimal for Instagram
2. **Generation time** - ~1-2 seconds per slide
3. **Response size** - Base64 encoding increases size by ~33%

## Customization

### Modify Slide Layout

Edit `generate_carousel.ts`:

```typescript
const WIDTH = 1080;       // Canvas width
const HEIGHT = 1350;      // Canvas height
const TITLE_FONT = "bold 64px Merriweather";
const LIST_FONT = "26px Merriweather";
const PAD_X = 60;         // Horizontal padding
```

### Change Colors

```typescript
// Highlight color
const HIGHLIGHT_COLOR = "#F0E231";  // Yellow

// Text color
ctx.fillStyle = "#222";  // Dark gray

// Author text
ctx.fillStyle = "#666";  // Medium gray
```

### Custom Author Text

```typescript
const author = "by Compounding Wisdom";  // Change this
```

## Command-Line Usage

### Direct Script Call

```bash
deno run --allow-read --allow-write --allow-ffi --allow-sys generate_carousel.ts '{
  "slides": [
    {
      "title": "Test <mark>Slide</mark>",
      "list": ["Item 1", "Item 2", ...]
    }
  ]
}'
```

### Using Example Data

```bash
deno run --allow-read --allow-write --allow-ffi --allow-sys \
  generate_carousel.ts "$(cat example_carousel_input.json)"
```

### Test Script

```bash
./test_carousel.sh
```

## Output Files

Generated files are saved in the project directory:

- `slide_1.jpg` - First slide
- `slide_2.jpg` - Second slide
- `slide_N.jpg` - Nth slide

Each file is:
- **Format**: JPEG
- **Quality**: 95%
- **Size**: ~200-500KB
- **Dimensions**: 1080x1350px

## Troubleshooting

### Slides Look Different

**Issue**: Inconsistent appearance across slides

**Fix**: Use the same list length and highlighting pattern for all slides

### Text Too Long / Overlapping

**Issue**: List items are too long and overlap

**Fix**: Keep list items under ~80 characters or split into multiple items

### Highlights Not Showing

**Issue**: Yellow highlights don't appear in generated images

**Fix**: Ensure you're using the latest version with Docker-compatible rendering

### Out of Memory

**Issue**: Server crashes when generating many slides

**Fix**: 
- Generate fewer slides per request (max 10)
- Increase server memory allocation
- Generate slides in batches

### Base64 Response Too Large

**Issue**: Response is too large for your integration

**Fix**: Consider saving slides to files and returning file URLs instead of base64

## Integration Examples

### n8n Workflow

1. **Trigger** (Webhook or Schedule)
2. **Function Node** - Format carousel JSON
3. **HTTP Request** - Call `/generate-carousel`
4. **Function Node** - Decode base64 images
5. **Action** - Post to Instagram, save files, etc.

### Make.com

Use HTTP module:
- Method: POST
- URL: Your deployment URL + `/generate-carousel`
- Body: JSON with slides array

### Zapier

Use Webhooks by Zapier:
- POST request to your endpoint
- Parse JSON response
- Use base64 decoder if needed

## Advanced Features

### Dynamic Slide Count

Generate as many slides as needed:

```javascript
const slides = data.map(item => ({
  title: `${item.category} <mark>Tips</mark>`,
  list: item.points
}));

const response = await fetch('/generate-carousel', {
  method: 'POST',
  body: JSON.stringify({ slides })
});
```

### Template-Based Generation

Create slide templates and reuse them:

```javascript
const template = {
  title: "Day ${day}: <mark>${topic}</mark>",
  list: generatePoints(topic)
};
```

## Next Steps

1. Test with `example_carousel_input.json`
2. Customize slide layouts in `generate_carousel.ts`
3. Integrate with your automation platform
4. Deploy and start creating carousels!

---

For API server deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).

