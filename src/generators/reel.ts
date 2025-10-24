// Instagram Reel generator - Creates a video from a static image with background music

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { ReelInput } from '../types/index.ts';
import { parseMarkedText, wrapText } from '../utils/text.ts';
import { drawWavyHighlight } from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';

const DEFAULT_DURATION = 5; // 5 seconds
const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920; // Instagram Reel dimensions (9:16)

/**
 * Generate a quote image for the reel
 */
async function generateQuoteImage(
  quote: string,
  author: string,
  outputPath: string = 'quote_image.jpg',
): Promise<void> {
  registerFonts();

  // Parse the quote for highlights
  const parsed = parseMarkedText(quote);
  const quoteText = parsed.text;
  const highlights = parsed.highlights;

  // Create canvas
  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Load background image
  const currentDir = Deno.cwd();
  const bg = await loadImage(join(currentDir, 'assets', 'images', 'background.jpeg'));
  ctx.drawImage(bg, 0, 0, REEL_WIDTH, REEL_HEIGHT);

  // Styling constants
  const PADDING_X = 80;
  const PADDING_Y = 100;
  const QUOTE_FONT = '48px Merriweather';
  const LINE_HEIGHT = 72;
  const AUTHOR_FONT = '32px Merriweather';

  // Calculate available space for quote
  const maxWidth = REEL_WIDTH - PADDING_X * 2;
  
  // Wrap the quote text
  ctx.font = QUOTE_FONT;
  const lines = wrapText(ctx, quoteText, maxWidth, QUOTE_FONT);
  
  // Calculate total height needed for quote
  const quoteHeight = lines.length * LINE_HEIGHT;
  const authorHeight = 80;
  const totalHeight = quoteHeight + authorHeight;
  
  // Start Y position (vertically centered)
  let currY = (REEL_HEIGHT - totalHeight) / 2 + 50;

  // Draw each line with full highlight background
  for (const line of lines) {
    const lineWidth = ctx.measureText(line).width;
    const lineX = PADDING_X;

    // Draw highlight background for the entire line
    const fontSize = 48;
    const padX = 10;
    const halfChar = ctx.measureText(' ').width / 2;
    
    drawWavyHighlight(
      ctx,
      lineX - padX + halfChar,
      currY - fontSize * 0.85,
      lineWidth + padX * 2 - halfChar,
      fontSize,
      '#F0E231',
    );

    // Draw the text
    ctx.font = QUOTE_FONT;
    ctx.fillStyle = '#222';
    ctx.fillText(line, lineX, currY);
    
    currY += LINE_HEIGHT;
  }

  // Add spacing before author
  currY += 40;

  // Draw author attribution
  ctx.font = AUTHOR_FONT;
  ctx.fillStyle = '#444';
  const authorText = `- ${author}`;
  ctx.fillText(authorText, PADDING_X, currY);

  // Export image as JPEG
  const outputBuffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);
  
  console.log(`[Reel] Quote image generated: ${outputPath}`);
}

/**
 * Generate an Instagram Reel from an image with optional background music
 */
export async function generateReel(
  input: ReelInput,
  outputPath: string = 'instagram_reel.mp4',
): Promise<void> {
  const duration = input.duration || DEFAULT_DURATION;
  const currentDir = Deno.cwd();
  
  let imagePath: string;
  
  // Generate quote image if quote is provided, otherwise use provided imagePath
  if (input.quote) {
    const author = input.author || 'Anonymous';
    const tempImagePath = join(currentDir, 'quote_image_temp.jpg');
    
    console.log(`[Reel] Generating quote image for: "${input.quote.slice(0, 50)}..."`);
    await generateQuoteImage(input.quote, author, tempImagePath);
    imagePath = tempImagePath;
  } else if (input.imagePath) {
    imagePath = input.imagePath.startsWith('/') 
      ? input.imagePath 
      : join(currentDir, input.imagePath);
  } else {
    throw new Error('Either quote or imagePath must be provided');
  }
  
  const finalOutputPath = input.outputPath || outputPath;
  
  console.log(`[Reel] Generating ${duration}s video from image: ${imagePath}`);
  console.log(`[Reel] Output: ${finalOutputPath}`);

  // Build FFmpeg command
  const ffmpegArgs: string[] = [
    '-loop', '1',                    // Loop the input image
    '-i', imagePath,                 // Input image
  ];

  // Add audio if provided
  if (input.audioPath) {
    const audioPath = input.audioPath.startsWith('/') 
      ? input.audioPath 
      : join(currentDir, input.audioPath);
    console.log(`[Reel] Adding audio: ${audioPath}`);
    ffmpegArgs.push('-i', audioPath);
  }

  // Video filters and output options
  ffmpegArgs.push(
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',               // H.264 codec
    '-preset', 'medium',             // Encoding speed/quality balance
    '-tune', 'stillimage',           // Optimize for still images
    '-crf', '23',                    // Quality (lower = better, 23 is good)
    '-pix_fmt', 'yuv420p',          // Pixel format for compatibility
    '-r', '30',                      // Frame rate
    '-t', duration.toString(),       // Duration
  );

  // Audio options
  if (input.audioPath) {
    ffmpegArgs.push(
      '-c:a', 'aac',                 // AAC audio codec
      '-b:a', '128k',                // Audio bitrate
      '-shortest',                   // End when shortest input ends
    );
  } else {
    // No audio track
    ffmpegArgs.push('-an');
  }

  // Output file (overwrite if exists)
  ffmpegArgs.push('-y', finalOutputPath);

  console.log(`[Reel] Running FFmpeg with args:`, ffmpegArgs.join(' '));

  // Execute FFmpeg command
  const command = new Deno.Command('ffmpeg', {
    args: ffmpegArgs,
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    console.error('[Reel] FFmpeg error:', errorText);
    throw new Error(`FFmpeg failed with code ${code}: ${errorText}`);
  }

  const outputText = new TextDecoder().decode(stdout);
  console.log('[Reel] FFmpeg output:', outputText);
  console.log(`[Reel] ✅ Video generated successfully: ${finalOutputPath}`);
  
  // Clean up temporary quote image if it was created
  if (input.quote) {
    try {
      const tempImagePath = join(currentDir, 'quote_image_temp.jpg');
      await Deno.remove(tempImagePath);
      console.log('[Reel] Cleaned up temporary quote image');
    } catch (e) {
      // Ignore errors if temp file doesn't exist
    }
  }
}

/**
 * CLI entry point for generating reels
 */
export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error(
      'Error: No input JSON provided. Pass the input as a single JSON string argument.',
    );
    Deno.exit(1);
  }

  let input: ReelInput;
  try {
    input = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }

  // Validate required fields
  if (!input.imagePath && !input.quote) {
    console.error('Error: Either imagePath or quote is required in the input JSON');
    Deno.exit(1);
  }

  try {
    await generateReel(input);
    console.log('✅ Reel generation completed');
  } catch (error) {
    console.error('❌ Error generating reel:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

