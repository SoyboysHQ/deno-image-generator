# Instagram Image Generator for Deno

Generate beautiful Instagram carousel images with highlighted text using Deno.

## Prerequisites

- [Deno](https://deno.land/) installed (v1.40 or higher)
- Font files (Merriweather family):
  - `Merriweather-Regular.ttf`
  - `Merriweather-Bold.ttf`
  - `Merriweather-Italic.ttf`
- Background image: `background.jpeg` (1080x1350px recommended)

## Setup

1. **Install Deno** (if not already installed):
   ```bash
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

2. **Download Required Fonts**:
   
   Download the Merriweather font family from [Google Fonts](https://fonts.google.com/specimen/Merriweather) and place the following files in the project directory:
   - `Merriweather-Regular.ttf`
   - `Merriweather-Bold.ttf`
   - `Merriweather-Italic.ttf`

3. **Add Background Image**:
   
   Place your background image named `background.jpeg` in the project directory. The image should ideally be 1080x1350 pixels (Instagram portrait format).

## Project Structure

```
deno_deploy/
├── generate_image.ts       # Main script
├── deno.json              # Deno configuration
├── example_input.json     # Example input data
├── background.jpeg        # Background image (you provide)
├── Merriweather-*.ttf     # Font files (you provide)
└── README.md              # This file
```

## Usage

### Basic Usage

Run the script with input data as a JSON string:

```bash
deno run --allow-read --allow-write --allow-ffi --allow-sys generate_image.ts '[{"title":"Real Life <mark>Cheat Codes</mark>","list":["<mark>Wake up early</mark> and establish a morning routine"]}]'
```

**Note:** The `--allow-ffi` and `--allow-sys` flags are required for the canvas library to work with native bindings.

### Using Example Data

Test with the provided example input:

```bash
deno run --allow-read --allow-write generate_image.ts "$(cat example_input.json)"
```

### Using Deno Task

The project includes a task in `deno.json`:

```bash
deno task generate "$(cat example_input.json)"
```

## Input Format

The script expects a JSON array with the following structure:

```json
[
  {
    "title": "Your Title with <mark>highlighted</mark> text",
    "list": [
      "First point with <mark>highlight</mark>",
      "Second point with <mark>another highlight</mark>",
      "You can have multiple §§§ <mark>separated</mark> points"
    ]
  }
]
```

### Key Features

- **Highlighting**: Wrap text in `<mark>...</mark>` tags to highlight it with a yellow wavy background
- **Multiple Points**: Separate multiple points in a single list item using `§§§`
- **20 Points**: The script expects exactly 20 list items (after splitting by `§§§`)

## For n8n Integration

When using this in an n8n workflow:

1. **Code Node**: Use the "Execute Command" node or "HTTP Request" node to call Deno
2. **Pass JSON**: Format your data as a JSON string and pass it as the first argument
3. **Read Output**: The generated image will be saved as `real_life_cheat_codes_instagram.jpg`

### Example n8n Setup

In an **Execute Command** node:

```bash
cd /path/to/deno_deploy && deno run --allow-read --allow-write --allow-ffi --allow-sys generate_image.ts '{{$json["inputData"]}}'
```

Where `inputData` is your JSON string from a previous node.

### Example n8n Function Node to Format Data

```javascript
const items = $input.all();

const formattedData = [{
  title: items[0].json.title,
  list: items[0].json.list
}];

return {
  json: {
    inputData: JSON.stringify(formattedData)
  }
};
```

## Output

The script generates:
- `real_life_cheat_codes_instagram.jpg` - A 1080x1350px JPEG image ready for Instagram

## Customization

You can customize the following in `generate_image.ts`:

- `WIDTH` and `HEIGHT`: Canvas dimensions
- `TITLE_FONT`: Title font size and weight
- `LIST_FONT`: List item font size
- `PAD_X`: Horizontal padding
- Colors: Search for `#F0E231` (highlight color), `#222` (text color), etc.

## Troubleshooting

### "Failed to load image" error
- Ensure `background.jpeg` exists in the project directory
- Check that the image is a valid JPEG file

### Font rendering issues
- Verify all three Merriweather font files are present
- Ensure font files are valid TTF format

### Permission denied errors
- Make sure you're running with `--allow-read` and `--allow-write` flags

## License

MIT

