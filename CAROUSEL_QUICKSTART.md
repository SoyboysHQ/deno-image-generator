# Instagram Carousel Generator - Quick Start

## What You Just Got

A new endpoint that generates Instagram carousel posts like the examples you showed!

## Test It Right Now

```bash
./test_carousel.sh
```

This generates 8 carousel slides based on the example input.

## Call Via API from n8n

### Endpoint
```
POST http://your-server:8000/generate-carousel
```

### Input Format
```json
{
  "outputPrefix": "my_carousel",
  "slides": [
    {
      "type": "title",
      "title": "<mark>5 Non-Negotiable</mark> Sunday Activities",
      "author": "Written by Your Name"
    },
    {
      "type": "intro",
      "body": "A successful week starts on <mark>Sunday night.</mark>"
    },
    {
      "type": "point",
      "number": 1,
      "title": "<mark>Do a self-review</mark>",
      "body": "Have a quick solo meeting with yourself."
    },
    {
      "type": "closing",
      "body": "What did I miss?"
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "slideCount": 8,
  "slides": [
    {
      "filename": "my_carousel_slide_1.jpg",
      "base64": "base64-encoded-image..."
    },
    // ... more slides
  ]
}
```

## Quick Formatting Tips

### Highlights
Use `<mark>text</mark>` to highlight important words:
- Title slides: Yellow highlights
- Other slides: Orange highlights

### Paragraphs
Use `\n\n` to separate paragraphs:
```json
"body": "First paragraph.\n\nSecond paragraph."
```

### Bullets
Use bullet character `•`:
```json
"body": "Review:\n• What went well?\n• What didn't?"
```

## Slide Types

| Type | Purpose | Example |
|------|---------|---------|
| `title` | Opening slide | Main headline + author |
| `intro` | Context setting | Why this matters |
| `point` | Numbered items | 1. Do something |
| `closing` | Final slide | "What did I miss?" |

## File Locations

- **Script**: `generate_carousel.ts`
- **Example Input**: `example_carousel_input.json`
- **Documentation**: `CAROUSEL_GUIDE.md` (comprehensive guide)
- **Test**: `test_carousel.sh`

## From n8n

1. **HTTP Request** node
   - URL: `http://your-server:8000/generate-carousel`
   - Method: POST
   - Body: Your carousel JSON

2. **Response** contains base64-encoded images

3. **Decode and use**:
   - Save to Google Drive
   - Upload to Dropbox
   - Post to Instagram
   - Send via email

## Running the Server

Start the server:
```bash
deno run --allow-net --allow-read --allow-write --allow-run server.ts
```

Now you have three endpoints:
- `/generate-image` - Single Instagram image
- `/generate-carousel` - Multi-slide carousel
- `/process-data` - Example data processing

## Examples Included

Check out `example_carousel_input.json` for a complete working example that matches the images you showed!

---

**Ready to create your own carousel?**
1. Copy `example_carousel_input.json`
2. Edit with your content
3. Test: `./test_carousel.sh`
4. Use via API: `curl -X POST http://localhost:8000/generate-carousel -d @your_input.json`

For detailed documentation, see `CAROUSEL_GUIDE.md`.

