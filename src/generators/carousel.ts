// Carousel generator

import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import type { CarouselInput, CarouselSlide, CarouselOutput, HighlightItem } from '../types/index.ts';
import { parseMarkedText, wrapText } from '../utils/text.ts';
import { drawTextWithHighlights } from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';
import { generateWatermark } from './watermark.ts';
import type { AccountIdentifier } from '../config/watermarks.ts';
import { isValidAccount } from '../config/watermarks.ts';

const WIDTH = 1080;
const HEIGHT = 1350;

/**
 * Assign colors to highlights, cycling through the provided color array
 */
function assignHighlightColors(
  highlights: HighlightItem[],
  highlightColors: string[],
): HighlightItem[] {
  if (!highlightColors || highlightColors.length === 0) {
    // Default to yellow if no colors provided
    return highlights.map(h => ({ ...h, color: h.color || '#F0E231' }));
  }

  let colorIndex = 0;
  return highlights.map(h => ({
    ...h,
    color: h.color || highlightColors[colorIndex++ % highlightColors.length],
  }));
}

/**
 * Format author slug into a readable author name
 */
function formatAuthorSlug(authorSlug: string): string {
  const authorMap: Record<string, string> = {
    'compounding_wisdom': 'Written by Compounding Wisdom',
    'itsnotwhatisaid': "Created by @itsnotwhatisaid",
    'default': 'Written by Compounding Wisdom',
  };
  
  return authorMap[authorSlug] || `Written by ${authorSlug.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')}`;
}

/**
 * Generate title slide
 */
async function generateTitleSlide(
  slide: CarouselSlide,
  bgImage: any,
  outputPath: string,
  highlightColors?: string[],
  authorSlug?: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Set author text based on authorSlug if provided, otherwise use slide.author or nothing
  if (authorSlug) {
    slide.author = formatAuthorSlug(authorSlug);
  } else if (!slide.author) {
    // Don't show author text if no authorSlug and no slide.author
    slide.author = undefined;
  }

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

  // Assign colors to highlights
  const coloredHighlights = assignHighlightColors(
    allHighlights,
    highlightColors || ['#F0E231'],
  );

  const titleY = HEIGHT / 2 - 200;
  
  // Use first highlight color as default, or yellow
  const defaultHighlightColor = highlightColors && highlightColors.length > 0
    ? highlightColors[0]
    : '#F0E231';
  
  drawTextWithHighlights(
    ctx,
    parsed.text,
    padding,
    titleY,
    coloredHighlights,
    titleFont,
    '#222',
    defaultHighlightColor,
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
  highlightColors?: string[],
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

    // Assign colors to highlights
    const coloredHighlights = assignHighlightColors(
      parsed.highlights,
      highlightColors || ['#F0E231'],
    );

    // Use first highlight color as default, or yellow
    const defaultHighlightColor = highlightColors && highlightColors.length > 0
      ? highlightColors[0]
      : '#F0E231';

    const height = drawTextWithHighlights(
      ctx,
      parsed.text,
      padding,
      currY,
      coloredHighlights,
      font,
      '#222',
      defaultHighlightColor,
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
  highlightColors?: string[],
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  const padding = 100;
  let currY = 400;

  // Draw numbered title
  const titleText = `${slide.number}. ${slide.title || ''}`;
  const parsed = parseMarkedText(titleText);
  const titleFont = 'bold 60px Merriweather';
  const titleLineHeight = 80;

  // Assign colors to highlights
  const coloredTitleHighlights = assignHighlightColors(
    parsed.highlights,
    highlightColors || ['#F0E231'],
  );

  // Use first highlight color as default, or yellow
  const defaultHighlightColor = highlightColors && highlightColors.length > 0
    ? highlightColors[0]
    : '#F0E231';

  const titleHeight = drawTextWithHighlights(
    ctx,
    parsed.text,
    padding,
    currY,
    coloredTitleHighlights,
    titleFont,
    '#222',
    defaultHighlightColor,
    WIDTH - padding * 2,
    titleLineHeight,
    'left',
  );

  currY += titleHeight + 40;

  // Draw body text
  const bodyParagraphs = (slide.body || '').split('\n\n');

  for (const para of bodyParagraphs) {
    const bodyParsed = parseMarkedText(para);
    const bodyFont = '38px Merriweather';
    const bodyLineHeight = 60;

    // Assign colors to highlights
    const coloredBodyHighlights = assignHighlightColors(
      bodyParsed.highlights,
      highlightColors || ['#F0E231'],
    );

    const bodyHeight = drawTextWithHighlights(
      ctx,
      bodyParsed.text,
      padding,
      currY,
      coloredBodyHighlights,
      bodyFont,
      '#222',
      defaultHighlightColor,
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
  highlightColors?: string[],
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

    // Use first highlight color as default, or yellow
    const defaultHighlightColor = highlightColors && highlightColors.length > 0
      ? highlightColors[0]
      : '#F0E231';

    // Convert hex to rgba for closing slide highlights
    const hexToRgba = (hex: string, opacity: number): string => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // Assign colors to highlights for closing slide
    let highlightColorIndex = 0;
    for (const hi of lineHighlights) {
      const prefix = line.slice(0, hi.start);
      const highlightText = line.slice(hi.start, hi.end);
      const prefixWidth = ctx.measureText(prefix).width;
      const highlightWidth = ctx.measureText(highlightText).width;
      const padX = 10;

      // Get color for this highlight (cycle through if multiple colors provided)
      const highlightColor = highlightColors && highlightColors.length > 0
        ? highlightColors[highlightColorIndex++ % highlightColors.length]
        : defaultHighlightColor;

      // Use simple highlight for closing slide
      ctx.fillStyle = hexToRgba(highlightColor, 0.7);
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
  const highlightColors = input.highlightColors;
  const authorSlug = input.authorSlug;

  // Generate each slide
  for (let i = 0; i < input.slides.length; i++) {
    const slide = input.slides[i];
    let outputPath = `${outputPrefix}_slide_${i + 1}.jpg`;

    // Alternate between the two background images
    const bgImage = i % 2 === 0 ? bgImage1 : bgImage2;

    console.error(`Generating slide ${i + 1}/${input.slides.length}...`);

    switch (slide.type) {
      case 'title':
        await generateTitleSlide(slide, bgImage, outputPath, highlightColors, authorSlug);
        break;
      case 'intro':
        await generateIntroSlide(slide, bgImage, outputPath, highlightColors);
        break;
      case 'point':
        await generatePointSlide(slide, bgImage, outputPath, highlightColors);
        break;
      case 'closing':
        await generateClosingSlide(slide, bgImage, outputPath, highlightColors);
        break;
      default:
        console.error(`Unknown slide type: ${slide.type}`);
        continue;
    }

    // Apply watermark if authorSlug is provided
    if (authorSlug && isValidAccount(authorSlug)) {
      const originalPath = outputPath;
      const watermarkedPath = `${outputPrefix}_slide_${i + 1}_watermarked.jpg`;
      console.error(`Adding watermark for ${authorSlug}...`);
      await generateWatermark({
        targetImagePath: originalPath,
        account: authorSlug as AccountIdentifier,
        outputPath: watermarkedPath,
        opacity: 0.5,
        scale: 0.09,
        padding: 30,
        horizontalOffset: 0,
        verticalOffset: 0,
      });
      // Clean up the original unwatermarked file
      try {
        await Deno.remove(originalPath);
      } catch (e) {
        console.warn(`Warning: Could not remove original file ${originalPath}:`, e);
      }
      // Replace the output path with the watermarked version
      outputPath = watermarkedPath;
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

