# Instagram Carousel Generator

This script generates multi-slide Instagram carousel posts from JSON input, perfect for educational content, listicles, and storytelling posts.

## What It Does

Creates a series of 1080x1350 Instagram-optimized images with:
- **Title slides** - Eye-catching covers with large text and highlights
- **Intro slides** - Context-setting introductory content
- **Point slides** - Numbered items with detailed explanations
- **Closing slides** - Call-to-action or concluding thoughts

## Quick Start

### Test Locally

```bash
./test_carousel.sh
```

This will generate a complete 8-slide carousel based on `example_carousel_input.json`.

### Via API

```bash
curl -X POST http://localhost:8000/generate-carousel \
  -H "Content-Type: application/json" \
  -d @example_carousel_input.json
```

Returns JSON with base64-encoded images for each slide.

## Input Format

```json
{
  "outputPrefix": "my_carousel",
  "slides": [
    {
      "type": "title",
      "title": "Your <mark>Highlighted</mark> Title",
      "author": "by Your Name"
    },
    {
      "type": "intro",
      "body": "Introduction paragraph.\n\nSecond paragraph with <mark>highlights</mark>."
    },
    {
      "type": "point",
      "number": 1,
      "title": "<mark>First Point</mark>",
      "body": "Explanation text.\n\nWith multiple paragraphs."
    },
    {
      "type": "closing",
      "body": "What did I miss?"
    }
  ]
}
```

## Slide Types

### 1. Title Slide (`"type": "title"`)

The opening slide with your main headline.

**Fields:**
- `title` (required) - Main title text, supports `<mark>` tags for yellow highlights
- `author` (optional) - Attribution text, appears in italics at bottom

**Example:**
```json
{
  "type": "title",
  "title": "<mark>5 Non-Negotiable Sunday Activities</mark> to Win The Week",
  "author": "Written by Your Name"
}
```

### 2. Intro Slide (`"type": "intro"`)

Context-setting slide with body text.

**Fields:**
- `body` (required) - Body text with optional `<mark>` highlights
- Use `\n\n` for paragraph breaks

**Example:**
```json
{
  "type": "intro",
  "body": "A successful week starts on <mark>Sunday night.</mark>\n\nWait until Monday to get organized, and you'll spend the week playing catch-up.\n\nHere are <mark>5 things</mark> to do every Sunday:"
}
```

### 3. Point Slide (`"type": "point"`)

Numbered content slides with title and explanation.

**Fields:**
- `number` (required) - Number for the point (1, 2, 3, etc.)
- `title` (required) - Point title, supports `<mark>` tags for orange highlights
- `body` (required) - Detailed explanation

**Example:**
```json
{
  "type": "point",
  "number": 1,
  "title": "<mark>Do a self-review</mark>",
  "body": "Have a quick solo meeting with yourself.\n\nTake 10 minutes to review:\n• What went well?\n• What didn't?\n• What's one thing to improve?"
}
```

### 4. Closing Slide (`"type": "closing"`)

Simple centered text for calls-to-action or questions.

**Fields:**
- `body` OR `title` - Text to display (centered)

**Example:**
```json
{
  "type": "closing",
  "body": "What did I miss?"
}
```

## Text Formatting

### Highlights

Use `<mark>text</mark>` to highlight text:
- **Title slides**: Yellow highlights (`rgba(240, 226, 49, 0.85)`)
- **Other slides**: Orange highlights (`rgba(255, 165, 0, 0.75)`)

```json
"title": "Real Life <mark>Cheat Codes</mark> You Can Use"
```

### Paragraphs

Use `\n\n` for paragraph breaks:

```json
"body": "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
```

### Bullet Points

Use Unicode bullet character:

```json
"body": "Take 10 minutes to review:\n• What went well?\n• What didn't?\n• What's one thing to improve?"
```

## Design Specifications

- **Dimensions**: 1080 x 1350 pixels (4:5 Instagram portrait)
- **Background**: Beige textured background
- **Font**: Merriweather (Regular, Bold, Italic)
- **Colors**:
  - Text: `#222` (dark gray)
  - Title highlights: Yellow `rgba(240, 226, 49, 0.85)`
  - Point highlights: Orange `rgba(255, 165, 0, 0.75)`
- **Format**: JPEG, 95% quality

## Common Patterns

### 5-Point Listicle

```json
{
  "slides": [
    {"type": "title", "title": "...", "author": "..."},
    {"type": "intro", "body": "..."},
    {"type": "point", "number": 1, "title": "...", "body": "..."},
    {"type": "point", "number": 2, "title": "...", "body": "..."},
    {"type": "point", "number": 3, "title": "...", "body": "..."},
    {"type": "point", "number": 4, "title": "...", "body": "..."},
    {"type": "point", "number": 5, "title": "...", "body": "..."},
    {"type": "closing", "body": "What did I miss?"}
  ]
}
```

### Story Format

```json
{
  "slides": [
    {"type": "title", "title": "My Story", "author": "by Me"},
    {"type": "intro", "body": "It started when..."},
    {"type": "intro", "body": "Then something happened..."},
    {"type": "intro", "body": "And finally..."},
    {"type": "closing", "body": "The End"}
  ]
}
```

### Tips & Tricks

```json
{
  "slides": [
    {"type": "title", "title": "10 Tips for Success"},
    {"type": "point", "number": 1, "title": "Tip One", "body": "..."},
    {"type": "point", "number": 2, "title": "Tip Two", "body": "..."},
    // ... more tips
    {"type": "closing", "body": "Which tip will you try first?"}
  ]
}
```

## Using from n8n

### 1. HTTP Request Node

- **Method**: POST
- **URL**: `http://your-server:8000/generate-carousel`
- **Body Content Type**: JSON
- **JSON Body**: Your carousel data structure

### 2. Process Response

The API returns:
```json
{
  "success": true,
  "slideCount": 8,
  "slides": [
    {
      "filename": "carousel_slide_1.jpg",
      "base64": "base64-encoded-image-data"
    },
    // ... more slides
  ]
}
```

### 3. Decode and Save

Use n8n's "Move Binary Data" node to convert base64 to binary files, then:
- Save to Google Drive
- Upload to Dropbox
- Send via email
- Post directly to Instagram API

## Tips for Great Carousels

### Content

1. **Hook on slide 1** - Make the title irresistible
2. **Set context on slide 2** - Why should they care?
3. **Deliver value** - Each point slide should teach something
4. **End with engagement** - Ask a question on the closing slide

### Text

- **Keep it concise** - 3-4 lines per point is ideal
- **Use highlights sparingly** - Only on the most important 2-3 words
- **Break into paragraphs** - Makes content easier to scan
- **Numbered lists work** - They promise specific value

### Design

- **Consistent formatting** - Use the same structure for all points
- **Visual hierarchy** - Titles > subtitles > body text
- **White space matters** - Don't overcrowd slides
- **Test on mobile** - Instagram is mobile-first

## Output Files

Files are named: `{outputPrefix}_slide_{number}.jpg`

Example with `"outputPrefix": "sunday_tips"`:
- `sunday_tips_slide_1.jpg`
- `sunday_tips_slide_2.jpg`
- `sunday_tips_slide_3.jpg`
- etc.

## Troubleshooting

### "Error: No input JSON provided"

Make sure you're passing the JSON as a command-line argument:
```bash
deno run ... generate_carousel.ts "$(cat input.json)"
```

### Highlights not showing

Check that you're using proper `<mark>` tags:
```json
"title": "<mark>correct</mark>"  ✅
"title": "**wrong**"              ❌
```

### Text too long / overflowing

- Reduce text length
- Break into multiple slides
- Use shorter sentences
- Remove unnecessary words

### Images look different than example

- Verify `background.jpeg` is present
- Check font files are loaded (Merriweather-*.ttf)
- Ensure proper JSON formatting

## Examples

See `example_carousel_input.json` for a complete working example.

## API Endpoint Summary

**Endpoint**: `POST /generate-carousel`

**Request**:
```json
{
  "outputPrefix": "my_carousel",
  "slides": [...]
}
```

**Response**:
```json
{
  "success": true,
  "slideCount": 8,
  "slides": [
    {"filename": "...", "base64": "..."},
    ...
  ]
}
```

**Errors**:
```json
{
  "error": "Invalid input format...",
  "details": "..."
}
```

## Next Steps

1. Test with the example: `./test_carousel.sh`
2. Modify `example_carousel_input.json` with your content
3. Integrate with n8n for automated generation
4. Upload to Instagram!

---

**Pro Tip**: Create templates for different content types (tips, stories, processes) and reuse them with different content to maintain consistency across your Instagram feed.

