// Instagram Reel generator - Creates a video from a static image with background music

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { ReelInput } from '../types/index.ts';
import { parseMarkedText, wrapText } from '../utils/text.ts';
import { drawHighlight } from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';
import { getRandomBackgroundMusicPath, getAudioDuration } from '../utils/audio.ts';

const DEFAULT_DURATION = 5; // 5 seconds
const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920; // Instagram Reel dimensions (9:16)

/**
 * Calculate font size to fill 2/3 of available vertical space
 * Uses iterative approach to account for font size affecting line count
 */
function calculateFontSizeToFillBox(
  quoteText: string,
  font: string,
  targetHeightRatio: number = 2/3,
  maxFontSize: number = 80,
): number {
  // Register fonts first so we can measure with custom fonts
  registerFonts();
  
  const PADDING_X = 80;
  const PADDING_Y = 100;
  const maxWidth = REEL_WIDTH - PADDING_X * 2; // 920px
  const AUTHOR_HEIGHT = 80;
  const AUTHOR_SPACING = 140;
  const paragraphSpacing = 50;
  
  // Available height excluding padding and author space
  const availableHeight = REEL_HEIGHT - PADDING_Y * 2 - AUTHOR_HEIGHT - AUTHOR_SPACING;
  const targetHeight = availableHeight * targetHeightRatio;
  
  // Create temporary canvas for measurement
  const tempCanvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const tempCtx = tempCanvas.getContext('2d');
  
  // First, check if text fits in target space at max font size
  // If it does, use max font size. Otherwise, calculate what's needed.
  const testFontMax = `${maxFontSize}px ${font}`;
  tempCtx.font = testFontMax;
  
  const paragraphs = quoteText.split('\n\n').filter(p => p.trim());
  const paragraphBreaks = Math.max(0, paragraphs.length - 1);
  
  // Calculate lines at max font size
  let totalLinesAtMax = 0;
  for (const para of paragraphs) {
    const explicitLines = para.split('\n').filter(l => l.trim());
    for (const explicitLine of explicitLines) {
      const wrappedLines = wrapText(tempCtx, explicitLine, maxWidth, testFontMax);
      totalLinesAtMax += wrappedLines.length;
    }
  }
  
  if (totalLinesAtMax === 0) return 42; // Fallback
  
  // Check if max font size fits in target space
  // Use same line height multiplier as rendering: 1.3 for > 50, 1.43 for <= 50
  const lineHeightMultiplierMax = maxFontSize > 50 ? 1.3 : 1.43;
  const lineHeightMax = maxFontSize * lineHeightMultiplierMax;
  const heightAtMax = totalLinesAtMax * lineHeightMax + paragraphBreaks * paragraphSpacing;
  
  console.log(`[FontSize Calc] Max font size check: ${maxFontSize}px, lines: ${totalLinesAtMax}, height: ${heightAtMax}px, target: ${targetHeight}px`);
  
  // If max font size fits in target space, use it
  if (heightAtMax <= targetHeight) {
    console.log(`[FontSize Calc] Using max font size: ${maxFontSize}px`);
    return maxFontSize;
  }
  
  // Otherwise, calculate what font size is needed to fill target space
  let fontSize = 42; // Start with default
  let lastFontSize = 0;
  
  // Iterate until we converge (or max iterations)
  for (let iteration = 0; iteration < 10 && Math.abs(fontSize - lastFontSize) > 0.5; iteration++) {
    lastFontSize = fontSize;
    const testFont = `${fontSize}px ${font}`;
    tempCtx.font = testFont;
    
    // Calculate how many lines the quote will take at this font size
    let totalLines = 0;
    for (const para of paragraphs) {
      const explicitLines = para.split('\n').filter(l => l.trim());
      for (const explicitLine of explicitLines) {
        const wrappedLines = wrapText(tempCtx, explicitLine, maxWidth, testFont);
        totalLines += wrappedLines.length;
      }
    }
    
    if (totalLines === 0) return 42; // Fallback
    
    // Calculate actual height at this font size
    // Use same line height multiplier as rendering: 1.3 for > 50, 1.43 for <= 50
    const lineHeightMultiplier = fontSize > 50 ? 1.3 : 1.43;
    const lineHeight = fontSize * lineHeightMultiplier;
    const actualHeight = totalLines * lineHeight + paragraphBreaks * paragraphSpacing;
    
    // Calculate adjustment needed
    const heightRatio = targetHeight / actualHeight;
    fontSize = fontSize * heightRatio;
    
    // Clamp between reasonable bounds, with max font size limit
    fontSize = Math.max(28, Math.min(maxFontSize, fontSize));
  }
  
  return Math.round(fontSize);
}

/**
 * Generate a quote image for the reel
 */
async function generateQuoteImage(
  quote: string,
  author: string,
  highlightColor: string,
  outputPath: string = 'quote_image.jpg',
  font: string = 'Merriweather',
  fontSize: number = 42,
  backgroundImage: string = 'background.jpeg',
  highlightOpacity: number = 0.7,
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
  const bg = await loadImage(join(currentDir, 'assets', 'images', backgroundImage));
  ctx.drawImage(bg, 0, 0, REEL_WIDTH, REEL_HEIGHT);

  // Styling constants
  const PADDING_X = 80;
  const PADDING_Y = 100;
  const FONT_SIZE = fontSize; // Quote font size in pixels
  const QUOTE_FONT = `${FONT_SIZE}px ${font}`;
  // Dynamic line height: keep original 1.43 for normal fonts, tighter for larger fonts
  const LINE_HEIGHT_MULTIPLIER = FONT_SIZE > 50 ? 1.3 : 1.43;
  const LINE_HEIGHT = Math.round(FONT_SIZE * LINE_HEIGHT_MULTIPLIER);
  const PARAGRAPH_SPACING = 50; // Extra spacing between paragraphs
  const AUTHOR_FONT_SIZE = Math.round(FONT_SIZE * 0.76); // Proportional author font (32/42 ratio)
  const AUTHOR_FONT = `${AUTHOR_FONT_SIZE}px ${font}`;

  // Calculate available space for quote
  const maxWidth = REEL_WIDTH - PADDING_X * 2;
  
  // Split by paragraphs first (double newlines)
  const paragraphs = quoteText.split('\n\n').filter(p => p.trim());
  
  // Wrap each paragraph separately, handling single newlines within paragraphs
  ctx.font = QUOTE_FONT;
  const allLines: { text: string; isParagraphEnd: boolean }[] = [];
  
  for (let i = 0; i < paragraphs.length; i++) {
    // Split each paragraph by single newlines to preserve explicit line breaks
    const explicitLines = paragraphs[i].split('\n').filter(l => l.trim());
    
    // Wrap each explicit line separately
    for (let j = 0; j < explicitLines.length; j++) {
      const wrappedLines = wrapText(ctx, explicitLines[j], maxWidth, QUOTE_FONT);
      wrappedLines.forEach((line, idx) => {
        const isLastLineOfParagraph = (j === explicitLines.length - 1) && 
                                       (idx === wrappedLines.length - 1) && 
                                       (i < paragraphs.length - 1);
        allLines.push({
          text: line,
          isParagraphEnd: isLastLineOfParagraph
        });
      });
    }
  }
  
  // Calculate total height needed for quote
  const paragraphBreaks = allLines.filter(l => l.isParagraphEnd).length;
  const quoteHeight = allLines.length * LINE_HEIGHT + paragraphBreaks * PARAGRAPH_SPACING;
  const authorHeight = 80;
  const totalHeight = quoteHeight + authorHeight;
  
  // Start Y position (vertically centered)
  let currY = (REEL_HEIGHT - totalHeight) / 2 + 50;

  // Draw each line with full highlight background
  for (const lineObj of allLines) {
    const line = lineObj.text;
    const lineWidth = ctx.measureText(line).width;
    const lineX = PADDING_X;

    // Draw highlight background for the entire line with better padding
    const padX = 15; // Increased padding
    
    drawHighlight(
      ctx,
      lineX - padX,
      currY - FONT_SIZE * 0.85,
      lineWidth + padX * 2,
      FONT_SIZE,
      highlightColor,
      false,
      highlightOpacity,
    );

    // Draw the text
    ctx.font = QUOTE_FONT;
    ctx.fillStyle = '#222';
    ctx.fillText(line, lineX, currY);
    
    currY += LINE_HEIGHT;
    
    // Add extra spacing after paragraph end
    if (lineObj.isParagraphEnd) {
      currY += PARAGRAPH_SPACING;
    }
  }

  // Add spacing before author
  currY += 140;

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
  console.log('[Reel] ========================================');
  console.log('[Reel] Starting reel generation...');
  console.log('[Reel] Input:', JSON.stringify(input, null, 2));
  console.log('[Reel] ========================================');
  
  const currentDir = Deno.cwd();
  
  let imagePath: string;
  
  // Generate quote image if quote is provided, otherwise use provided imagePath
  if (input.quote) {
    const author = input.author || 'Anonymous';
    const tempImagePath = join(currentDir, 'quote_image_temp.jpg');
    const font = input.font || 'Merriweather'; // Default to Merriweather
    const backgroundImage = input.backgroundImage || 'background.jpeg'; // Default to background.jpeg
    const highlightOpacity = input.highlightOpacity ?? 0.7; // Default to 0.7 (use ?? to allow 0)
    
    // Parse quote to get clean text for font size calculation
    const parsed = parseMarkedText(input.quote);
    const quoteText = parsed.text;
    
    // Calculate font size: use provided fontSize, or auto-calculate to fill 2/3 of space
    let fontSize: number;
    if (input.fontSize) {
      fontSize = input.fontSize; // Use provided font size
    } else if (input.autoFontSize) {
      // Auto-calculate to fill 2/3 of available vertical space, with max font size of 80px
      fontSize = calculateFontSizeToFillBox(quoteText, font, 2/3, 80);
      console.log(`[Reel] Auto-calculated font size to fill 2/3 of space: ${fontSize}px (max: 80px)`);
    } else {
      fontSize = 42; // Default to 42px
    }
    
    console.log(`[Reel] Generating quote image for: "${input.quote.slice(0, 50)}..."`);
    console.log(`[Reel] Using font: ${font}`);
    console.log(`[Reel] Using font size: ${fontSize}px`);
    console.log(`[Reel] Using background: ${backgroundImage}`);
    console.log(`[Reel] Using highlight opacity: ${highlightOpacity}`);
    await generateQuoteImage(input.quote, author, input.highlightColor || '#F0E231', tempImagePath, font, fontSize, backgroundImage, highlightOpacity);
    imagePath = tempImagePath;
  } else if (input.imagePath) {
    imagePath = input.imagePath.startsWith('/') 
      ? input.imagePath 
      : join(currentDir, input.imagePath);
  } else {
    throw new Error('Either quote or imagePath must be provided');
  }
  
  // Auto-select random background music if not provided
  console.log('[Reel] ========================================');
  console.log('[Reel] Checking for audio...');
  console.log('[Reel] input.audioPath:', input.audioPath);
  let audioPath: string | undefined = input.audioPath;
  if (!audioPath) {
    console.log('[Reel] No audioPath provided, selecting random music...');
    const selectedMusicPath = await getRandomBackgroundMusicPath(currentDir);
    console.log('[Reel] Selected music path:', selectedMusicPath);
    if (selectedMusicPath) {
      audioPath = selectedMusicPath;
      console.log('[Reel] ✅ Using audio:', audioPath);
    } else {
      console.log('[Reel] No background music found, generating without audio');
    }
  } else {
    // Resolve relative paths to absolute
    audioPath = audioPath.startsWith('/') 
      ? audioPath 
      : join(currentDir, audioPath);
    console.log('[Reel] Using provided audioPath:', audioPath);
  }
  console.log('[Reel] ========================================');
  
  // Determine duration: use provided duration, or if not provided and audio exists, use audio duration
  let duration = input.duration;
  if (!duration && audioPath) {
    console.log('[Reel] No duration provided, getting audio file duration...');
    const audioDuration = await getAudioDuration(audioPath);
    if (audioDuration) {
      duration = audioDuration;
      console.log(`[Reel] ✅ Using audio file duration: ${duration.toFixed(2)}s`);
    } else {
      duration = DEFAULT_DURATION;
      console.log(`[Reel] ⚠️  Could not determine audio duration, using default: ${duration}s`);
    }
  } else if (!duration) {
    duration = DEFAULT_DURATION;
    console.log(`[Reel] Using default duration: ${duration}s`);
  } else {
    console.log(`[Reel] Using provided duration: ${duration}s`);
  }
  
  const finalOutputPath = input.outputPath || outputPath;
  
  console.log(`[Reel] Generating ${duration}s video from image: ${imagePath}`);
  console.log(`[Reel] Output: ${finalOutputPath}`);

  // Build FFmpeg command
  const ffmpegArgs: string[] = [
    '-loop', '1',                    // Loop the input image
    '-i', imagePath,                 // Input image
  ];

  // Add audio if provided or auto-selected
  if (audioPath) {
    console.log(`[Reel] Adding audio: ${audioPath}`);
    ffmpegArgs.push('-i', audioPath);
  }

  // Video filters and output options
  ffmpegArgs.push(
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',               // H.264 codec
    '-preset', 'faster',             // Faster preset for lower memory usage
    '-tune', 'stillimage',           // Optimize for still images
    '-crf', '23',                    // Quality (lower = better, 23 is good)
    '-pix_fmt', 'yuv420p',          // Pixel format for compatibility
    '-r', '30',                      // Frame rate
    '-t', duration.toString(),       // Duration
    '-threads', '4',                 // Limit threads to reduce memory usage
    '-max_muxing_queue_size', '1024', // Limit muxing queue size
  );

  // Audio options
  if (audioPath) {
    ffmpegArgs.push(
      '-c:a', 'aac',                 // AAC audio codec
      '-b:a', '128k',                // Audio bitrate
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

