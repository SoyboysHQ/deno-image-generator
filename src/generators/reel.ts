// Instagram Reel generator - Creates a video from a static image with background music

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import type { ReelInput } from '../types/index.ts';

const DEFAULT_DURATION = 5; // 5 seconds
const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920; // Instagram Reel dimensions (9:16)

/**
 * Generate an Instagram Reel from an image with optional background music
 */
export async function generateReel(
  input: ReelInput,
  outputPath: string = 'instagram_reel.mp4',
): Promise<void> {
  const duration = input.duration || DEFAULT_DURATION;
  const currentDir = Deno.cwd();
  
  // Resolve paths
  const imagePath = input.imagePath.startsWith('/') 
    ? input.imagePath 
    : join(currentDir, input.imagePath);
  
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
  if (!input.imagePath) {
    console.error('Error: imagePath is required in the input JSON');
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

