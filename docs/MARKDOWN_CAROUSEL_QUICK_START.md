# Markdown Carousel - Quick Start

Generate Instagram carousel slides from markdown in minutes!

## 🚀 Quick Example

### 1. Create Your Markdown

```json
{
  "markdown": "# 🧠 Main Title\n\n---\n\n## **1️⃣ First Point**\n\nExplanation text here.\n\n- Bullet point one\n- Bullet point two\n\n> \"Important quote\"\n\n---\n\n## **2️⃣ Second Point**\n\nMore content...",
  "outputPrefix": "my_carousel"
}
```

### 2. Send Request

```bash
curl -X POST http://localhost:8000/generate-markdown-carousel \
  -H "Content-Type: application/json" \
  -d @your_input.json \
  --output carousel.zip
```

### 3. Get Your Slides

The response is a ZIP file containing all slides:
- `my_carousel_slide_1.jpg`
- `my_carousel_slide_2.jpg`
- etc.

## 📝 Markdown Syntax Quick Reference

| Write This | Get This |
|------------|----------|
| `# Title` | Large title (90px, bold) |
| `## Section` | Section header (54px, bold) |
| `### Subsection` | Subsection (42px, bold) |
| `> Quote` | Blockquote (italic, indented) |
| `- Item` | Bullet list (only `-`, not `*`) |
| `*text*` | **Bold text** |
| `_text_` | *Italic text* |
| `<mark>text</mark>` | Yellow highlight |
| `---` | New slide |

## 💡 Tips

1. **Keep it simple**: 3-5 points per slide max
2. **Use emoji**: They work everywhere! 🎉
3. **Use headers for structure**: `#`, `##`, `###` are bold and sized
4. **Use inline formatting**: `*bold*` and `_italic_` work in body text!
5. **Use `<mark>` for highlights**: Yellow background emphasis
6. **Separate slides**: Use `---` on its own line

## 📋 Example from Your Input

Your markdown:
```markdown
# 🧠 Reprogramming Your Subconscious

---

## 1️⃣ Your subconscious doesn't argue.

_It obeys._

Every time you say —

> "I can't stay consistent."

Your mind whispers:

*"Okay... if you say so."*
```

Becomes:
- **Slide 1**: Large emoji + title (bold, 90px)
- **Slide 2**: Bold header + italic text + blockquote + bold statement

## 🧪 Test It

```bash
# Test locally
./test_markdown_carousel.sh

# Test via server
./test_server_markdown_carousel.sh

# Test in Docker
./docker-test-markdown-carousel.sh
```

## 📖 Full Documentation

See [MARKDOWN_CAROUSEL.md](MARKDOWN_CAROUSEL.md) for complete details.

## 🎨 Customization

The generator automatically:
- Centers content vertically
- Wraps long text
- Adds spacing between sections
- Indents blockquotes and lists
- Sizes fonts appropriately

All on the `assets/images/background.jpeg` image!

