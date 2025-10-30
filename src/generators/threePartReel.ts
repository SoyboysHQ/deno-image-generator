// Three-part Instagram Reel generator
// Part 1: Image 1 with text overlay (2 seconds)
// Part 2: Fade transition to Image 2 (2 seconds)
// Part 3: Image 2 with text overlay (2 seconds)

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { ThreePartReelInput } from '../types/index.ts';
import { wrapText } from '../utils/text.ts';
import { registerFonts } from '../utils/fonts.ts';
import { getRandomBackgroundMusicPath, getAudioDuration } from '../utils/audio.ts';

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920; // Instagram Reel dimensions (9:16)
const PART_DURATION = 2; // Each part is 2 seconds
const TOTAL_DURATION = 6; // Total duration is 6 seconds

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
 * Generate image with text overlay
 */
async function generateImageWithText(
  imagePath: string,
  text: string,
  outputPath: string,
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

  // Draw text overlay (centered, white text with semi-transparent background)
  const PADDING_X = 80;
  const FONT_SIZE = 56;
  const TEXT_FONT = `bold ${FONT_SIZE}px Merriweather`;
  const LINE_HEIGHT = 72;
  
  ctx.font = TEXT_FONT;
  const lines = wrapText(ctx, text, REEL_WIDTH - PADDING_X * 2, TEXT_FONT);
  
  // Calculate total text height
  const totalTextHeight = lines.length * LINE_HEIGHT;
  
  // Start Y position (vertically centered)
  let currY = (REEL_HEIGHT - totalTextHeight) / 2 + FONT_SIZE;
  
  // Draw semi-transparent background for text
  const bgPadding = 30;
  const bgHeight = totalTextHeight + bgPadding * 2;
  const bgY = currY - FONT_SIZE - bgPadding;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, bgY, REEL_WIDTH, bgHeight);
  
  // Draw each line of text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  for (const line of lines) {
    ctx.fillText(line, REEL_WIDTH / 2, currY);
    currY += LINE_HEIGHT;
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
  
  console.log('[ThreePartReel] Generating frame 1 with text...');
  await generateImageWithText(image1Path, input.text1, frame1Path);
  
  console.log('[ThreePartReel] Preparing frame 2 (plain image 2 for transition)...');
  // Copy image2 as-is for the transition
  const image2Data = await Deno.readFile(image2Path);
  await Deno.writeFile(frame2Path, image2Data);
  
  console.log('[ThreePartReel] Generating frame 3 with text...');
  await generateImageWithText(image2Path, input.text2, frame3Path);
  
  // Auto-select random background music if not provided
  console.log('[ThreePartReel] ========================================');
  console.log('[ThreePartReel] Checking for audio...');
  let audioPath: string | undefined = input.audioPath;
  if (!audioPath) {
    console.log('[ThreePartReel] No audioPath provided, selecting random music...');
    const selectedMusicPath = await getRandomBackgroundMusicPath(currentDir);
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
  
  console.log(`[ThreePartReel] Generating ${TOTAL_DURATION}s video (3 parts × ${PART_DURATION}s each)`);
  console.log(`[ThreePartReel] Output: ${finalOutputPath}`);

  // Create three video segments
  const part1VideoPath = join(currentDir, 'part1_video.mp4');
  const part2VideoPath = join(currentDir, 'part2_video.mp4');
  const part3VideoPath = join(currentDir, 'part3_video.mp4');
  
  // Part 1: Image 1 with text (2 seconds)
  console.log(`[ThreePartReel] Creating Part 1: Image 1 with text (${PART_DURATION}s)...`);
  const part1Args = [
    '-loop', '1',
    '-i', frame1Path,
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-t', PART_DURATION.toString(),
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
  
  // Part 2: Fade from Image 1 to Image 2 (2 seconds)
  console.log(`[ThreePartReel] Creating Part 2: Fade transition (${PART_DURATION}s)...`);
  const part2Args = [
    '-loop', '1',
    '-t', PART_DURATION.toString(),
    '-i', image1Path,
    '-loop', '1',
    '-t', PART_DURATION.toString(),
    '-i', frame2Path,
    '-filter_complex', 
    `[0:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v0];` +
    `[1:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v1];` +
    `[v0][v1]xfade=transition=fade:duration=2:offset=0[outv]`,
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
  
  // Part 3: Image 2 with text (2 seconds)
  console.log(`[ThreePartReel] Creating Part 3: Image 2 with text (${PART_DURATION}s)...`);
  const part3Args = [
    '-loop', '1',
    '-i', frame3Path,
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-t', PART_DURATION.toString(),
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

