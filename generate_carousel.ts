import {
  Canvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
} from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

// Register fonts with absolute paths
const fontDir = Deno.cwd();
GlobalFonts.registerFromPath(
  join(fontDir, 'Merriweather-Regular.ttf'),
  'Merriweather',
);
GlobalFonts.registerFromPath(
  join(fontDir, 'Merriweather-Bold.ttf'),
  'Merriweather',
);
GlobalFonts.registerFromPath(
  join(fontDir, 'Merriweather-Italic.ttf'),
  'Merriweather',
);
GlobalFonts.registerFromPath(
  join(fontDir, 'Merriweather_120pt-ExtraBold.ttf'),
  'Merriweather ExtraBold',
);

const WIDTH = 1080;
const HEIGHT = 1350;

interface HighlightItem {
  phrase: string;
}

interface ParsedText {
  text: string;
  highlights: HighlightItem[];
}

interface CarouselSlide {
  type: 'title' | 'intro' | 'point' | 'closing';
  title?: string;
  subtitle?: string;
  body?: string;
  number?: number;
  author?: string;
}

interface CarouselInput {
  slides: CarouselSlide[];
  outputPrefix?: string;
}

// Parse marked text
function parseMarkedText(markedText: string): ParsedText {
  const regex = /<mark>(.*?)<\/mark>/g;
  const highlights: HighlightItem[] = [];
  let cleanText = '';
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(markedText)) !== null) {
    cleanText += markedText.slice(lastIndex, match.index);
    highlights.push({ phrase: match[1] });
    cleanText += match[1];
    lastIndex = match.index + match[0].length;
  }
  cleanText += markedText.slice(lastIndex);
  return { text: cleanText, highlights };
}

// Helper: find all occurrences of a phrase
interface PhraseIndex {
  start: number;
  end: number;
}

function findAllPhraseIndices(line: string, phrase: string): PhraseIndex[] {
  const indices: PhraseIndex[] = [];
  let startIndex = 0;
  while (startIndex < line.length) {
    const idx = line.indexOf(phrase, startIndex);
    if (idx === -1) break;
    indices.push({ start: idx, end: idx + phrase.length });
    startIndex = idx + phrase.length;
  }
  return indices;
}

// Draw wavy highlight background with rounded corners
function drawHighlight(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  ctx.save();
  ctx.beginPath();

  const waveAmp = 1 + Math.random() * 0.5; // very subtle wave
  const waveLen = 18;
  const radius = 8;

  // Top edge (wavy)
  ctx.moveTo(x + radius, y);
  for (let i = 0; i <= width - 2 * radius; i += waveLen) {
    ctx.lineTo(
      x + radius + i,
      y + Math.sin((i / (width - 2 * radius)) * Math.PI * 2) * waveAmp,
    );
  }
  ctx.lineTo(x + width - radius, y);

  // Top-right corner
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

  // Right edge
  ctx.lineTo(x + width, y + height - radius);

  // Bottom-right corner
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);

  // Bottom edge (wavy)
  for (let i = width - 2 * radius; i >= 0; i -= waveLen) {
    ctx.lineTo(
      x + radius + i,
      y +
        height +
        Math.sin((i / (width - 2 * radius)) * Math.PI * 2 + Math.PI) * waveAmp,
    );
  }
  ctx.lineTo(x + radius, y + height);

  // Bottom-left corner
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

  // Left edge
  ctx.lineTo(x, y + radius);

  // Top-left corner
  ctx.quadraticCurveTo(x, y, x + radius, y);

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// Wrap text into lines
function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  ctx.font = font;
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

// Draw text with highlights
function drawTextWithHighlights(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  highlights: HighlightItem[],
  font: string,
  textColor: string,
  highlightColor: string,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' = 'left',
  boldHighlights: boolean = false,
): number {
  // Split by newlines first to respect explicit line breaks
  const textSegments = text.split('\n');
  const allLines: string[] = [];

  // Wrap each segment separately
  for (const segment of textSegments) {
    const wrappedLines = wrapText(ctx, segment, maxWidth, font);
    allLines.push(...wrappedLines);
  }

  let currY = y;

  for (const line of allLines) {
    ctx.font = font;
    const lineWidth = ctx.measureText(line).width;
    const lineX = align === 'center' ? x + (maxWidth - lineWidth) / 2 : x;

    // Find highlights in this line
    const lineHighlights: PhraseIndex[] = [];
    for (const hi of highlights) {
      const matches = findAllPhraseIndices(line, hi.phrase);
      lineHighlights.push(...matches);
    }

    // Draw highlight backgrounds
    const fontSize = parseInt(font.match(/\d+/)?.[0] || '26', 10);
    const halfChar = ctx.measureText(' ').width / 2;

    for (const hi of lineHighlights) {
      const prefix = line.slice(0, hi.start);
      const highlightText = line.slice(hi.start, hi.end);
      const prefixWidth = ctx.measureText(prefix).width;
      const highlightWidth = ctx.measureText(highlightText).width;
      const padX = 10;
      const padY = 0;

      drawHighlight(
        ctx,
        lineX + prefixWidth - padX + halfChar,
        currY - fontSize * 0.85 - padY,
        highlightWidth + padX * 2 - halfChar,
        fontSize,
        highlightColor,
      );
    }

    // Draw text
    ctx.fillStyle = textColor;

    if (boldHighlights && lineHighlights.length > 0) {
      // Draw text in segments with bold for highlighted parts
      const boldFont = font.includes('bold')
        ? font
        : font.replace(/^/, 'bold ');

      // Sort highlights by start position
      const sortedHighlights = [...lineHighlights].sort(
        (a, b) => a.start - b.start,
      );

      let currentX = lineX;
      let lastEnd = 0;

      for (const hi of sortedHighlights) {
        // Draw non-highlighted text before this highlight
        if (hi.start > lastEnd) {
          const beforeText = line.slice(lastEnd, hi.start);
          ctx.font = font;
          ctx.fillText(beforeText, currentX, currY);
          currentX += ctx.measureText(beforeText).width;
        }

        // Draw highlighted text in bold
        const highlightText = line.slice(hi.start, hi.end);
        ctx.font = boldFont;
        ctx.fillText(highlightText, currentX, currY);
        currentX += ctx.measureText(highlightText).width;

        lastEnd = hi.end;
      }

      // Draw any remaining non-highlighted text
      if (lastEnd < line.length) {
        const afterText = line.slice(lastEnd);
        ctx.font = font;
        ctx.fillText(afterText, currentX, currY);
      }
    } else {
      // Draw text normally (non-bold highlights)
      ctx.fillText(line, lineX, currY);
    }

    currY += lineHeight;
  }

  return allLines.length * lineHeight;
}

// Generate title slide
async function generateTitleSlide(
  slide: CarouselSlide,
  bgImage: any,
  outputPath: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  slide.author = 'Written by Compounding Wisdom';

  // Draw background
  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  // Parse title with highlights
  const parsed = parseMarkedText(slide.title || '');
  parsed.text = parsed.text.replace('-', ' ');

  // Draw title (large, bold, with highlights)
  const titleFont = '120px "Merriweather ExtraBold"';
  const titleLineHeight = 140;
  const padding = 80;

  // Add letter-spacing (tracking) for title
  ctx.letterSpacing = '2px';
  
  // Get all lines that will be displayed so we can highlight each one
  const titleLines = wrapText(ctx, parsed.text, WIDTH - padding * 2, titleFont);
  
  // Create highlights for each complete line
  const allHighlights: HighlightItem[] = [...parsed.highlights];
  for (const line of titleLines) {
    // Add each line as a highlight phrase
    allHighlights.push({ phrase: line });
  }

  const titleY = HEIGHT / 2 - 200;
  
  drawTextWithHighlights(
    ctx,
    parsed.text,
    padding,
    titleY,
    allHighlights,
    titleFont,
    '#222',
    '#F0E231',
    WIDTH - padding * 2,
    titleLineHeight,
    'left',
  );
  
  // Reset letter-spacing
  ctx.letterSpacing = '0px';

  // Draw author/subtitle at bottom
  if (slide.author) {
    ctx.font = 'italic 24px Merriweather';
    ctx.fillStyle = '#666';
    const authorY = HEIGHT - 200;
    ctx.fillText(slide.author, padding, authorY);
  }

  // Save
  const buffer = await canvas.encode('jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

// Generate intro slide
async function generateIntroSlide(
  slide: CarouselSlide,
  bgImage: any,
  outputPath: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  const padding = 100;
  let currY = HEIGHT / 2 - 200;

  // Split body by newlines
  const paragraphs = (slide.body || '').split('\n\n');

  for (const para of paragraphs) {
    const parsed = parseMarkedText(para);
    const font = '34px Merriweather';
    const lineHeight = 55;

    const height = drawTextWithHighlights(
      ctx,
      parsed.text,
      padding,
      currY,
      parsed.highlights,
      font,
      '#222',
      '#F0E231',
      WIDTH - padding * 2,
      lineHeight,
      'left',
      true, // boldHighlights
    );

    currY += height + 30;
  }

  const buffer = await canvas.encode('jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

// Generate point slide (numbered item)
async function generatePointSlide(
  slide: CarouselSlide,
  bgImage: any,
  outputPath: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  const padding = 100;
  let currY = 400;

  // Draw numbered title
  const titleText = `${slide.number}. ${slide.title || ''}`;
  const parsed = parseMarkedText(titleText);
  const titleFont = 'bold 48px Merriweather';
  const titleLineHeight = 65;

  const titleHeight = drawTextWithHighlights(
    ctx,
    parsed.text,
    padding,
    currY,
    parsed.highlights,
    titleFont,
    '#222',
    '#F0E231',
    WIDTH - padding * 2,
    titleLineHeight,
    'left',
  );

  currY += titleHeight + 40;

  // Draw body text
  const bodyParagraphs = (slide.body || '').split('\n\n');

  for (const para of bodyParagraphs) {
    const bodyParsed = parseMarkedText(para);
    const bodyFont = '32px Merriweather';
    const bodyLineHeight = 52;

    const bodyHeight = drawTextWithHighlights(
      ctx,
      bodyParsed.text,
      padding,
      currY,
      bodyParsed.highlights,
      bodyFont,
      '#222',
      '#F0E231',
      WIDTH - padding * 2,
      bodyLineHeight,
      'left',
    );

    currY += bodyHeight + 25;
  }

  const buffer = await canvas.encode('jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

// Generate closing slide
async function generateClosingSlide(
  slide: CarouselSlide,
  bgImage: any,
  outputPath: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  // Parse text for highlights
  const text = slide.body || slide.title || '';
  const parsed = parseMarkedText(text);

  const font = '38px Merriweather';
  const lineHeight = 60;
  const padding = 100;
  const maxWidth = WIDTH - padding * 2;

  // Wrap text to fit within padding
  const lines = wrapText(ctx, parsed.text, maxWidth, font);

  // Calculate starting Y position to center the text block
  const totalHeight = lines.length * lineHeight;
  let currY = (HEIGHT - totalHeight) / 2 + lineHeight * 0.8;

  // Draw each line centered with highlights
  for (const line of lines) {
    ctx.font = font;
    const lineWidth = ctx.measureText(line).width;
    const lineX = (WIDTH - lineWidth) / 2;

    // Find highlights in this line
    const lineHighlights: PhraseIndex[] = [];
    for (const hi of parsed.highlights) {
      const matches = findAllPhraseIndices(line, hi.phrase);
      lineHighlights.push(...matches);
    }

    // Draw highlight backgrounds
    const fontSize = 38;
    const halfChar = ctx.measureText(' ').width / 2;

    for (const hi of lineHighlights) {
      const prefix = line.slice(0, hi.start);
      const highlightText = line.slice(hi.start, hi.end);
      const prefixWidth = ctx.measureText(prefix).width;
      const highlightWidth = ctx.measureText(highlightText).width;
      const padX = 10;

      drawHighlight(
        ctx,
        lineX + prefixWidth - padX + halfChar,
        currY - fontSize * 0.85,
        highlightWidth + padX * 2 - halfChar * 2,
        fontSize,
        '#F0E231',
      );
    }

    // Draw text
    ctx.fillStyle = '#222';
    ctx.fillText(line, lineX, currY);
    currY += lineHeight;
  }

  const buffer = await canvas.encode('jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

// Main execution
if (!Deno.args[0]) {
  console.error('Error: No input JSON provided');
  Deno.exit(1);
}

let input: CarouselInput;
try {
  input = JSON.parse(Deno.args[0]);
} catch (e) {
  console.error('Failed to parse input JSON:', e);
  Deno.exit(1);
}

try {
  // Load both background images with absolute paths
  const currentDir = Deno.cwd();
  const bgImage1 = await loadImage(join(currentDir, 'bg-1.jpeg'));
  const bgImage2 = await loadImage(join(currentDir, 'bg-2.jpg'));

  const outputPrefix = input.outputPrefix || 'carousel';
  const outputs: string[] = [];

  // Generate each slide
  for (let i = 0; i < input.slides.length; i++) {
    const slide = input.slides[i];
    const outputPath = `${outputPrefix}_slide_${i + 1}.jpg`;

    // Alternate between the two background images
    const bgImage = i % 2 === 0 ? bgImage1 : bgImage2;

    console.error(`Generating slide ${i + 1}/${input.slides.length}...`);

    switch (slide.type) {
      case 'title':
        await generateTitleSlide(slide, bgImage, outputPath);
        break;
      case 'intro':
        await generateIntroSlide(slide, bgImage, outputPath);
        break;
      case 'point':
        await generatePointSlide(slide, bgImage, outputPath);
        break;
      case 'closing':
        await generateClosingSlide(slide, bgImage, outputPath);
        break;
      default:
        console.error(`Unknown slide type: ${slide.type}`);
        continue;
    }

    outputs.push(outputPath);
  }

  // Output result
  console.log(
    JSON.stringify({
      success: true,
      slideCount: outputs.length,
      files: outputs,
    }),
  );
} catch (error) {
  console.error('Error generating carousel:', error);
  Deno.exit(1);
}
