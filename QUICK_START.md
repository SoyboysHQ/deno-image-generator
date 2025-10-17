# Quick Start Guide

## ✅ Your Setup is Complete!

You've successfully set up the Deno image generator. Here's a summary:

### Test Run Results

- ✅ Fonts downloaded (Merriweather family)
- ✅ Background image created  
- ✅ Example input data ready
- ✅ Image generated successfully (186 KB)

### Quick Commands

**1. Check Setup Status**
```bash
deno task test-setup
```

**2. Generate Image (using example data)**
```bash
deno task generate "$(cat example_input.json)"
```

**3. Generate Image (custom JSON)**
```bash
deno task generate '[{"title":"Your <mark>Title</mark>","list":["<mark>Point 1</mark>",...]}]'
```

### Output

The script generates: `real_life_cheat_codes_instagram.jpg` (1080x1350px)

### For n8n Integration

Use this command in an **Execute Command** node:

```bash
cd /Users/paul/deno_deploy && deno task generate '{{$json["inputData"]}}'
```

### Input JSON Format

```json
[
  {
    "title": "Your Title with <mark>highlights</mark>",
    "list": [
      "Point 1 with <mark>highlight</mark>",
      "Point 2 with <mark>another highlight</mark>",
      ... (20 points total)
    ]
  }
]
```

### Key Features

- `<mark>text</mark>` - Highlights text with yellow wavy background
- `§§§` - Splits one list item into multiple points
- Automatic text wrapping and balancing
- Custom fonts (Merriweather)
- 1080x1350px Instagram-ready format

### Permissions Required

- `--allow-read` - Read input files
- `--allow-write` - Write output image
- `--allow-ffi` - Canvas native bindings  
- `--allow-sys` - System info access

All permissions are pre-configured in `deno.json` tasks!

### Next Steps

1. Replace `background.jpeg` with your own 1080x1350px image for better results
2. Customize the example_input.json with your content
3. Run `deno task generate "$(cat example_input.json)"`
4. Find your image: `real_life_cheat_codes_instagram.jpg`

🎉 You're ready to generate images!


