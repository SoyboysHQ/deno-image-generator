# Markdown Carousel Generator

Generate Instagram carousel slides from markdown input. Each slide is automatically formatted with proper typography, spacing, and styling.

## Features

- **Markdown Support**: Headers, lists, blockquotes, bold, italic, and emoji
- **Automatic Slide Separation**: Use `---` to separate slides
- **Smart Typography**: Automatic font sizing, spacing, and wrapping
- **Inline Formatting**: `*bold*` and `_italic_` work in body text
- **Highlight Support**: Use `<mark>text</mark>` for yellow highlights
- **Professional Layout**: Content is automatically centered and spaced

## Endpoint

```
POST /generate-markdown-carousel
```

## Input Format

```json
{
  "markdown": "# Title\n\n---\n\n## Slide 2\n\nContent...",
  "outputPrefix": "my_carousel" // Optional, defaults to "markdown_carousel"
}
```

### Markdown Syntax Support

| Syntax | Rendering | Example |
|--------|-----------|---------|
| `# Text` | Large title (90px, bold) | `# 🧠 Main Title` |
| `## Text` | Section header (54px, bold) | `## 1️⃣ Section` |
| `### Text` | Subsection header (42px, bold) | `### Introduction` |
| `> Text` | Blockquote (32px, italic, indented) | `> "Quote here"` |
| `- Text` | List item with bullet | `- First item` |
| `*text*` | **Bold text** | `*important*` |
| `_text_` | *Italic text* | `_emphasis_` |
| `<mark>text</mark>` | Yellow highlight | `<mark>highlighted</mark>` |

### Slide Separator

Separate slides using three dashes on their own line:

```markdown
# First Slide

---

## Second Slide
```

## Example Input

```json
{
  "markdown": "# 🧠 Reprogramming Your Subconscious\n\n---\n\n## 1️⃣ Your subconscious doesn't argue.\n\nIt obeys.\n\nEvery time you say —\n\n> \"I can't stay consistent.\"\n> \"I'm not disciplined enough.\"\n\nYour mind whispers:\n\n<mark>\"Okay... if you say so.\"</mark>\n\n---\n\n## 2️⃣ Lists work great too\n\n- <mark>Words</mark> become beliefs.\n- <mark>Beliefs</mark> become identity.\n- <mark>Identity</mark> becomes destiny.",
  "outputPrefix": "subconscious_reprogramming"
}
```

## Output

Returns a ZIP file containing all generated slides:

- `{outputPrefix}_slide_1.jpg`
- `{outputPrefix}_slide_2.jpg`
- `{outputPrefix}_slide_3.jpg`
- etc.

Each slide is 1080x1350px (Instagram carousel format).

## Typography & Spacing

The generator automatically:
- **Centers content vertically** when slides have less content
- **Adds extra spacing** after headers
- **Wraps text** to fit within safe margins (100px padding)
- **Indents blockquotes** (40px) and lists (20px)
- **Adjusts line height** based on font size

## Best Practices

### 1. Keep It Concise
Each slide should have 3-5 key points maximum. Long paragraphs will wrap but may overflow.

### 2. Use Headers for Emphasis
- `#` for carousel title (slide 1) - large and bold
- `##` for main slide titles - medium and bold  
- `###` for subsections - smaller and bold
- Headers are the primary way to add emphasis and structure

### 3. Mix Content Types
Combine headers, body text, lists, and blockquotes for visual variety:

```markdown
## <mark>Main Point</mark>

Regular explanation text here.

- <mark>Supporting point one</mark>
- Supporting point two

> "Memorable quote"
```

### 4. Leverage Emoji
Emoji work great in headers for visual interest:
- `# 🧠 Cognitive Science`
- `## 1️⃣ First Principle`
- `- 💡 Key insight`

### 5. Use Highlights for Emphasis
Highlight key phrases with `<mark>` (this is the recommended way to emphasize text):
- `<mark>most important concept</mark>`
- Works across all content types (headers, body, lists, blockquotes)
- Renders as yellow background highlight

### 6. Blockquotes for Impact
Use blockquotes for:
- Quotes
- Key statements
- Examples to emphasize

```markdown
> "This stands out visually"
```

## Typography Reference

| Element | Font | Size | Weight | Color | Line Height |
|---------|------|------|--------|-------|-------------|
| H1 | Merriweather | 90px | Bold | #222 | 110px |
| H2 | Merriweather | 54px | Bold | #222 | 70px |
| H3 | Merriweather | 42px | Bold | #222 | 58px |
| Body | Merriweather | 34px | Regular | #222 | 52px |
| List | Merriweather | 32px | Regular | #222 | 50px |
| Blockquote | Merriweather | 32px | Italic | #555 | 50px |

## Testing

### Local Testing

```bash
# Test the generator directly
./test_markdown_carousel.sh

# Test via HTTP server
./test_server_markdown_carousel.sh
```

### Docker Testing

```bash
./docker-test-markdown-carousel.sh
```

### Manual cURL Test

```bash
curl -X POST http://localhost:8000/generate-markdown-carousel \
  -H "Content-Type: application/json" \
  -d @example_markdown_carousel_input.json \
  --output carousel.zip
```

## Examples

See `example_markdown_carousel_input.json` for a complete example with 9 slides covering various markdown features.

## Technical Details

- **Background**: Uses `assets/images/background.jpeg`
- **Canvas Size**: 1080x1350px (Instagram carousel format)
- **Fonts**: Merriweather (Regular, Bold, Italic, ExtraBold)
- **Output Format**: JPEG, 95% quality
- **Highlight Color**: #F0E231 (yellow)
- **Text Color**: #222 (dark gray)

## Limitations

1. **Simplified bold/italic**: `*text*` = bold, `_text_` = italic (not standard markdown, but cleaner)
2. **Lists use `-` only**: `*` is reserved for bold, so lists must use `-` prefix
3. **No nested markdown**: Lists and blockquotes can't be nested
4. **No images**: Markdown images (`![alt](url)`) are not supported
5. **No tables**: Markdown tables are not supported
6. **Text overflow**: Very long content may overflow slides
7. **Single background**: All slides use the same background image

## Future Enhancements

Potential improvements:
- Multiple background support (alternating)
- Custom highlight colors via markdown attributes
- Support for inline code (`code`)
- Support for horizontal rules
- Custom font selection
- Automatic slide splitting for long content

