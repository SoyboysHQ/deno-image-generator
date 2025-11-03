# Text Reel Generator

The Text Reel generator creates Instagram reel videos featuring handwritten-style text overlaid on a background image, synchronized with background music.

## Features

- Uses the **Handwritten soyboys i** font for an authentic handwritten look
- Displays text on the `background.jpeg` image
- Includes a signature ("compounding.wisdom") at the bottom of the reel
- Automatically uses the audio duration if no duration is specified
- Auto-selects random background music if none is provided
- Supports text highlighting using `<mark>` tags
- Supports paragraph breaks with `\n\n` and line breaks with `\n`
- Centers text both horizontally and vertically

## Endpoint

**POST** `/generate-text-reel`

## Input Format

```json
{
  "text": "Your text here",
  "audioPath": "optional/path/to/audio.mp3",
  "duration": 8,
  "outputPath": "optional_output.mp4"
}
```

### Input Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | ✅ Yes | The text to display. Supports `<mark>...</mark>` for highlights |
| `audioPath` | string | ❌ Optional | Path to audio file. If not provided, random music is selected |
| `duration` | number | ❌ Optional | Duration in seconds. If not provided, uses audio duration |
| `outputPath` | string | ❌ Optional | Custom output path for the generated video |

## Example Input

```json
{
  "text": "Life is what happens when you're busy making other plans.\n\nEmbrace the unexpected and find joy in the journey.",
  "duration": 8
}
```

### With Highlights

```json
{
  "text": "<mark>Dream big</mark>, work hard, and make it happen.\n\nSuccess is not final, failure is not fatal.",
  "duration": 10
}
```

## Output

The endpoint returns an MP4 video file (1080x1920 pixels, 9:16 aspect ratio) suitable for Instagram Reels.

## Text Formatting

### Highlights
Use `<mark>` tags to highlight specific portions of text with a yellow background:
```
"This is <mark>highlighted text</mark> in the reel."
```

### Line Breaks
- Single newline `\n` - Creates a new line within the same paragraph
- Double newline `\n\n` - Creates a new paragraph with extra spacing

### Text Styling
- Font: Handwritten soyboys i (72px)
- Line Height: 100px
- Paragraph Spacing: 120px extra
- Text Color: Pen blue (#212b73)
- Highlight Color: Yellow (#F0E231)
- Character Spacing: Variable (1-3px) for natural handwritten appearance

## Usage Examples

### Using the Generator Directly

```bash
deno run \
  --allow-read \
  --allow-write \
  --allow-run \
  --allow-ffi \
  --allow-sys \
  --allow-env \
  src/generators/textReel.ts \
  '{"text":"Your text here","duration":8}'
```

### Using the Test Script

```bash
./test_text_reel.sh
```

This will use the input from `example_text_reel_input.json`.

### Testing the Server Endpoint

Start the server:
```bash
deno run --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env --allow-net src/server.ts
```

Then in another terminal:
```bash
./test_server_text_reel.sh
```

Or use curl directly:
```bash
curl -X POST http://localhost:8000/generate-text-reel \
  -H "Content-Type: application/json" \
  -d '{"text":"Life is beautiful","duration":8}' \
  --output text_reel.mp4
```

## Technical Details

### Video Specifications
- Resolution: 1080x1920 (9:16 aspect ratio)
- Frame Rate: 30 fps
- Video Codec: H.264 (libx264)
- Preset: faster (optimized for lower memory usage)
- CRF: 23 (good quality)
- Audio Codec: AAC at 128k bitrate

### Text Layout
- Padding X: 100px from sides
- Padding Y: 150px from top/bottom
- Text is centered horizontally
- Content is vertically centered on canvas
- Automatic text wrapping based on canvas width
- Signature (400px wide) is centered horizontally and placed 100px from bottom

### Audio Handling
- If no audio is provided, randomly selects from `assets/audio/` directory
- If audio is provided but no duration, uses the audio file's duration
- If neither audio nor duration provided, defaults to 5 seconds

## Notes

- The handwritten font gives a personal, authentic feel to the content
- Text is automatically wrapped to fit the canvas width
- The background.jpeg image provides a consistent, appealing backdrop
- Temporary image files are automatically cleaned up after video generation

