# Adding Music to Your Quote Reels

This guide will walk you through adding background music to your Instagram reels in just a few steps.

## Quick Setup (3 Steps)

### Step 1: Get Music

Choose one of these options:

**Option A: Free Music (Recommended for Testing)**
1. Visit [YouTube Audio Library](https://www.youtube.com/audiolibrary)
2. Filter by mood, genre, or duration (5-10 seconds works great)
3. Download an MP3 file

**Option B: Use Existing Music**
- Use any MP3 file you already have
- Make sure it's royalty-free if posting publicly

### Step 2: Add Music to Project

```bash
# Place your music file in the assets/audio directory
cp ~/Downloads/your-music.mp3 assets/audio/background-music.mp3
```

Or simply drag and drop the file into the `assets/audio/` folder.

### Step 3: Generate Reel with Music

Update your input JSON to include `audioPath`:

```json
{
  "quote": "You're going to realize it one day- that happiness was never about your job or your degree or being in a relationship.\n\nOne day, you will understand that happiness was always about learning how to live with yourself, that your happiness was never in the hands of others. It was always about you.",
  "author": "Bianca Sparacino",
  "audioPath": "assets/audio/background-music.mp3",
  "duration": 5
}
```

Generate the reel:

```bash
# Start server (if not running)
deno run --allow-net --allow-read --allow-write --allow-run --allow-ffi --allow-sys --allow-env src/server.ts

# In another terminal
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output reel_with_music.mp4
```

That's it! Your reel now has background music. 🎵

## Examples

### Example 1: Motivational Quote with Upbeat Music

```json
{
  "quote": "The only way to do great work is to love what you do.",
  "author": "Steve Jobs",
  "audioPath": "assets/audio/upbeat-inspiration.mp3",
  "duration": 6
}
```

### Example 2: Calm Quote with Ambient Music

```json
{
  "quote": "In the midst of movement and chaos, keep stillness inside of you.",
  "author": "Deepak Chopra",
  "audioPath": "assets/audio/calm-ambient.mp3",
  "duration": 5
}
```

### Example 3: Multiple Music Files

You can have multiple music files for different moods:

```
assets/audio/
├── upbeat-inspiration.mp3
├── calm-piano.mp3
├── energetic-pop.mp3
└── reflective-strings.mp3
```

Then choose the appropriate one for each reel:

```bash
# Energetic quote
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d '{"quote": "Just do it.", "author": "Nike", "audioPath": "assets/audio/energetic-pop.mp3"}' \
  --output energetic-reel.mp4

# Calm quote  
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d '{"quote": "Be still.", "author": "Psalm 46:10", "audioPath": "assets/audio/calm-piano.mp3"}' \
  --output calm-reel.mp4
```

## Music Recommendations by Quote Type

| Quote Type | Music Style | Suggested Sources |
|------------|-------------|-------------------|
| Motivational | Upbeat, inspiring, orchestral | Epidemic Sound, Artlist |
| Calm/Peaceful | Ambient, soft piano, strings | YouTube Audio Library |
| Energetic | Pop, electronic, upbeat | Bensound, Incompetech |
| Reflective | Minimal piano, acoustic | Free Music Archive |
| Wisdom | Classical, thoughtful | Purple Planet Music |

## Docker Usage

When using Docker, place your music files in `assets/audio/` before building:

```bash
# Add your music
cp ~/Downloads/music.mp3 assets/audio/background-music.mp3

# Build Docker image
make docker-build

# Start container
make docker-start

# Test with music
make docker-test-reel
```

## Audio Duration Tips

- **5 seconds**: Perfect for short quotes (1-2 sentences)
- **8 seconds**: Good for medium quotes (2-3 sentences)
- **10 seconds**: Best for longer quotes or multi-paragraph

The audio will automatically be trimmed to match your specified duration.

## Common Music Licenses

When choosing music, understand the license:

- **Public Domain**: Free to use, no attribution needed
- **Creative Commons (CC)**: Free to use, may require attribution
- **Royalty-Free**: One-time payment, unlimited use
- **Subscription**: Pay monthly, unlimited downloads

For Instagram, always verify the music is licensed for social media use!

## Testing Without Music First

Before adding music, test your quote reel without audio:

```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output reel_silent.mp4
```

This helps you:
1. Verify the quote looks good
2. Check timing and layout
3. Ensure everything works before adding audio

## Troubleshooting

### Music not playing

```bash
# Check if file exists
ls -la assets/audio/background-music.mp3

# Check file format
file assets/audio/background-music.mp3
# Should show: MPEG ADTS, layer III

# Test with FFmpeg directly
ffmpeg -i assets/audio/background-music.mp3
```

### Audio quality issues

Convert to MP3 at optimal bitrate:

```bash
ffmpeg -i input-audio.wav -codec:a libmp3lame -b:a 128k assets/audio/background-music.mp3
```

### File size too large

Compress the audio:

```bash
ffmpeg -i input.mp3 -b:a 96k -ac 1 assets/audio/compressed.mp3
```

## Best Practices

1. **Keep it short**: 5-8 seconds is ideal for Instagram Reels
2. **Match the mood**: Upbeat music for motivational quotes, calm for reflective ones
3. **Test the mix**: Generate a test reel to ensure music volume is appropriate
4. **Use high quality**: But not too large (128-192 kbps MP3 is perfect)
5. **Check licenses**: Always verify you have rights to use the music

## Resources

- [YouTube Audio Library](https://www.youtube.com/audiolibrary) - Free, high-quality
- [Free Music Archive](https://freemusicarchive.org/) - Curated free music
- [Incompetech](https://incompetech.com/music/royalty-free/) - Extensive free library
- [Bensound](https://www.bensound.com/) - Professional tracks
- [Purple Planet](https://www.purple-planet.com/) - Free background music

## See Also

- [Main README](README.md) - Complete API documentation
- [Quote Reel Guide](docs/QUOTE_REEL.md) - Detailed quote reel documentation
- [Audio Assets README](assets/audio/README.md) - Audio specifications and tips

