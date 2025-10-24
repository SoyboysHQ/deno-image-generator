# Audio Files for Instagram Reels

Place your background music files here for use in Instagram Reels.

## Supported Formats
- MP3
- WAV
- AAC
- M4A
- OGG

## Usage

When making a request to the `/generate-reel` endpoint, specify the audio file path:

```json
{
  "imagePath": "assets/images/background.jpeg",
  "audioPath": "assets/audio/your-music.mp3",
  "duration": 5
}
```

## Finding Royalty-Free Music

Here are some sources for royalty-free music:
- [YouTube Audio Library](https://www.youtube.com/audiolibrary)
- [Free Music Archive](https://freemusicarchive.org/)
- [Incompetech](https://incompetech.com/music/royalty-free/)
- [Bensound](https://www.bensound.com/)

## Note

If no `audioPath` is provided, the reel will be generated without audio.

