# Audio Files for Instagram Reels

Place your background music files here for use in Instagram Reels.

## 🎵 Automatic Music Selection

**New Feature:** Background music is **automatically and randomly selected** if you don't specify an `audioPath`!

Simply add music files named:
- `background-music-1.mp3`
- `background-music-2.mp3`

The system will randomly choose one of these files for each reel you generate.

## Supported Formats
- MP3 (recommended)
- WAV
- AAC
- M4A
- OGG

## Quick Start

### 1. Add Music Files

Download two music files and name them correctly:
```bash
# Download your favorite royalty-free music
cp ~/Downloads/upbeat-music.mp3 assets/audio/background-music-1.mp3
cp ~/Downloads/calm-music.mp3 assets/audio/background-music-2.mp3
```

**That's it!** The system will automatically randomly select one of these files for each reel.

### 2. Generate Reels (Music Auto-Selected!)

**Just generate - no audioPath needed:**
```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d '{
    "quote": "Your quote here...",
    "author": "Author Name",
    "duration": 5
  }' \
  --output reel_with_music.mp4
```

The system will automatically pick one of your music files!

**Or specify a particular file:**
```json
{
  "quote": "Your inspirational quote here...",
  "author": "Author Name",
  "audioPath": "assets/audio/background-music-1.mp3",
  "duration": 5
}
```

**With Custom Image:**
```json
{
  "imagePath": "assets/images/background.jpeg",
  "audioPath": "assets/audio/background-music.mp3",
  "duration": 5
}
```

### 3. Generate Reel

```bash
curl -X POST http://localhost:8000/generate-reel \
  -H "Content-Type: application/json" \
  -d @example_reel_input.json \
  --output reel_with_music.mp4
```

## Finding Royalty-Free Music

Here are some excellent sources for royalty-free music:

### Free Options
- **[YouTube Audio Library](https://www.youtube.com/audiolibrary)** - High-quality, completely free
- **[Free Music Archive](https://freemusicarchive.org/)** - Curated collection
- **[Incompetech](https://incompetech.com/music/royalty-free/)** - Kevin MacLeod's extensive library
- **[Bensound](https://www.bensound.com/)** - Professional quality tracks
- **[Purple Planet](https://www.purple-planet.com/)** - Free music for content creators

### Premium Options (Paid)
- **[Epidemic Sound](https://www.epidemicsound.com/)** - Subscription-based
- **[Artlist](https://artlist.io/)** - Popular with creators
- **[Musicbed](https://www.musicbed.com/)** - High-end production music

## Tips

### Choosing Music for Quote Reels
- **Calm/Motivational Quotes**: Soft piano, ambient, or acoustic guitar
- **Energetic Quotes**: Upbeat pop, inspiring orchestral
- **Reflective Quotes**: Minimal piano, strings, or ambient pads
- **Duration**: Match the music to your reel duration (typically 5-8 seconds)

### Audio Mixing
- The music will automatically mix with the video
- Keep volume appropriate for the mood
- Shorter reels (5-8s) work best with music that has a clear intro

### File Size
- MP3 files at 128-192 kbps are ideal for Instagram
- Keep files under 5MB for faster processing

## Testing Without Audio

You can test your quote reel without audio first:

```json
{
  "quote": "Your quote here...",
  "author": "Author Name",
  "duration": 5
}
```

Simply omit the `audioPath` field and the reel will be generated silently.

## Audio Processing Details

When you add audio:
- FFmpeg automatically syncs audio to video duration
- Audio is encoded as AAC at 128kbps (Instagram-optimized)
- If audio is longer than the video, it's trimmed
- If audio is shorter, the video duration matches the audio (unless duration is specified)

## Troubleshooting

**Audio not playing in output:**
- Verify the audio file exists at the specified path
- Check file format is supported (MP3 recommended)
- Ensure FFmpeg is installed: `ffmpeg -version`

**Audio is distorted:**
- Try a different bitrate (128-192 kbps for MP3)
- Convert to MP3 if using other formats
- Check the source audio quality

**File size too large:**
- Use MP3 format at 128 kbps
- Reduce video duration
- Compress audio before adding

