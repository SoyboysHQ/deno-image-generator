// Two-image Instagram Reel generator
// First image: Title slide (0.5 seconds)
// Second image: List content (remaining duration)

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { TwoImageReelInput, InputItem } from '../types/index.ts';
import { parseMarkedText, wrapText, calculateItemHeights, balancedWrapText } from '../utils/text.ts';
import { drawTextWithHighlights, drawBalancedCenteredTitleWithHighlight, drawTextWithHighlightWrapped } from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';
import { getRandomBackgroundMusicPath, getAudioDuration } from '../utils/audio.ts';

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920; // Instagram Reel dimensions (9:16)
const TITLE_DURATION = 0.5; // Title slide shows for 0.5 seconds
const MIN_TOTAL_DURATION = 8; // Minimum total duration in seconds
const MIN_SECOND_IMAGE_DURATION = 7; // Minimum duration for the listicle/second image

/**
 * Split highlights that span multiple lines after text wrapping
 */
function splitHighlightsAcrossLines(
  text: string,
  highlights: Array<{ phrase: string; color: string }>,
  lines: string[],
): Array<{ phrase: string; color: string }> {
  const result: Array<{ phrase: string; color: string }> = [];
  
  for (const highlight of highlights) {
    const phrase = highlight.phrase;
    const phraseStart = text.indexOf(phrase);
    
    if (phraseStart === -1) {
      // Phrase not found in text, skip
      continue;
    }
    
    const phraseEnd = phraseStart + phrase.length;
    let charCount = 0;
    let foundInLine = false;
    
    // Check each line to see if it contains part of the highlighted phrase
    for (const line of lines) {
      const lineStart = charCount;
      const lineEnd = charCount + line.length;
      
      // Check if this line overlaps with the phrase
      if (lineStart < phraseEnd && lineEnd > phraseStart) {
        // Calculate the overlap
        const overlapStart = Math.max(0, phraseStart - lineStart);
        const overlapEnd = Math.min(line.length, phraseEnd - lineStart);
        const lineSegment = line.substring(overlapStart, overlapEnd);
        
        if (lineSegment.trim().length > 0) {
          result.push({ phrase: lineSegment, color: highlight.color });
          foundInLine = true;
        }
      }
      
      charCount += line.length + 1; // +1 for space between words
    }
    
    // If phrase wasn't found split across lines, add it as-is (it's within a single line)
    if (!foundInLine) {
      result.push(highlight);
    }
  }
  
  return result;
}

/**
 * Generate title image (similar to carousel title slide)
 */
async function generateTitleImage(
  title: string,
  outputPath: string,
): Promise<void> {
  registerFonts();

  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Load background
  const currentDir = Deno.cwd();
  const bgImage = await loadImage(join(currentDir, 'assets', 'images', 'bg-1.jpeg'));
  ctx.drawImage(bgImage, 0, 0, REEL_WIDTH, REEL_HEIGHT);

  // Parse title with highlights
  const parsed = parseMarkedText(title);
  parsed.text = parsed.text.replace('-', ' ');

  // Draw title (large, bold, with highlights)
  const titleFont = '120px "Merriweather ExtraBold"';
  const titleLineHeight = 140;
  const padding = 80;

  // Add letter-spacing (tracking) for title
  ctx.letterSpacing = '2px';
  
  // First, wrap the text to determine line breaks
  ctx.font = titleFont;
  const titleLines = wrapText(ctx, parsed.text, REEL_WIDTH - padding * 2, titleFont);
  
  // Create highlights with specific colors: first mark yellow, second orange
  const originalHighlights: Array<{ phrase: string; color: string }> = [];
  
  // Add first mark highlight (yellow)
  if (parsed.highlights[0]) {
    originalHighlights.push({ phrase: parsed.highlights[0].phrase, color: '#F0E231' });
  }
  
  // Add second mark highlight (orange)
  if (parsed.highlights[1]) {
    originalHighlights.push({ phrase: parsed.highlights[1].phrase, color: '#FFA500' });
  }
  
  // Add remaining mark highlights if any (yellow)
  for (let i = 2; i < parsed.highlights.length; i++) {
    originalHighlights.push({ phrase: parsed.highlights[i].phrase, color: '#F0E231' });
  }
  
  // Split highlights across line breaks
  const allHighlights = splitHighlightsAcrossLines(parsed.text, originalHighlights, titleLines);

  const titleY = REEL_HEIGHT / 2 - 100;
  
  drawTextWithHighlights(
    ctx,
    parsed.text,
    padding,
    titleY,
    allHighlights,
    titleFont,
    '#222',
    '#F0E231',
    REEL_WIDTH - padding * 2,
    titleLineHeight,
    'center',
  );
  
  // Reset letter-spacing
  ctx.letterSpacing = '0px';

  // Draw author/subtitle centered below title
  const author = 'by @compounding.wisdom';
  ctx.font = 'italic 28px Merriweather';
  ctx.fillStyle = '#666';
  const authorWidth = ctx.measureText(author).width;
  const authorX = (REEL_WIDTH - authorWidth) / 2; // Center horizontally
  const authorY = titleY + titleLines.length * titleLineHeight - 15; // below title
  ctx.fillText(author, authorX, authorY);

  // Save
  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
  
  console.log(`[TwoImageReel] Title image generated: ${outputPath}`);
}

/**
 * Generate list image (similar to single image generator)
 */
async function generateListImage(
  title: string,
  items: string[],
  outputPath: string,
): Promise<void> {
  registerFonts();

  // Parse title and items
  const parsedTitle = parseMarkedText(title);
  const titleText = parsedTitle.text;
  const titleHighlight = parsedTitle.highlights;

  const points: string[] = [];
  const highlights: any[] = [];
  
  for (const item of items) {
    // If multiple <mark>...</mark> in one string separated by §§§, split
    const subpoints = item.split('§§§');
    for (const sub of subpoints) {
      const parsed = parseMarkedText(sub);
      points.push(parsed.text);
      highlights.push(parsed.highlights);
    }
  }

  // Create canvas
  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Load background image
  const currentDir = Deno.cwd();
  const bg = await loadImage(join(currentDir, 'assets', 'images', 'background.jpeg'));
  ctx.drawImage(bg, 0, 0, REEL_WIDTH, REEL_HEIGHT);

  // Padding
  const PAD_X = 60;
  let currY = 140; // Increased top padding from 90 to 140

  // Title (balanced, centered, with highlight) - much larger title!
  const TITLE_FONT = 'bold 96px Merriweather';
  const TITLE_LINE_HEIGHT = 108;
  ctx.font = TITLE_FONT;
  
  // Pre-wrap title to determine line breaks for highlight handling
  const titleLines = balancedWrapText(ctx, titleText, REEL_WIDTH - PAD_X * 2, TITLE_FONT);
  
  // Convert highlights to include default color
  const titleHighlightWithColor = titleHighlight.map(h => ({ 
    phrase: h.phrase, 
    color: h.color || '#F0E231' 
  }));
  
  // Split highlights across line breaks (like we do for the first image)
  const titleHighlightProcessed = splitHighlightsAcrossLines(titleText, titleHighlightWithColor, titleLines);
  
  const titleHeight = drawBalancedCenteredTitleWithHighlight(
    ctx,
    titleText,
    PAD_X,
    currY,
    titleHighlightProcessed,
    TITLE_FONT,
    '#F0E231',
    REEL_WIDTH - PAD_X * 2,
    TITLE_LINE_HEIGHT,
  );
  currY += titleHeight - 20;

  // Author (centered, italic, smaller)
  ctx.font = 'italic 20px Merriweather';
  ctx.fillStyle = '#666';
  const author = 'by Compounding Wisdom';
  const authorWidth = ctx.measureText(author).width;
  ctx.fillText(author, (REEL_WIDTH - authorWidth) / 2, currY);
  currY += 30;

  // Divider line
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD_X, currY);
  ctx.lineTo(REEL_WIDTH - PAD_X, currY);
  ctx.stroke();
  currY += 40;

  const listStartY = currY;
  const availableHeight = REEL_HEIGHT - listStartY - 30;

  // Dynamically calculate font size based on number of items and available space
  // Start with much larger font sizes and scale down if needed
  let fontSize = 50; // Start much larger!
  let baseItemSpacing = 12; // More generous spacing
  const extraSpacing = 20;
  
  // Calculate total character count to estimate content density
  const totalChars = points.reduce((sum, p) => sum + p.length, 0);
  const avgCharsPerItem = totalChars / points.length;
  
  // Adjust base font size based on number of items - be very aggressive
  if (points.length <= 3) {
    fontSize = 56; // Very few items = very large text
  } else if (points.length <= 5) {
    fontSize = 48;
  } else if (points.length <= 7) {
    fontSize = 44;
  } else if (points.length <= 10) {
    fontSize = 38;
  } else if (points.length <= 15) {
    fontSize = 32;
  } else {
    fontSize = 28;
  }
  
  // Further adjust if items are very long
  if (avgCharsPerItem > 100) {
    fontSize -= 6;
  } else if (avgCharsPerItem > 80) {
    fontSize -= 4;
  } else if (avgCharsPerItem > 60) {
    fontSize -= 2;
  }
  
  // Ensure minimum font size
  fontSize = Math.max(fontSize, 22);
  
  let LIST_FONT = `${fontSize}px Merriweather`;
  let BASE_LINE_HEIGHT = Math.floor(fontSize * 1.4); // Reduced from 1.7 to 1.4 for tighter lines within items
  
  // Test if content fits with this font size
  ctx.font = LIST_FONT;
  const numWidth = ctx.measureText('20.').width;
  let itemHeights = calculateItemHeights(
    ctx,
    points,
    LIST_FONT,
    REEL_WIDTH - PAD_X * 2 - numWidth - 12,
  );
  
  let totalLines = itemHeights.reduce((sum, h) => sum + h, 0);
  let estimatedHeight = totalLines * BASE_LINE_HEIGHT + points.length * baseItemSpacing + extraSpacing;
  
  // If content doesn't fit, reduce font size and recalculate
  while (estimatedHeight > availableHeight && fontSize > 20) {
    fontSize -= 2;
    LIST_FONT = `${fontSize}px Merriweather`;
    BASE_LINE_HEIGHT = Math.floor(fontSize * 1.4); // Tighter line spacing
    ctx.font = LIST_FONT;
    
    itemHeights = calculateItemHeights(
      ctx,
      points,
      LIST_FONT,
      REEL_WIDTH - PAD_X * 2 - numWidth - 12,
    );
    
    totalLines = itemHeights.reduce((sum, h) => sum + h, 0);
    estimatedHeight = totalLines * BASE_LINE_HEIGHT + points.length * baseItemSpacing + extraSpacing;
  }

  // Make spacing proportional to font size for larger items - generous space between bullets
  baseItemSpacing = Math.floor(fontSize * 1.2); // Increased from 0.5 to 0.7 (70% of font size)
  baseItemSpacing = Math.max(24, baseItemSpacing); // Increased minimum from 18px to 24px
  
  // Dynamically adjust line height if content is still too tall
  let LIST_LINE_HEIGHT = BASE_LINE_HEIGHT;
  let itemSpacing = baseItemSpacing;

  if (estimatedHeight > availableHeight) {
    const targetHeight = availableHeight - points.length * itemSpacing - extraSpacing;
    LIST_LINE_HEIGHT = Math.floor(targetHeight / totalLines);
    const minLineHeight = Math.floor(fontSize * 1.3); // Reduced from 1.5 to match tighter spacing
    if (LIST_LINE_HEIGHT < minLineHeight) {
      LIST_LINE_HEIGHT = minLineHeight;
      itemSpacing = Math.max(0, Math.floor((availableHeight - totalLines * LIST_LINE_HEIGHT - extraSpacing) / points.length));
    }
  }
  
  console.log(`[TwoImageReel] List font size: ${fontSize}px, line height: ${LIST_LINE_HEIGHT}px, spacing: ${itemSpacing}px, items: ${points.length}`);

  // Calculate total height for vertical centering (slightly biased towards top)
  const totalContentHeight = totalLines * LIST_LINE_HEIGHT + (points.length - 1) * itemSpacing;
  const verticalCenterOffset = Math.floor((availableHeight - totalContentHeight) / 2);
  // Use 60% of the center offset to bias towards top (40% from top, 60% from bottom)
  const topBiasedOffset = Math.floor(verticalCenterOffset * 0.6);
  currY = listStartY + Math.max(0, topBiasedOffset);
  
  // List (no highlights on list items)
  const itemCount = Math.min(20, points.length);
  for (let i = 0; i < itemCount; ++i) {
    ctx.font = LIST_FONT;
    ctx.fillStyle = '#222';
    const numStr = i + 1 + '.';
    const numWidth = ctx.measureText(numStr).width;
    ctx.fillText(numStr, PAD_X, currY + 26);
    
    // Draw text without highlights (empty array)
    const usedHeight = drawTextWithHighlightWrapped(
      ctx,
      points[i],
      PAD_X + numWidth + 12,
      currY + 26,
      [], // No highlights
      LIST_FONT,
      '#F0E231',
      REEL_WIDTH - PAD_X * 2 - numWidth - 12,
      LIST_LINE_HEIGHT,
    );
    
    currY += usedHeight + itemSpacing;
  }

  // Export image as JPEG
  const outputBuffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);
  
  console.log(`[TwoImageReel] List image generated: ${outputPath}`);
}

/**
 * Generate a two-image Instagram Reel
 */
export async function generateTwoImageReel(
  input: TwoImageReelInput,
): Promise<void> {
  console.log('[TwoImageReel] ========================================');
  console.log('[TwoImageReel] Starting two-image reel generation...');
  console.log('[TwoImageReel] Input:', JSON.stringify(input, null, 2));
  console.log('[TwoImageReel] ========================================');
  
  const currentDir = Deno.cwd();
  
  // Generate both images
  const titleImagePath = join(currentDir, 'title_image_temp.jpg');
  const listImagePath = join(currentDir, 'list_image_temp.jpg');
  
  console.log('[TwoImageReel] Generating title image...');
  await generateTitleImage(input.title, titleImagePath);
  
  console.log('[TwoImageReel] Generating list image...');
  await generateListImage(input.title, input.items, listImagePath);
  
  // Auto-select random background music if not provided
  console.log('[TwoImageReel] ========================================');
  console.log('[TwoImageReel] Checking for audio...');
  let audioPath: string | undefined = input.audioPath;
  if (!audioPath) {
    console.log('[TwoImageReel] No audioPath provided, selecting random music...');
    const selectedMusicPath = await getRandomBackgroundMusicPath(currentDir);
    if (selectedMusicPath) {
      audioPath = selectedMusicPath;
      console.log('[TwoImageReel] ✅ Using audio:', audioPath);
    } else {
      console.log('[TwoImageReel] No background music found, generating without audio');
    }
  } else {
    // Resolve relative paths to absolute
    audioPath = audioPath.startsWith('/') 
      ? audioPath 
      : join(currentDir, audioPath);
    console.log('[TwoImageReel] Using provided audioPath:', audioPath);
  }
  console.log('[TwoImageReel] ========================================');
  
  // Determine duration: use provided duration, or if not provided and audio exists, use audio duration
  let duration = input.duration;
  if (!duration && audioPath) {
    console.log('[TwoImageReel] No duration provided, getting audio file duration...');
    const audioDuration = await getAudioDuration(audioPath);
    if (audioDuration) {
      duration = audioDuration;
      console.log(`[TwoImageReel] ✅ Using audio file duration: ${duration.toFixed(2)}s`);
    } else {
      duration = MIN_TOTAL_DURATION; // Default duration
      console.log(`[TwoImageReel] ⚠️  Could not determine audio duration, using default: ${duration}s`);
    }
  } else if (!duration) {
    duration = MIN_TOTAL_DURATION;
    console.log(`[TwoImageReel] Using default duration: ${duration}s`);
  } else {
    console.log(`[TwoImageReel] Using provided duration: ${duration}s`);
  }
  
  // Ensure minimum duration so the second image shows long enough
  if (duration < MIN_TOTAL_DURATION) {
    console.log(`[TwoImageReel] ⚠️  Duration ${duration}s is too short, using minimum: ${MIN_TOTAL_DURATION}s`);
    duration = MIN_TOTAL_DURATION;
  }
  
  // Ensure the second image shows for at least MIN_SECOND_IMAGE_DURATION
  let secondImageDuration = duration - TITLE_DURATION;
  if (secondImageDuration < MIN_SECOND_IMAGE_DURATION) {
    duration = MIN_SECOND_IMAGE_DURATION + TITLE_DURATION;
    secondImageDuration = MIN_SECOND_IMAGE_DURATION;
    console.log(`[TwoImageReel] ⚠️  Adjusted duration to ${duration}s to ensure second image shows for at least ${MIN_SECOND_IMAGE_DURATION}s`);
  }
  
  const finalOutputPath = input.outputPath || 'two_image_reel.mp4';
  
  console.log(`[TwoImageReel] Generating ${duration}s video (${TITLE_DURATION}s title + ${secondImageDuration.toFixed(2)}s list)`);
  console.log(`[TwoImageReel] Output: ${finalOutputPath}`);

  // Create two separate video segments and concatenate them
  const titleVideoPath = join(currentDir, 'title_video_temp.mp4');
  const listVideoPath = join(currentDir, 'list_video_temp.mp4');
  
  // Step 1: Create title video (0.5 seconds)
  console.log(`[TwoImageReel] Step 1: Creating title video (${TITLE_DURATION}s)...`);
  const titleArgs = [
    '-loop', '1',
    '-i', titleImagePath,
  ];
  
  // Add silent audio if we have audio for the list video (for stream matching)
  if (audioPath) {
    titleArgs.push(
      '-f', 'lavfi',
      '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    );
  }
  
  titleArgs.push(
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',  // Use ultrafast for lower memory usage
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-t', TITLE_DURATION.toString(),
    '-threads', '2',  // Reduce thread count for memory-constrained environments
    '-max_muxing_queue_size', '1024',  // Limit muxing queue size
  );
  
  // Add audio encoding if we have audio (silent audio for title)
  if (audioPath) {
    titleArgs.push(
      '-c:a', 'aac',
      '-b:a', '128k',
      '-shortest',
    );
  } else {
    titleArgs.push('-an');
  }
  
  titleArgs.push('-y', titleVideoPath);
  
  const titleCommand = new Deno.Command('ffmpeg', {
    args: titleArgs,
    stdout: 'piped',
    stderr: 'piped',
  });
  
  const titleResult = await titleCommand.output();
  if (titleResult.code !== 0) {
    const errorText = new TextDecoder().decode(titleResult.stderr);
    console.error('[TwoImageReel] FFmpeg error creating title video:', errorText);
    throw new Error(`FFmpeg failed creating title video with code ${titleResult.code}`);
  }
  console.log(`[TwoImageReel] ✅ Title video created: ${titleVideoPath}`);
  
  // Step 2: Create list video (remaining duration)
  console.log(`[TwoImageReel] Step 2: Creating list video (${secondImageDuration.toFixed(2)}s)...`);
  const listArgs = [
    '-loop', '1',
    '-i', listImagePath,
  ];
  
  // Add audio if available
  if (audioPath) {
    listArgs.push('-i', audioPath);
    // Start audio at 0.5 seconds (skip the title duration)
    listArgs.push('-ss', TITLE_DURATION.toString());
  }
  
  listArgs.push(
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',  // Use ultrafast for lower memory usage
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-t', secondImageDuration.toString(),
    '-threads', '2',  // Reduce thread count for memory-constrained environments
    '-max_muxing_queue_size', '1024',  // Limit muxing queue size
  );
  
  if (audioPath) {
    listArgs.push(
      '-c:a', 'aac',
      '-b:a', '128k',
      '-shortest',
    );
  } else {
    listArgs.push('-an');
  }
  
  listArgs.push('-y', listVideoPath);
  
  const listCommand = new Deno.Command('ffmpeg', {
    args: listArgs,
    stdout: 'piped',
    stderr: 'piped',
  });
  
  const listResult = await listCommand.output();
  if (listResult.code !== 0) {
    const errorText = new TextDecoder().decode(listResult.stderr);
    console.error('[TwoImageReel] FFmpeg error creating list video:', errorText);
    throw new Error(`FFmpeg failed creating list video with code ${listResult.code}`);
  }
  console.log(`[TwoImageReel] ✅ List video created: ${listVideoPath}`);
  
  // Step 3: Concatenate the two videos
  console.log(`[TwoImageReel] Step 3: Concatenating videos...`);
  const concatFilePath = join(currentDir, 'concat_list.txt');
  const concatContent = `file '${titleVideoPath}'\nfile '${listVideoPath}'`;
  await Deno.writeTextFile(concatFilePath, concatContent);
  
  const concatArgs = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFilePath,
    '-c:v', 'copy',  // Use copy codec to avoid re-encoding (much lower memory usage)
    '-threads', '2',  // Limit threads for memory-constrained environments
    '-max_muxing_queue_size', '1024',  // Limit muxing queue size
  ];
  
  // Add audio codec - use copy if we have audio
  if (audioPath) {
    concatArgs.push('-c:a', 'copy');  // Copy audio instead of re-encoding
  }
  
  concatArgs.push('-y', finalOutputPath);
  
  const concatCommand = new Deno.Command('ffmpeg', {
    args: concatArgs,
    stdout: 'piped',
    stderr: 'piped',
  });
  
  const concatResult = await concatCommand.output();
  if (concatResult.code !== 0) {
    const errorText = new TextDecoder().decode(concatResult.stderr);
    console.error('[TwoImageReel] FFmpeg error concatenating videos:', errorText);
    throw new Error(`FFmpeg failed concatenating videos with code ${concatResult.code}`);
  }
  
  console.log(`[TwoImageReel] ✅ Video generated successfully: ${finalOutputPath}`);
  
  // Clean up temporary files
  try {
    await Deno.remove(titleImagePath);
    await Deno.remove(listImagePath);
    await Deno.remove(titleVideoPath);
    await Deno.remove(listVideoPath);
    await Deno.remove(concatFilePath);
    console.log('[TwoImageReel] Cleaned up temporary files');
  } catch (e) {
    console.warn('[TwoImageReel] Warning: Could not clean up some temporary files:', e);
  }
}

/**
 * CLI entry point for generating two-image reels
 */
export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error(
      'Error: No input JSON provided. Pass the input as a single JSON string argument.',
    );
    Deno.exit(1);
  }

  let input: TwoImageReelInput;
  try {
    input = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }

  // Validate required fields
  if (!input.title || !input.items || !Array.isArray(input.items)) {
    console.error('Error: title (string) and items (array) are required in the input JSON');
    Deno.exit(1);
  }

  try {
    await generateTwoImageReel(input);
    console.log('✅ Two-image reel generation completed');
  } catch (error) {
    console.error('❌ Error generating two-image reel:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

