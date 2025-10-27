# Two-Image Reel Generator

## Overview

The two-image reel generator creates Instagram Reels (9:16 vertical videos) that consist of two different images:

1. **Title Slide** (0.5 seconds): A bold, eye-catching title page similar to carousel title slides
2. **List Slide** (remaining duration): A detailed list of items similar to the single image generator

This is perfect for creating engaging "listicle" style content where you want to grab attention with a title first, then show the full content.

## Endpoint

```
POST /generate-two-image-reel
```

## Input Format

```json
{
  "title": "string (required)",
  "items": ["array of strings (required)"],
  "audioPath": "string (optional)",
  "duration": "number (optional)"
}
```

### Parameters

- **`title`** (required): The title text for the first slide. Supports `<mark>...</mark>` tags for highlighting
- **`items`** (required): Array of list items for the second slide. Each item supports `<mark>...</mark>` tags for highlighting
- **`audioPath`** (optional): Path to custom audio file. If not provided, a random background music file will be selected from `assets/audio/`
- **`duration`** (optional): Total video duration in seconds. If not provided and audio is used, it will match the audio duration. Default: 5 seconds

### Highlight Syntax

Use `<mark>...</mark>` tags to highlight text with a yellow background:

```json
{
  "title": "<mark>20 Real-Life Cheat Codes</mark>",
  "items": [
    "Read 30 minutes daily - <mark>Compound knowledge over time</mark>",
    "Wake up at 5 AM - <mark>Own your morning, own your day</mark>"
  ]
}
```

## Output

The endpoint returns an MP4 video file (1080x1920px, 9:16 aspect ratio) that can be directly uploaded to Instagram Reels.

### Video Structure

- **First 0.5 seconds**: Title slide with large, bold text and yellow highlights
  - Uses `bg-1.jpeg` background
  - Title centered vertically
  - "Written by Compounding Wisdom" attribution at bottom
  
- **Remaining duration**: List slide with all items
  - Uses `background.jpeg` background
  - Title at top with author line
  - Numbered list items with highlights
  - Auto-adjusts spacing to fit content

## Example Usage

### Using the Test Script

```bash
./test_two_image_reel.sh
```

### Using curl

```bash
curl -X POST http://localhost:8000/generate-two-image-reel \
  -H "Content-Type: application/json" \
  -d @example_two_image_reel_input.json \
  --output my_reel.mp4
```

### Using JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:8000/generate-two-image-reel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: '<mark>10 Life Lessons</mark>',
    items: [
      'Be kind to yourself - <mark>You are your longest relationship</mark>',
      'Take action today - <mark>Future you will thank you</mark>',
      'Learn continuously - <mark>Growth is the goal</mark>',
    ],
  }),
});

const blob = await response.blob();
// Save or upload the blob
```

## Technical Details

### Image Generation

The generator uses two separate functions:

1. **`generateTitleImage()`**: Creates the title slide
   - Canvas: 1080x1920px
   - Font: 120px Merriweather ExtraBold with 2px letter spacing
   - All title lines get yellow highlight backgrounds
   - Positioned at vertical center

2. **`generateListImage()`**: Creates the list slide
   - Canvas: 1080x1920px
   - Title: 64px Merriweather Bold
   - List items: 26px Merriweather
   - Auto-adjusts line height to fit up to 20 items
   - Numbered list format

### Video Composition

Uses FFmpeg's concat demuxer to combine the two images:

```bash
ffmpeg -f concat -safe 0 -i concat_list.txt \
  -i audio.mp3 \
  -vf "scale=1080:1920" \
  -c:v libx264 -preset faster \
  -c:a aac -shortest \
  -t <duration> output.mp4
```

Where `concat_list.txt` contains:
```
file 'title_image.jpg'
duration 0.5
file 'list_image.jpg'
duration <remaining_duration>
file 'list_image.jpg'
```

The last file entry ensures the second image holds until the end of the video.

### Audio Handling

- If `audioPath` is not provided, automatically selects random music from `assets/audio/`
- If `duration` is not provided, automatically uses the audio file's duration
- If neither audio nor duration is provided, defaults to 5 seconds
- Audio is encoded as AAC at 128kbps

## Requirements

- FFmpeg installed and available in PATH
- FFprobe (comes with FFmpeg) for audio duration detection
- Deno runtime with required permissions:
  - `--allow-read`: Read assets and input
  - `--allow-write`: Write temporary images and output video
  - `--allow-run`: Execute FFmpeg commands
  - `--allow-ffi`: Canvas rendering
  - `--allow-sys`: System information
  - `--allow-env`: Environment variables

## Error Handling

The endpoint validates:
- `title` is a string
- `items` is an array of strings
- Returns 400 Bad Request for invalid input
- Returns 500 Internal Server Error if FFmpeg fails
- Cleans up temporary files even on error

## Performance

- Title image generation: ~100-200ms
- List image generation: ~200-400ms (varies with item count)
- Video encoding: ~1-3 seconds (varies with duration and audio)
- Total: ~2-4 seconds for typical 10-15 second video

## Tips

1. **Keep titles concise**: The title slide is only shown for 0.5 seconds, so use 2-6 words
2. **Limit items**: While the generator supports up to 20 items, 10-15 works best for readability
3. **Use highlights strategically**: Highlight key phrases to draw attention
4. **Match audio length**: Choose appropriate audio duration for your content (10-15s is typical)
5. **Test on mobile**: Always preview on a mobile device before posting to Instagram

## Related Generators

- **Single Reel (`/generate-reel`)**: Single image/quote for entire duration
- **Carousel (`/generate-carousel`)**: Multi-slide static carousel (not video)
- **Single Image (`/generate-image`)**: Static image with list content

