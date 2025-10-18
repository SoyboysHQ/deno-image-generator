# ✨ New Feature: Instagram Carousel Generator

## What Was Created

You now have a complete Instagram carousel post generator that creates multi-slide posts like the examples you showed!

## 📁 New Files

### Core Files
1. **`generate_carousel.ts`** - Main carousel generation script
   - Generates 1080x1350 Instagram-optimized images
   - Supports 4 slide types: title, intro, point, closing
   - Handles text wrapping, highlights, and formatting

2. **`example_carousel_input.json`** - Working example
   - Complete 8-slide carousel matching your images
   - Shows all slide types and formatting options

### Server Integration
3. **`server.ts`** - Unified server with multiple endpoints
   - Added `/generate-carousel` endpoint
   - Returns base64-encoded images for all slides
   - Fully integrated with existing endpoints

### Documentation
4. **`CAROUSEL_GUIDE.md`** - Comprehensive guide
   - All slide types explained
   - Input format documentation
   - Design specifications
   - n8n integration examples
   - Tips for creating great carousels

5. **`CAROUSEL_QUICKSTART.md`** - Quick reference
   - TL;DR version
   - Fastest way to get started
   - Essential formatting tips

### Testing
6. **`test_carousel.sh`** - Test script
   - Generates example carousel locally
   - Verifies everything works

## 🚀 How to Use

### Test Locally (Do This First!)

```bash
./test_carousel.sh
```

This will generate 8 slides matching your example images.

### Via API

```bash
# Start server
deno run --allow-net --allow-read --allow-write --allow-run server.ts

# Generate carousel
curl -X POST http://localhost:8000/generate-carousel \
  -H "Content-Type: application/json" \
  -d @example_carousel_input.json
```

### From n8n

**HTTP Request Node:**
- **URL**: `http://your-server:8000/generate-carousel`
- **Method**: `POST`
- **Body**: Your carousel JSON data

**Response:**
```json
{
  "success": true,
  "slideCount": 8,
  "slides": [
    {"filename": "slide_1.jpg", "base64": "..."},
    {"filename": "slide_2.jpg", "base64": "..."},
    ...
  ]
}
```

## 📸 Output

The script generates:
- **Format**: JPEG images
- **Size**: 1080 x 1350 pixels (Instagram portrait)
- **Quality**: 95% JPEG compression
- **Background**: Same beige texture as your single image generator
- **Font**: Merriweather (consistent with existing images)

## 🎨 Slide Types You Can Create

### 1. Title Slide
Large bold text with yellow highlights for your opening hook.

```json
{
  "type": "title",
  "title": "<mark>5 Non-Negotiable</mark> Sunday Activities",
  "author": "Written by Colby Kultgen"
}
```

### 2. Intro Slide
Context-setting paragraphs with optional orange highlights.

```json
{
  "type": "intro",
  "body": "A successful week starts on <mark>Sunday night.</mark>\n\nHere are <mark>5 things</mark> to do:"
}
```

### 3. Point Slide
Numbered content with title and detailed explanation.

```json
{
  "type": "point",
  "number": 1,
  "title": "<mark>Do a self-review</mark>",
  "body": "Have a quick solo meeting with yourself.\n\nTake 10 minutes to review:\n• What went well?\n• What didn't?"
}
```

### 4. Closing Slide
Simple centered text for calls-to-action.

```json
{
  "type": "closing",
  "body": "What did I miss?"
}
```

## ✨ Key Features

- ✅ **Text Highlights**: Use `<mark>text</mark>` for colored highlights
- ✅ **Multiple Paragraphs**: Use `\n\n` for spacing
- ✅ **Bullet Points**: Use `•` character
- ✅ **Automatic Text Wrapping**: Never overflows
- ✅ **Consistent Design**: Matches your brand style
- ✅ **Any Number of Slides**: Not limited to 8

## 🔗 All Available Endpoints

Your server now has:

```
GET  /health              - Health check
POST /generate-image      - Single Instagram image (original)
POST /generate-carousel   - Multi-slide carousel (NEW!)
POST /process-data        - Data processing example
```

## 💡 Example Use Cases

1. **Educational Content**: "5 Tips for X"
2. **Storytelling**: Multi-slide narratives
3. **Listicles**: "10 Things to Know About X"
4. **How-To Guides**: Step-by-step instructions
5. **Motivational Posts**: Weekly challenges, routines
6. **Case Studies**: Problem → Solution → Results

## 🎯 Quick Workflow

1. **Create your content** in JSON format
2. **Test locally**: `./test_carousel.sh` (edit example_carousel_input.json first)
3. **Deploy your server** (Railway/Fly.io)
4. **Integrate with n8n**
5. **Automate**: Generate carousels from databases, Notion, etc.

## 📊 Comparison with Single Image Generator

| Feature | Single Image | Carousel |
|---------|-------------|----------|
| Endpoint | `/generate-image` | `/generate-carousel` |
| Output | 1 image | Multiple images |
| Format | Fixed 20-item list | Flexible slide types |
| Use Case | List posts | Stories, guides, series |
| Input | `title` + `list` | Array of `slides` |

## 🚀 Next Steps

1. **Test the example**:
   ```bash
   ./test_carousel.sh
   ```

2. **Review the output**:
   ```bash
   ls -lh sunday_activities_slide_*.jpg
   ```

3. **Customize the content**:
   - Edit `example_carousel_input.json`
   - Add your own slides
   - Test again

4. **Integrate with n8n**:
   - Use HTTP Request node
   - Point to `/generate-carousel`
   - Process the base64 images

5. **Read full docs**:
   - `CAROUSEL_GUIDE.md` - Complete documentation
   - `CAROUSEL_QUICKSTART.md` - Quick reference

## 🎨 Design Matches Your Examples

The generated slides will look exactly like the images you shared:
- ✅ Same beige background texture
- ✅ Yellow highlights on title slides
- ✅ Orange highlights on content slides
- ✅ Merriweather font throughout
- ✅ Professional spacing and layout
- ✅ 1080x1350 Instagram portrait format

## 💻 Technical Details

- **Language**: TypeScript (Deno)
- **Canvas Library**: @napi-rs/canvas
- **Text Rendering**: Automatic wrapping and centering
- **Highlight System**: HTML-like `<mark>` tags
- **Error Handling**: Comprehensive validation
- **API Response**: JSON with base64-encoded images

## 🎉 You're All Set!

Run `./test_carousel.sh` to see it in action!

Your carousel generator is fully integrated, documented, and ready to use via API from n8n or any other tool.

