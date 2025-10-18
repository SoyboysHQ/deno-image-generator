import {
  Canvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
} from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

// Register fonts
GlobalFonts.registerFromPath('./Merriweather-Regular.ttf', 'Merriweather');
GlobalFonts.registerFromPath('./Merriweather-Bold.ttf', 'Merriweather');
GlobalFonts.registerFromPath('./Merriweather-Italic.ttf', 'Merriweather');

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
      y + Math.sin((i / (width - 2 * radius)) * Math.PI * 2) * waveAmp
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
      y + height + Math.sin((i / (width - 2 * radius)) * Math.PI * 2 + Math.PI) * waveAmp
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
        highlightWidth + padX * 2 - halfChar * 2,
        fontSize,
        highlightColor
      );
    }

    // Draw text
    ctx.fillStyle = textColor;
    ctx.fillText(line, lineX, currY);
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

  // Draw title (large, bold, with highlights)
  const titleFont = 'bold 70px Merriweather';
  const titleLineHeight = 90;
  const padding = 80;

  const titleY = HEIGHT / 2 - 100;
  drawTextWithHighlights(
    ctx,
    parsed.text,
    padding,
    titleY,
    parsed.highlights,
    titleFont,
    '#222',
    '#F0E231',
    WIDTH - padding * 2,
    titleLineHeight,
    'left',
  );

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
    const font = '28px Merriweather';
    const lineHeight = 50;

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
    const bodyFont = '26px Merriweather';
    const bodyLineHeight = 45;

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

  // Draw centered text
  const text = slide.body || slide.title || '';
  const font = '32px Merriweather';
  ctx.font = font;
  ctx.fillStyle = '#222';

  const textWidth = ctx.measureText(text).width;
  const x = (WIDTH - textWidth) / 2;
  const y = HEIGHT / 2;

  ctx.fillText(text, x, y);

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
  // Load both background images
  const bgImage1 = await loadImage('./bg-1.jpeg');
  const bgImage2 = await loadImage('./bg-2.jpg');

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
