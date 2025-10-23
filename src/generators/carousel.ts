// Carousel generator

import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import type { CarouselInput, CarouselSlide, CarouselOutput } from '../types/index.ts';
import { parseMarkedText, wrapText } from '../utils/text.ts';
import { drawTextWithHighlights } from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';

const WIDTH = 1080;
const HEIGHT = 1350;

/**
 * Generate title slide
 */
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
  const allHighlights = [...parsed.highlights];
  for (const line of titleLines) {
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
  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

/**
 * Generate intro slide
 */
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

  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

/**
 * Generate point slide (numbered item)
 */
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

  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

/**
 * Generate closing slide
 */
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
    const lineHighlights = [];
    for (const hi of parsed.highlights) {
      let startIndex = 0;
      while (startIndex < line.length) {
        const idx = line.indexOf(hi.phrase, startIndex);
        if (idx === -1) break;
        lineHighlights.push({ start: idx, end: idx + hi.phrase.length });
        startIndex = idx + hi.phrase.length;
      }
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

      // Use simple highlight for closing slide
      ctx.fillStyle = 'rgba(240, 226, 49, 0.7)';
      ctx.fillRect(
        lineX + prefixWidth - padX + halfChar,
        currY - fontSize * 0.85,
        highlightWidth + padX * 2 - halfChar * 2,
        fontSize,
      );
    }

    // Draw text
    ctx.fillStyle = '#222';
    ctx.fillText(line, lineX, currY);
    currY += lineHeight;
  }

  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

/**
 * Generate a carousel from input data
 */
export async function generateCarousel(
  input: CarouselInput,
): Promise<CarouselOutput> {
  // Register fonts
  registerFonts();

  // Load both background images
  const currentDir = Deno.cwd();
  const bgImage1 = await loadImage(join(currentDir, 'assets', 'images', 'bg-1.jpeg'));
  const bgImage2 = await loadImage(join(currentDir, 'assets', 'images', 'bg-2.jpg'));

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

  return {
    success: true,
    slideCount: outputs.length,
    files: outputs,
  };
}

/**
 * CLI entry point for generating carousels
 */
export async function main(): Promise<void> {
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
    const output = await generateCarousel(input);
    console.log(JSON.stringify(output));
  } catch (error) {
    console.error('Error generating carousel:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

