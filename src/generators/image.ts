// Single image generator

import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import type { InputItem } from '../types/index.ts';
import { parseMarkedText, calculateItemHeights } from '../utils/text.ts';
import {
  drawBalancedCenteredTitleWithHighlight,
  drawTextWithHighlightWrapped,
} from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';

const WIDTH = 1080;
const HEIGHT = 1350;
const TITLE_FONT = 'bold 64px Merriweather';
const TITLE_LINE_HEIGHT = 70;
const LIST_FONT = '26px Merriweather';
const BASE_LINE_HEIGHT = 47;

/**
 * Generate a single Instagram image from input data
 */
export async function generateImage(
  input: InputItem[],
  outputPath: string = 'real_life_cheat_codes_instagram.jpg',
): Promise<void> {
  // Register fonts
  registerFonts();

  // Parse input data
  const parsedTitle = parseMarkedText(input[0].title);
  const title = parsedTitle.text;
  const titleHighlight = parsedTitle.highlights;

  const points: string[] = [];
  const highlights: any[] = [];
  
  for (const item of input[0].list) {
    // If multiple <mark>...</mark> in one string separated by §§§, split
    const subpoints = item.split('§§§');
    for (const sub of subpoints) {
      const parsed = parseMarkedText(sub);
      points.push(parsed.text);
      highlights.push(parsed.highlights);
    }
  }

  // Create canvas
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Load background image
  const currentDir = Deno.cwd();
  const bg = await loadImage(join(currentDir, 'assets', 'images', 'background.jpeg'));
  ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

  // Padding
  const PAD_X = 60;
  let currY = 90;

  // Title (balanced, centered, with highlight)
  ctx.font = TITLE_FONT;
  const titleHeight = drawBalancedCenteredTitleWithHighlight(
    ctx,
    title,
    PAD_X,
    currY,
    titleHighlight,
    TITLE_FONT,
    '#F0E231',
    WIDTH - PAD_X * 2,
    TITLE_LINE_HEIGHT,
  );
  currY += titleHeight - 20;

  // Author (centered, italic, smaller)
  ctx.font = 'italic 20px Merriweather';
  ctx.fillStyle = '#666';
  const author = 'by Compounding Wisdom';
  const authorWidth = ctx.measureText(author).width;
  ctx.fillText(author, (WIDTH - authorWidth) / 2, currY);
  currY += 30;

  // Divider line
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD_X, currY);
  ctx.lineTo(WIDTH - PAD_X, currY);
  ctx.stroke();
  currY += 40;

  const listStartY = currY;

  // Calculate heights for all items to determine if we need to adjust spacing
  const numWidth = ctx.measureText('20.').width;
  const itemHeights = calculateItemHeights(
    ctx,
    points,
    LIST_FONT,
    WIDTH - PAD_X * 2 - numWidth - 12,
  );

  // Calculate total needed height
  const totalLines = itemHeights.reduce((sum, h) => sum + h, 0);
  const baseItemSpacing = 2;
  const extraSpacing = 12;
  const estimatedHeight =
    totalLines * BASE_LINE_HEIGHT + 20 * baseItemSpacing + extraSpacing;
  const availableHeight = HEIGHT - listStartY - 30;

  // Dynamically adjust line height if content is too tall
  let LIST_LINE_HEIGHT = BASE_LINE_HEIGHT;
  let itemSpacing = baseItemSpacing;

  if (estimatedHeight > availableHeight) {
    const targetHeight = availableHeight - 20 * itemSpacing - extraSpacing;
    LIST_LINE_HEIGHT = Math.floor(targetHeight / totalLines);
    if (LIST_LINE_HEIGHT < 38) {
      LIST_LINE_HEIGHT = 38;
      itemSpacing = 0;
    }
  }

  // List
  for (let i = 0; i < 20; ++i) {
    ctx.font = LIST_FONT;
    ctx.fillStyle = '#222';
    const numStr = i + 1 + '.';
    const numWidth = ctx.measureText(numStr).width;
    ctx.fillText(numStr, PAD_X, currY + 26);
    
    const usedHeight = drawTextWithHighlightWrapped(
      ctx,
      points[i],
      PAD_X + numWidth + 12,
      currY + 26,
      highlights[i],
      LIST_FONT,
      '#F0E231',
      WIDTH - PAD_X * 2 - numWidth - 12,
      LIST_LINE_HEIGHT,
    );
    
    currY += usedHeight + itemSpacing;
    if (i === 7 || i === 13) currY += 6;
  }

  // Export image as JPEG
  const outputBuffer = await canvas.encode('jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);
  console.log(`Image generated as ${outputPath}`);
}

/**
 * CLI entry point for generating images
 */
export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error(
      'Error: No input JSON provided. Pass the input as a single JSON string argument.',
    );
    Deno.exit(1);
  }

  let input: InputItem[];
  try {
    input = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }

  try {
    await generateImage(input);
  } catch (error) {
    console.error('Error generating image:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

