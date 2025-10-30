// Three-part Instagram Reel generator
// Part 1: Image 1 with text overlay (2 seconds)
// Part 2: Quick fade to Image 2, stays without text (2 seconds, fade is 0.5s)
// Part 3: Image 2 with text overlay (1.5 seconds)

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { ThreePartReelInput } from '../types/index.ts';
import { wrapText } from '../utils/text.ts';
import { registerFonts } from '../utils/fonts.ts';
import { getRandomBackgroundMusicPath, getAudioDuration } from '../utils/audio.ts';

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920; // Instagram Reel dimensions (9:16)
const PART1_DURATION = 2; // Part 1: Image 1 with text
const PART2_DURATION = 2; // Part 2: Image 2 without text (with quick fade at start)
const PART3_DURATION = 1.5; // Part 3: Image 2 with text
const FADE_DURATION = 0.5; // Quick fade transition
const TOTAL_DURATION = PART1_DURATION + PART2_DURATION + PART3_DURATION; // 5.5 seconds

/**
 * Download an image from a URL
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  console.log(`[ThreePartReel] Downloading image from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const imageData = await response.arrayBuffer();
  await Deno.writeFile(outputPath, new Uint8Array(imageData));
  console.log(`[ThreePartReel] ✅ Image downloaded: ${outputPath}`);
}

/**
 * Generate a plain image scaled to reel dimensions (without text)
 */
async function generatePlainImage(
  imagePath: string,
  outputPath: string,
): Promise<void> {
  // Load the source image
  const sourceImage = await loadImage(imagePath);
  
  // Create canvas
  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Draw the image (scaled and centered to fit the reel dimensions)
  const scale = Math.max(REEL_WIDTH / sourceImage.width, REEL_HEIGHT / sourceImage.height);
  const scaledWidth = sourceImage.width * scale;
  const scaledHeight = sourceImage.height * scale;
  const x = (REEL_WIDTH - scaledWidth) / 2;
  const y = (REEL_HEIGHT - scaledHeight) / 2;
  
  ctx.drawImage(sourceImage, x, y, scaledWidth, scaledHeight);

  // Export image as JPEG with same settings as text version
  const outputBuffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);
  
  console.log(`[ThreePartReel] Plain image generated: ${outputPath}`);
}

/**
 * Generate image with text overlay
 */
async function generateImageWithText(
  imagePath: string,
  text: string,
  outputPath: string,
  position: 'center' | 'bottom' = 'center',
): Promise<void> {
  registerFonts();

  // Load the source image
  const sourceImage = await loadImage(imagePath);
  
  // Create canvas
  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Draw the image (scaled and centered to fit the reel dimensions)
  const scale = Math.max(REEL_WIDTH / sourceImage.width, REEL_HEIGHT / sourceImage.height);
  const scaledWidth = sourceImage.width * scale;
  const scaledHeight = sourceImage.height * scale;
  const x = (REEL_WIDTH - scaledWidth) / 2;
  const y = (REEL_HEIGHT - scaledHeight) / 2;
  
  ctx.drawImage(sourceImage, x, y, scaledWidth, scaledHeight);

  // Draw text overlay - Instagram style (white boxes with black text)
  const PADDING_X = 80;
  const FONT_SIZE = position === 'bottom' ? 30 : 56; // Smaller font for bottom position
  const TEXT_FONT = `bold ${FONT_SIZE}px Merriweather`;
  const BOX_PADDING_X = 40; // Horizontal padding inside each box
  const BOX_PADDING_Y = 25; // Vertical padding inside each box
  const BORDER_RADIUS = 35; // Rounded corners for bottom position (increased from 20)
  
  ctx.font = TEXT_FONT;
  const lines = wrapText(ctx, text, REEL_WIDTH - PADDING_X * 2, TEXT_FONT);
  
  if (position === 'bottom') {
    // Draw as a single rounded box near the bottom
    const LINE_HEIGHT = 40;
    const totalTextHeight = lines.length * LINE_HEIGHT;
    const BOTTOM_MARGIN = 300; // Distance from bottom of screen (moved higher)
    
    // Calculate the overall box dimensions
    let maxTextWidth = 0;
    for (const line of lines) {
      const textMetrics = ctx.measureText(line);
      maxTextWidth = Math.max(maxTextWidth, textMetrics.width);
    }
    
    const boxWidth = maxTextWidth + (BOX_PADDING_X * 1.3) * 2;
    const boxHeight = totalTextHeight + (BOX_PADDING_Y * 1.6) * 2;
    const boxX = (REEL_WIDTH - boxWidth) / 2;
    const boxY = REEL_HEIGHT - BOTTOM_MARGIN - boxHeight;
    
    // Draw single rounded white background box
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, BORDER_RADIUS);
    ctx.fill();
    
    // Draw text lines centered within the box
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    let currY = boxY + BOX_PADDING_Y + LINE_HEIGHT/2;
    for (const line of lines) {
      ctx.fillText(line, REEL_WIDTH / 2, currY);
      currY += LINE_HEIGHT;
    }
  } else {
    // Center position: individual boxes for each line
    const LINE_HEIGHT = 90; // More spacing between boxes
    const totalTextHeight = lines.length * LINE_HEIGHT;
    let currY = (REEL_HEIGHT - totalTextHeight) / 2 + FONT_SIZE;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (const line of lines) {
      // Measure text width for this line
      const textMetrics = ctx.measureText(line);
      const textWidth = textMetrics.width;
      
      // Calculate box dimensions
      const boxWidth = textWidth + BOX_PADDING_X * 2;
      const boxHeight = FONT_SIZE + BOX_PADDING_Y * 2;
      const boxX = (REEL_WIDTH - boxWidth) / 2;
      const boxY = currY - BOX_PADDING_Y;
      
      // Draw white background box for this line
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      
      // Draw black text
      ctx.fillStyle = '#000000';
      ctx.fillText(line, REEL_WIDTH / 2, currY);
      
      currY += LINE_HEIGHT;
    }
  }

  // Export image as JPEG
  const outputBuffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);
  
  console.log(`[ThreePartReel] Image with text generated: ${outputPath}`);
}

/**
 * Generate a three-part Instagram Reel
 */
export async function generateThreePartReel(
  input: ThreePartReelInput,
): Promise<void> {
  console.log('[ThreePartReel] ========================================');
  console.log('[ThreePartReel] Starting three-part reel generation...');
  console.log('[ThreePartReel] Input:', JSON.stringify(input, null, 2));
  console.log('[ThreePartReel] ========================================');
  
  const currentDir = Deno.cwd();
  
  // Download images
  const image1Path = join(currentDir, 'temp_image1.jpg');
  const image2Path = join(currentDir, 'temp_image2.jpg');
  
  console.log('[ThreePartReel] Downloading images...');
  await downloadImage(input.image1Url, image1Path);
  await downloadImage(input.image2Url, image2Path);
  
  // Generate frames with text overlays
  const frame1Path = join(currentDir, 'frame1_with_text.jpg');
  const frame2Path = join(currentDir, 'frame2_plain.jpg'); // For fade transition
  const frame3Path = join(currentDir, 'frame3_with_text.jpg');
  
  console.log('[ThreePartReel] Generating frame 1 with text (centered)...');
  await generateImageWithText(image1Path, input.text1, frame1Path, 'center');
  
  console.log('[ThreePartReel] Generating frame 2 (plain image 2 for transition)...');
  // Process image2 through canvas to ensure consistent color/lighting with frame 3
  await generatePlainImage(image2Path, frame2Path);
  
  console.log('[ThreePartReel] Generating frame 3 with text (bottom)...');
  await generateImageWithText(image2Path, input.text2, frame3Path, 'bottom');
  
  // Auto-select random background music if not provided
  console.log('[ThreePartReel] ========================================');
  console.log('[ThreePartReel] Checking for audio...');
  let audioPath: string | undefined = input.audioPath;
  if (!audioPath) {
    console.log('[ThreePartReel] No audioPath provided, selecting random music...');
    // const selectedMusicPath = await getRandomBackgroundMusicPath(currentDir);
    const selectedMusicPath = 'assets/audio/background-music-7.mp3';
    if (selectedMusicPath) {
      audioPath = selectedMusicPath;
      console.log('[ThreePartReel] ✅ Using audio:', audioPath);
    } else {
      console.log('[ThreePartReel] No background music found, generating without audio');
    }
  } else {
    // Resolve relative paths to absolute
    audioPath = audioPath.startsWith('/') 
      ? audioPath 
      : join(currentDir, audioPath);
    console.log('[ThreePartReel] Using provided audioPath:', audioPath);
  }
  console.log('[ThreePartReel] ========================================');
  
  const finalOutputPath = input.outputPath || 'three_part_reel.mp4';
  
  console.log(`[ThreePartReel] Generating ${TOTAL_DURATION}s video (Part 1: ${PART1_DURATION}s, Part 2: ${PART2_DURATION}s, Part 3: ${PART3_DURATION}s)`);
  console.log(`[ThreePartReel] Output: ${finalOutputPath}`);

  // Create three video segments
  const part1VideoPath = join(currentDir, 'part1_video.mp4');
  const part2VideoPath = join(currentDir, 'part2_video.mp4');
  const part3VideoPath = join(currentDir, 'part3_video.mp4');
  
  // Part 1: Image 1 with text (2 seconds)
  console.log(`[ThreePartReel] Creating Part 1: Image 1 with text (${PART1_DURATION}s)...`);
  const part1Args = [
    '-loop', '1',
    '-i', frame1Path,
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-t', PART1_DURATION.toString(),
    '-threads', '2',
    '-max_muxing_queue_size', '1024',
    '-an', // No audio for now
    '-y', part1VideoPath,
  ];
  
  let part1Command = new Deno.Command('ffmpeg', {
    args: part1Args,
    stdout: 'piped',
    stderr: 'piped',
  });
  
  let result = await part1Command.output();
  if (result.code !== 0) {
    const errorText = new TextDecoder().decode(result.stderr);
    console.error('[ThreePartReel] FFmpeg error creating part 1:', errorText);
    throw new Error(`FFmpeg failed creating part 1 with code ${result.code}`);
  }
  console.log(`[ThreePartReel] ✅ Part 1 video created`);
  
  // Part 2: Quick fade to Image 2, then stay (2 seconds total, 0.5s fade)
  console.log(`[ThreePartReel] Creating Part 2: Quick fade transition to Image 2 (${PART2_DURATION}s, ${FADE_DURATION}s fade)...`);
  const part2Args = [
    '-loop', '1',
    '-t', PART2_DURATION.toString(),
    '-i', image1Path,
    '-loop', '1',
    '-t', PART2_DURATION.toString(),
    '-i', frame2Path,
    '-filter_complex', 
    `[0:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v0];` +
    `[1:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v1];` +
    `[v0][v1]xfade=transition=fade:duration=${FADE_DURATION}:offset=0[outv]`,
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-threads', '2',
    '-max_muxing_queue_size', '1024',
    '-an',
    '-y', part2VideoPath,
  ];
  
  let part2Command = new Deno.Command('ffmpeg', {
    args: part2Args,
    stdout: 'piped',
    stderr: 'piped',
  });
  
  result = await part2Command.output();
  if (result.code !== 0) {
    const errorText = new TextDecoder().decode(result.stderr);
    console.error('[ThreePartReel] FFmpeg error creating part 2:', errorText);
    throw new Error(`FFmpeg failed creating part 2 with code ${result.code}`);
  }
  console.log(`[ThreePartReel] ✅ Part 2 video created`);
  
  // Part 3: Image 2 with text (1.5 seconds)
  console.log(`[ThreePartReel] Creating Part 3: Image 2 with text (${PART3_DURATION}s)...`);
  const part3Args = [
    '-loop', '1',
    '-i', frame3Path,
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-t', PART3_DURATION.toString(),
    '-threads', '2',
    '-max_muxing_queue_size', '1024',
    '-an',
    '-y', part3VideoPath,
  ];
  
  let part3Command = new Deno.Command('ffmpeg', {
    args: part3Args,
    stdout: 'piped',
    stderr: 'piped',
  });
  
  result = await part3Command.output();
  if (result.code !== 0) {
    const errorText = new TextDecoder().decode(result.stderr);
    console.error('[ThreePartReel] FFmpeg error creating part 3:', errorText);
    throw new Error(`FFmpeg failed creating part 3 with code ${result.code}`);
  }
  console.log(`[ThreePartReel] ✅ Part 3 video created`);
  
  // Concatenate all three parts
  console.log(`[ThreePartReel] Concatenating all parts...`);
  const concatFilePath = join(currentDir, 'concat_three_parts.txt');
  const concatContent = `file '${part1VideoPath}'\nfile '${part2VideoPath}'\nfile '${part3VideoPath}'`;
  await Deno.writeTextFile(concatFilePath, concatContent);
  
  // Create video without audio first
  const videoOnlyPath = join(currentDir, 'video_only.mp4');
  const concatArgs = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFilePath,
    '-c:v', 'copy',
    '-threads', '2',
    '-max_muxing_queue_size', '1024',
    '-y', videoOnlyPath,
  ];
  
  let concatCommand = new Deno.Command('ffmpeg', {
    args: concatArgs,
    stdout: 'piped',
    stderr: 'piped',
  });
  
  result = await concatCommand.output();
  if (result.code !== 0) {
    const errorText = new TextDecoder().decode(result.stderr);
    console.error('[ThreePartReel] FFmpeg error concatenating videos:', errorText);
    throw new Error(`FFmpeg failed concatenating videos with code ${result.code}`);
  }
  console.log(`[ThreePartReel] ✅ Videos concatenated`);
  
  // Add audio if available
  if (audioPath) {
    console.log(`[ThreePartReel] Adding audio: ${audioPath}`);
    const audioArgs = [
      '-i', videoOnlyPath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-shortest',
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-y', finalOutputPath,
    ];
    
    const audioCommand = new Deno.Command('ffmpeg', {
      args: audioArgs,
      stdout: 'piped',
      stderr: 'piped',
    });
    
    result = await audioCommand.output();
    if (result.code !== 0) {
      const errorText = new TextDecoder().decode(result.stderr);
      console.error('[ThreePartReel] FFmpeg error adding audio:', errorText);
      throw new Error(`FFmpeg failed adding audio with code ${result.code}`);
    }
    console.log(`[ThreePartReel] ✅ Audio added`);
  } else {
    // No audio, just rename the video
    await Deno.rename(videoOnlyPath, finalOutputPath);
  }
  
  console.log(`[ThreePartReel] ✅ Video generated successfully: ${finalOutputPath}`);
  
  // Clean up temporary files
  try {
    await Deno.remove(image1Path);
    await Deno.remove(image2Path);
    await Deno.remove(frame1Path);
    await Deno.remove(frame2Path);
    await Deno.remove(frame3Path);
    await Deno.remove(part1VideoPath);
    await Deno.remove(part2VideoPath);
    await Deno.remove(part3VideoPath);
    await Deno.remove(concatFilePath);
    if (audioPath) {
      await Deno.remove(videoOnlyPath);
    }
    console.log('[ThreePartReel] Cleaned up temporary files');
  } catch (e) {
    console.warn('[ThreePartReel] Warning: Could not clean up some temporary files:', e);
  }
}

/**
 * CLI entry point for generating three-part reels
 */
export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error(
      'Error: No input JSON provided. Pass the input as a single JSON string argument.',
    );
    Deno.exit(1);
  }

  let input: ThreePartReelInput;
  try {
    input = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }

  // Validate required fields
  if (!input.image1Url || !input.image2Url || !input.text1 || !input.text2) {
    console.error('Error: image1Url, image2Url, text1, and text2 are required in the input JSON');
    Deno.exit(1);
  }

  try {
    await generateThreePartReel(input);
    console.log('✅ Three-part reel generation completed');
  } catch (error) {
    console.error('❌ Error generating three-part reel:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

