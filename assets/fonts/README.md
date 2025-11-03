# Fonts

This directory contains fonts used for text rendering in the Instagram content generator.

## Fonts Included

### Merriweather
- **Merriweather-Regular.ttf** - Regular weight
- **Merriweather-Bold.ttf** - Bold weight
- **Merriweather-Italic.ttf** - Italic style
- **Merriweather_120pt-ExtraBold.ttf** - Extra bold weight
- **Handwritten_soyboys_i-Regular.ttf** - Handwritten style

**Usage:** Primary font for all text overlays in reels and carousels.

### Emoji Support

**Usage:** Emoji rendering is handled by system emoji fonts installed via the Docker container (`fonts-noto-color-emoji` package).

**How it works:** The system emoji font is automatically installed and registered when the Docker container is built. No manual download required.

## Emoji Support

The three-part reel generator now supports emojis in text overlays! 🎉

Example:
```json
{
  "text3": "Comment 🧠 for discount link."
}
```

### How It Works

1. System emoji fonts are installed via `fonts-noto-color-emoji` package in Docker
2. Text rendering uses: `Merriweather, "Noto Emoji", Emoji, sans-serif` font stack
3. When Merriweather can't render a character (like emojis), it falls back to system emoji fonts
4. This ensures text maintains the Merriweather style while emojis render correctly

### Note on Emoji Rendering

The `@napi-rs/canvas` library used for server-side rendering has limited emoji support. Emojis will render as outlines or simple glyphs, which is standard for server-side text rendering. This maintains a consistent, professional look for Instagram content.

## Setup

**Docker:** Emoji fonts are automatically installed via the system package manager during the build process.

**Local Development:** If running locally (not in Docker), you may need to install emoji fonts on your system:
- **macOS:** Emoji fonts are built-in
- **Linux:** Install with `sudo apt-get install fonts-noto-color-emoji`

