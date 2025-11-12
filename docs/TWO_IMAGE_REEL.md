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
  "duration": "number (optional)",
  "author": "string (optional)",
  "style": {
    "primaryHighlightColor": "string (optional)",
    "secondaryHighlightColor": "string (optional)",
    "additionalHighlightColor": "string (optional)"
  }
}
```

### Parameters

- **`title`** (required): The title text for the first slide. Supports `<mark>...</mark>` tags for highlighting
- **`items`** (required): Array of list items for the second slide. Each item supports `<mark>...</mark>` tags for highlighting
- **`audioPath`** (optional): Path to custom audio file. If not provided, a random background music file will be selected from `assets/audio/`
- **`duration`** (optional): Total video duration in seconds. If not provided and audio is used, it will match the audio duration. Default: 5 seconds
- **`author`** (optional): Author signature displayed on both slides (default: `'by @compounding.wisdom'`)
- **`style`** (optional): Customize highlight colors
  - **`primaryHighlightColor`**: Color for the first `<mark>` tag (default: `#F0E231` - yellow)
  - **`secondaryHighlightColor`**: Color for the second `<mark>` tag (default: `#FFA500` - orange)
  - **`additionalHighlightColor`**: Color for additional `<mark>` tags (default: `#F0E231` - yellow)

### Highlight Syntax

Use `<mark>...</mark>` tags to highlight text. By default, the first highlight is yellow and the second is orange:

```json
{
  "title": "<mark>20 Real-Life Cheat Codes</mark>",
  "items": [
    "Read 30 minutes daily - <mark>Compound knowledge over time</mark>",
    "Wake up at 5 AM - <mark>Own your morning, own your day</mark>"
  ]
}
```

### Custom Highlight Colors

You can customize highlight colors using the `style` parameter:

```json
{
  "title": "<mark>5 Non-Negotiables</mark> <mark>for a Calm Life</mark>",
  "items": [
    "Protect your morning routine",
    "Prioritize sleep and recovery"
  ],
  "style": {
    "primaryHighlightColor": "#FF6B6B",
    "secondaryHighlightColor": "#4ECDC4",
    "additionalHighlightColor": "#FFD93D"
  }
}
```

The colors apply to `<mark>` tags in order:
- First `<mark>` → `primaryHighlightColor` (default: `#F0E231` yellow)
- Second `<mark>` → `secondaryHighlightColor` (default: `#FFA500` orange)  
- Third and beyond → `additionalHighlightColor` (default: `#F0E231` yellow)

Colors can be specified in hex format (e.g., `#FF6B6B`) or any CSS color format.

### Custom Author Signature

You can customize the author signature that appears on both slides:

```json
{
  "title": "<mark>My Content</mark>",
  "items": ["Item 1", "Item 2"],
  "author": "by @your.handle"
}
```

If not provided, defaults to `'by @compounding.wisdom'`. The author appears:
- On the title slide: Centered below the title in italic text
- On the list slide: Centered below the title and above the divider line

## Output

The endpoint returns an MP4 video file (1080x1920px, 9:16 aspect ratio) that can be directly uploaded to Instagram Reels.

### Video Structure

- **First 0.5 seconds**: Title slide with large, bold text and highlights
  - Uses `bg-1.jpeg` background
  - Title centered vertically
  - Author attribution centered below title (default: "by @compounding.wisdom")
  
- **Remaining duration**: List slide with all items
  - Uses mirrored `bg-1.jpeg` background
  - Title at top with author line
  - Numbered list items with highlights
  - Auto-adjusts spacing to fit content

## Example Usage

### Using the Test Script

Default colors:
```bash
./test_two_image_reel.sh
```

Custom colors:
```bash
./test_two_image_reel_custom_colors.sh
```

### Using curl

```bash
curl -X POST http://localhost:8000/generate-two-image-reel \
  -H "Content-Type: application/json" \
  -d @example_two_image_reel_input.json \
  --output my_reel.mp4
```

### Using JavaScript/TypeScript

With default colors:
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

With custom colors and author:
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
    author: 'by @your.handle',
    style: {
      primaryHighlightColor: '#FF6B6B',  // Red
      secondaryHighlightColor: '#4ECDC4', // Teal
      additionalHighlightColor: '#FFD93D' // Yellow
    }
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
6. **Customize colors for branding**: Use the `style` parameter to match your brand colors or create different moods (e.g., warm colors for motivational content, cool colors for educational content)
7. **Color contrast**: Ensure highlight colors have good contrast against the background for readability

## Related Generators

- **Single Reel (`/generate-reel`)**: Single image/quote for entire duration
- **Carousel (`/generate-carousel`)**: Multi-slide static carousel (not video)
- **Single Image (`/generate-image`)**: Static image with list content

