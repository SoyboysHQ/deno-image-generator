// Book Reveal Reel generator (Video + Image)
// Part 1: Video (5s total)
//   - 0-1s: Video only
//   - 1-3s: Video + hookText (center, white rounded box)
//   - 3-5s: Video + hookText + hookText2 (both center, second below first)
// Part 2: Image (4s total)
//   - 5-5.2s: Slide transition from video to image (0.2s)
//   - 5.2-6.2s: Plain image only (1s delay)
//   - 6.2-9s: Image + ctaText (top, white rounded box) (2.8s)
// Total: 9 seconds

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { BookRevealReelInput } from '../types/index.ts';
import { wrapText } from '../utils/text.ts';
import { registerFonts } from '../utils/fonts.ts';

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920;

// Part 1 timings
const PART1_VIDEO_ONLY = 1.0;      // 0-1s: Video only
const PART1_HOOK1_START = 1.0;     // hookText appears at 1s
const PART1_HOOK1_DURATION = 2.0;   // hookText stays for 2s (1-3s)
const PART1_HOOK2_START = 3.0;     // hookText2 appears at 3s
const PART1_HOOK2_DURATION = 2.0;   // hookText2 stays for 2s (3-5s)
const PART1_DURATION = 5.0;         // Total Part 1: 5s

// Part 2 timings
const PART2_FADE_DURATION = 0.2;    // Slide transition: 0.2s (200ms) (5-5.2s)
const PART2_IMAGE_DELAY = 1.0;       // Plain image shown for 1s before CTA (5.2-6.2s)
const PART2_CTA_START = 6.2;        // CTA appears at 6.2s (after 1s delay)
const PART2_CTA_DURATION = 2.8;     // CTA stays for 2.8s (6.2-9s)
const PART2_DURATION = 4.0;          // Total Part 2: 4s (0.2s slide + 1s delay + 2.8s CTA)
const TOTAL_DURATION = 9.0;          // Total video duration: 9s

async function downloadImage(url: string, outputPath: string): Promise<void> {
  console.log(`[BookReveal] Downloading image from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const imageData = await response.arrayBuffer();
  await Deno.writeFile(outputPath, new Uint8Array(imageData));
  console.log(`[BookReveal] ✅ Image downloaded: ${outputPath}`);
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  console.log(`[BookReveal] Downloading video from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  const videoData = await response.arrayBuffer();
  await Deno.writeFile(outputPath, new Uint8Array(videoData));
  console.log(`[BookReveal] ✅ Video downloaded: ${outputPath}`);
}

// Generate text overlay (white rounded box, black font)
async function generateTextOverlay(
  text: string | string[],
  outputPath: string,
  position: 'center' | 'bottom' = 'center',
): Promise<void> {
  registerFonts();
  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, REEL_WIDTH, REEL_HEIGHT);

  const PADDING_X = 80;
  const FONT_SIZE = position === 'bottom' ? 30 : 56;
  const TEXT_FONT = `bold ${FONT_SIZE}px Merriweather, "Noto Emoji", Emoji, sans-serif`;
  const BOX_PADDING_X = 40;
  const BOX_PADDING_Y = 25;
  const BORDER_RADIUS = 60;

  ctx.font = TEXT_FONT;
  const texts = Array.isArray(text) ? text : [text];
  const allLines: string[][] = texts.map(t => wrapText(ctx, t, REEL_WIDTH - PADDING_X * 2, TEXT_FONT));

  if (position === 'bottom') {
    // Bottom position: single box at bottom
    const lines = allLines[0];
    const LINE_HEIGHT = 40;
    const totalTextHeight = lines.length * LINE_HEIGHT;
    const BOTTOM_MARGIN = 300;

    let maxTextWidth = 0;
    for (const line of lines) {
      const m = ctx.measureText(line);
      maxTextWidth = Math.max(maxTextWidth, m.width);
    }

    const boxWidth = maxTextWidth + (BOX_PADDING_X * 1.3) * 2;
    const boxHeight = totalTextHeight + (BOX_PADDING_Y * 1.6) * 2;
    const boxX = (REEL_WIDTH - boxWidth) / 2;
    const boxY = REEL_HEIGHT - BOTTOM_MARGIN - boxHeight;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, BORDER_RADIUS);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    let currY = boxY + BOX_PADDING_Y + LINE_HEIGHT / 2;
    for (const line of lines) {
      ctx.fillText(line, REEL_WIDTH / 2, currY);
      currY += LINE_HEIGHT;
    }
  } else {
    // Center position: individual boxes for each line, support multiple texts
    const LINE_HEIGHT = 90;
    const INTER_TEXT_SPACING = 80;
    let totalLines = 0;
    for (const lines of allLines) totalLines += lines.length;
    const totalTextHeight = totalLines * LINE_HEIGHT + (allLines.length - 1) * INTER_TEXT_SPACING;
    let currY = (REEL_HEIGHT - totalTextHeight) / 2 + FONT_SIZE;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let idx = 0; idx < allLines.length; idx++) {
      const lines = allLines[idx];
      for (const line of lines) {
        const m = ctx.measureText(line);
        const textWidth = m.width;
        const boxWidth = textWidth + BOX_PADDING_X * 2;
        const boxHeight = FONT_SIZE + BOX_PADDING_Y * 2;
        const boxX = (REEL_WIDTH - boxWidth) / 2;
        const boxY = currY - BOX_PADDING_Y;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, BORDER_RADIUS);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.fillText(line, REEL_WIDTH / 2, currY);
        currY += LINE_HEIGHT;
      }
      if (idx < allLines.length - 1) currY += INTER_TEXT_SPACING;
    }
  }

  const buff = canvas.toBuffer('image/png');
  await Deno.writeFile(outputPath, buff);
  console.log(`[BookReveal] Text overlay generated: ${outputPath}`);
}

// Generate plain image (scaled to reel dimensions)
async function generatePlainImage(imagePath: string, outputPath: string): Promise<void> {
  const sourceImage = await loadImage(imagePath);
  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  const scale = Math.max(REEL_WIDTH / sourceImage.width, REEL_HEIGHT / sourceImage.height);
  const scaledWidth = sourceImage.width * scale;
  const scaledHeight = sourceImage.height * scale;
  const x = (REEL_WIDTH - scaledWidth) / 2;
  const y = (REEL_HEIGHT - scaledHeight) / 2;
  ctx.drawImage(sourceImage, x, y, scaledWidth, scaledHeight);

  const outputBuffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);
  console.log(`[BookReveal] Plain image generated: ${outputPath}`);
}

// Generate image with CTA text at bottom
async function generateImageWithCTA(imagePath: string, ctaText: string, outputPath: string): Promise<void> {
  const sourceImage = await loadImage(imagePath);
  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Draw image
  const scale = Math.max(REEL_WIDTH / sourceImage.width, REEL_HEIGHT / sourceImage.height);
  const scaledWidth = sourceImage.width * scale;
  const scaledHeight = sourceImage.height * scale;
  const x = (REEL_WIDTH - scaledWidth) / 2;
  const y = (REEL_HEIGHT - scaledHeight) / 2;
  ctx.drawImage(sourceImage, x, y, scaledWidth, scaledHeight);

  // Draw CTA text - bigger and vertically centered
  registerFonts();
  const PADDING_X = 80;
  const FONT_SIZE = 48; // Increased from 30 to 48
  const TEXT_FONT = `bold ${FONT_SIZE}px Merriweather, "Noto Emoji", Emoji, sans-serif`;
  const BOX_PADDING_X = 50;
  const BOX_PADDING_Y = 35;
  const BORDER_RADIUS = 60;
  const LINE_HEIGHT = 60; // Increased to match larger font
  const TOP_MARGIN = 200; // Position CTA at top above the book

  ctx.font = TEXT_FONT;
  const lines = wrapText(ctx, ctaText, REEL_WIDTH - PADDING_X * 2, TEXT_FONT);

  let maxTextWidth = 0;
  for (const line of lines) {
    const m = ctx.measureText(line);
    maxTextWidth = Math.max(maxTextWidth, m.width);
  }

  const boxWidth = maxTextWidth + (BOX_PADDING_X * 1.3) * 2;
  const totalTextHeight = lines.length * LINE_HEIGHT;
  const boxHeight = totalTextHeight + (BOX_PADDING_Y * 1.6) * 2;
  const boxX = (REEL_WIDTH - boxWidth) / 2;
  const boxY = TOP_MARGIN; // Position at top

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, BORDER_RADIUS);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top'; // Use 'top' for more predictable positioning

  // Calculate starting Y position to center all lines vertically within the box
  const totalLinesHeight = (lines.length - 1) * LINE_HEIGHT; // Height between first and last line
  const boxCenterY = boxY + boxHeight / 2;
  const startY = boxCenterY - (totalLinesHeight / 2);

  let currY = startY;
  for (const line of lines) {
    ctx.fillText(line, REEL_WIDTH / 2, currY);
    currY += LINE_HEIGHT;
  }

  const outputBuffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);
  console.log(`[BookReveal] Image with CTA generated: ${outputPath}`);
}

export async function generateBookRevealReel(input: BookRevealReelInput): Promise<void> {
  console.log('[BookReveal] ========================================');
  console.log('[BookReveal] Starting book-reveal reel generation...');
  console.log('[BookReveal] Input:', JSON.stringify(input, null, 2));
  console.log('[BookReveal] ========================================');

  const currentDir = Deno.cwd();
  const videoPath = join(currentDir, 'br_video.mp4');
  const imagePath = join(currentDir, 'br_image.jpg');

  await downloadVideo(input.videoUrl, videoPath);
  await downloadImage(input.imageUrl, imagePath);

  // Generate text overlays for Part 1
  const overlayHook1Path = join(currentDir, 'br_hook1.png'); // hookText only
  const overlayHook2Path = join(currentDir, 'br_hook2.png'); // hookText2 only
  const overlayBothPath = join(currentDir, 'br_both.png');   // Both hooks
  await generateTextOverlay(input.hookText, overlayHook1Path, 'center');
  await generateTextOverlay(input.hookText2, overlayHook2Path, 'center');
  await generateTextOverlay([input.hookText, input.hookText2], overlayBothPath, 'center');

  // Generate image frames for Part 2
  const imagePlainPath = join(currentDir, 'br_image_plain.jpg');
  const imageCTAPath = join(currentDir, 'br_image_cta.jpg');
  await generatePlainImage(imagePath, imagePlainPath);
  await generateImageWithCTA(imagePath, input.ctaText, imageCTAPath);

  // Part 1: Video with text overlays (5 seconds)
  // Segment 1: 0-1s - Video only
  const part1Seg1Path = join(currentDir, 'br_p1_seg1.mp4');
  {
    const args = [
      '-i', videoPath,
      '-t', PART1_VIDEO_ONLY.toString(),
      '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-an', // No audio
      '-y', part1Seg1Path,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 seg1:', err);
      throw new Error(`FFmpeg failed part1 seg1: code ${res.code}`);
    }
  }

  // Segment 2: 1-3s - Video + hookText
  // First extract the exact video segment, then overlay text
  const part1Seg2VideoPath = join(currentDir, 'br_p1_seg2_video.mp4');
  {
    const args = [
      '-ss', PART1_HOOK1_START.toString(),
      '-i', videoPath,
      '-t', PART1_HOOK1_DURATION.toString(), // Exactly 2 seconds
      '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-an',
      '-y', part1Seg2VideoPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 seg2 video extract:', err);
      throw new Error(`FFmpeg failed part1 seg2 video extract: code ${res.code}`);
    }
  }

  const part1Seg2Path = join(currentDir, 'br_p1_seg2.mp4');
  {
    const args = [
      '-i', part1Seg2VideoPath,
      '-loop', '1',
      '-framerate', '30',
      '-t', PART1_HOOK1_DURATION.toString(),
      '-i', overlayHook1Path,
      '-filter_complex',
      `[0:v]fps=30,setpts=PTS-STARTPTS[v0];` +
      `[v0][1:v]overlay=0:0[outv]`,
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-t', PART1_HOOK1_DURATION.toString(),
      '-an',
      '-y', part1Seg2Path,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 seg2:', err);
      throw new Error(`FFmpeg failed part1 seg2: code ${res.code}`);
    }
    await Deno.remove(part1Seg2VideoPath);
  }

  // Segment 3: 3-5s - Video + both hooks
  // First extract the exact video segment, then overlay text
  const part1Seg3VideoPath = join(currentDir, 'br_p1_seg3_video.mp4');
  {
    const args = [
      '-ss', PART1_HOOK2_START.toString(),
      '-i', videoPath,
      '-t', PART1_HOOK2_DURATION.toString(), // Exactly 2 seconds
      '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-an',
      '-y', part1Seg3VideoPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 seg3 video extract:', err);
      throw new Error(`FFmpeg failed part1 seg3 video extract: code ${res.code}`);
    }
  }

  const part1Seg3Path = join(currentDir, 'br_p1_seg3.mp4');
  {
    const args = [
      '-i', part1Seg3VideoPath,
      '-loop', '1',
      '-framerate', '30',
      '-t', PART1_HOOK2_DURATION.toString(),
      '-i', overlayBothPath,
      '-filter_complex',
      `[0:v]fps=30,setpts=PTS-STARTPTS[v0];` +
      `[v0][1:v]overlay=0:0[outv]`,
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-t', PART1_HOOK2_DURATION.toString(),
      '-an',
      '-y', part1Seg3Path,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 seg3:', err);
      throw new Error(`FFmpeg failed part1 seg3: code ${res.code}`);
    }
    await Deno.remove(part1Seg3VideoPath);
  }

  // Concatenate Part 1 segments
  const part1Path = join(currentDir, 'br_part1.mp4');
  {
    const listPath = join(currentDir, 'br_p1_concat.txt');
    await Deno.writeTextFile(listPath,
      `file '${part1Seg1Path}'\nfile '${part1Seg2Path}'\nfile '${part1Seg3Path}'`);
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c:v', 'copy',
      '-an', // No audio
      '-y', part1Path,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error concat part1:', err);
      throw new Error(`FFmpeg failed concat part1: code ${res.code}`);
    }
    await Deno.remove(listPath);
    await Deno.remove(part1Seg1Path);
    await Deno.remove(part1Seg2Path);
    await Deno.remove(part1Seg3Path);
  }

  // Part 2: Image with slide transition, delay, and CTA
  // Create image videos for Part 2
  const part2Image1Path = join(currentDir, 'br_p2_img1.mp4'); // Plain image (for slide transition)
  const part2ImageDelayPath = join(currentDir, 'br_p2_img_delay.mp4'); // Plain image (for 1s delay)
  const part2Image2Path = join(currentDir, 'br_p2_img2.mp4'); // Image with CTA (appears after delay)
  {
    // Image video 1: Plain image (0.2s for slide transition)
    const args = [
      '-loop', '1',
      '-framerate', '30',
      '-t', PART2_FADE_DURATION.toString(),
      '-i', imagePlainPath,
      '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-an',
      '-y', part2Image1Path,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part2 image1:', err);
      throw new Error(`FFmpeg failed part2 image1: code ${res.code}`);
    }
  }

  {
    // Image video delay: Plain image (1s delay before CTA appears)
    const args = [
      '-loop', '1',
      '-framerate', '30',
      '-t', PART2_IMAGE_DELAY.toString(),
      '-i', imagePlainPath,
      '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-an',
      '-y', part2ImageDelayPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part2 image delay:', err);
      throw new Error(`FFmpeg failed part2 image delay: code ${res.code}`);
    }
  }

  {
    // Image video 2: Image with CTA (2.8s - appears after 1s delay at 6.2s)
    const args = [
      '-loop', '1',
      '-framerate', '30',
      '-t', PART2_CTA_DURATION.toString(),
      '-i', imageCTAPath,
      '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-an',
      '-y', part2Image2Path,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part2 image2:', err);
      throw new Error(`FFmpeg failed part2 image2: code ${res.code}`);
    }
  }

  // Extract last 0.2s of Part 1 for slide transition
  const part1Last1sPath = join(currentDir, 'br_p1_last1s.mp4');
  {
    const args = [
      '-ss', (PART1_DURATION - PART2_FADE_DURATION).toString(), // Start at 4.8s (last 0.2s of 5s video)
      '-i', part1Path,
      '-t', PART2_FADE_DURATION.toString(),
      '-vf', `fps=30`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-an',
      '-y', part1Last1sPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 last 1s:', err);
      throw new Error(`FFmpeg failed part1 last 1s: code ${res.code}`);
    }
  }

  // Create slide transition: image slides in from right, pushing video to left
  // Use a wider canvas (3x width) to accommodate both videos sliding
  const part2SlidePath = join(currentDir, 'br_p2_slide.mp4');
  {
    const canvasWidth = REEL_WIDTH * 3; // Wide enough for both videos to slide
    const args = [
      '-f', 'lavfi',
      '-i', `color=c=black:s=${canvasWidth}x${REEL_HEIGHT}:d=${PART2_FADE_DURATION}`,
      '-i', part1Last1sPath,
      '-i', part2Image1Path,
      '-filter_complex',
      `[1:v]fps=30,setpts=PTS-STARTPTS[v0];` +
      `[2:v]fps=30,setpts=PTS-STARTPTS[v1];` +
      // Video starts at x=REEL_WIDTH (center), slides left to x=0
      `[0:v][v0]overlay=x='${REEL_WIDTH}*(1-t/${PART2_FADE_DURATION})':y=0[v0pos];` +
      // Image starts at x=2*REEL_WIDTH (off-screen right), slides to x=REEL_WIDTH (center)
      `[v0pos][v1]overlay=x='${REEL_WIDTH}*(2-t/${PART2_FADE_DURATION})':y=0[full];` +
      // Crop the center portion (x=REEL_WIDTH to x=2*REEL_WIDTH) - this shows the transition
      // At start: shows video at center, at end: shows image at center
      `[full]crop=${REEL_WIDTH}:${REEL_HEIGHT}:${REEL_WIDTH}:0[outv]`,
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-t', PART2_FADE_DURATION.toString(),
      '-an',
      '-y', part2SlidePath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part2 slide:', err);
      throw new Error(`FFmpeg failed part2 slide: code ${res.code}`);
    }
    await Deno.remove(part1Last1sPath);
  }

  // Trim Part 1 to remove last 0.2s (since we use it for slide)
  const part1TrimmedPath = join(currentDir, 'br_part1_trimmed.mp4');
  {
    const args = [
      '-i', part1Path,
      '-t', (PART1_DURATION - PART2_FADE_DURATION).toString(), // 4.8s (remove last 0.2s)
      '-c:v', 'copy',
      '-an',
      '-y', part1TrimmedPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error trim part1:', err);
      throw new Error(`FFmpeg failed trim part1: code ${res.code}`);
    }
  }

  // Concatenate all parts (re-encode to ensure compatibility) - video only first
  const videoOnlyPath = join(currentDir, 'br_video_only.mp4');
  {
    const listPath = join(currentDir, 'br_final_concat.txt');
    await Deno.writeTextFile(listPath,
      `file '${part1TrimmedPath}'\nfile '${part2SlidePath}'\nfile '${part2ImageDelayPath}'\nfile '${part2Image2Path}'`);
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr',
      '-an', // No audio
      '-y', videoOnlyPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error final concat:', err);
      throw new Error(`FFmpeg failed final concat: code ${res.code}`);
    }
    await Deno.remove(listPath);
  }

  // Add audio (use provided audioPath or default to background-music-7.mp3)
  const finalOutputPath = input.outputPath || 'book_reveal_reel.mp4';
  let audioPath: string | undefined = input.audioPath;
  
  if (!audioPath) {
    // Use default background music
    audioPath = join(currentDir, 'assets', 'audio', 'background-music-7.mp3');
    console.log(`[BookReveal] No audioPath provided, using default: ${audioPath}`);
  } else {
    console.log(`[BookReveal] Using provided audioPath: ${audioPath}`);
  }
  
  // Check if audio file exists, or download if it's a URL
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
    const audioDownloadPath = join(currentDir, 'br_audio.mp3');
    console.log(`[BookReveal] Downloading audio from: ${audioPath}`);
    const response = await fetch(audioPath);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`);
    }
    const audioData = await response.arrayBuffer();
    await Deno.writeFile(audioDownloadPath, new Uint8Array(audioData));
    audioPath = audioDownloadPath;
    console.log(`[BookReveal] ✅ Audio downloaded: ${audioPath}`);
  } else if (!audioPath.startsWith('/')) {
    // Relative path, make it absolute
    audioPath = join(currentDir, audioPath);
  }
  
  // Check if audio file exists
  try {
    await Deno.stat(audioPath);
    console.log(`[BookReveal] ✅ Audio file found: ${audioPath}`);
  } catch {
    console.warn(`[BookReveal] ⚠️  Audio file not found: ${audioPath}, generating without audio`);
    audioPath = undefined;
  }
  
  if (audioPath) {

    // Add audio with looping to fill 9 seconds
    // Use stream_loop to loop audio, similar to threePartReel but with looping
    const args = [
      '-i', videoOnlyPath,
      '-stream_loop', '-1', // Loop audio indefinitely
      '-i', audioPath,
      '-c:v', 'copy', // Copy video stream
      '-c:a', 'aac', // Encode audio as AAC
      '-b:a', '128k', // Audio bitrate
      '-shortest', // Stop when shortest stream ends (video = 9s)
      '-y', finalOutputPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error adding audio:', err);
      throw new Error(`FFmpeg failed adding audio: code ${res.code}`);
    }
    console.log(`[BookReveal] ✅ Audio added and looped`);
    await Deno.remove(videoOnlyPath);
  } else {
    // No audio, just rename the video
    await Deno.rename(videoOnlyPath, finalOutputPath);
  }

  console.log(`[BookReveal] ✅ Video generated successfully: ${finalOutputPath}`);

  // Cleanup
  try {
    await Deno.remove(videoPath);
    await Deno.remove(imagePath);
    await Deno.remove(overlayHook1Path);
    await Deno.remove(overlayHook2Path);
    await Deno.remove(overlayBothPath);
    await Deno.remove(imagePlainPath);
    await Deno.remove(imageCTAPath);
    await Deno.remove(part1Path);
    await Deno.remove(part1TrimmedPath);
    await Deno.remove(part2Image1Path);
    await Deno.remove(part2ImageDelayPath);
    await Deno.remove(part2Image2Path);
    await Deno.remove(part2SlidePath);
    // Clean up downloaded audio if it was a URL
    if (input.audioPath && (input.audioPath.startsWith('http://') || input.audioPath.startsWith('https://'))) {
      try {
        await Deno.remove(join(currentDir, 'br_audio.mp3'));
      } catch (e) {
        // Ignore if already removed
      }
    }
    // Clean up video-only file if audio was added
    try {
      await Deno.remove(videoOnlyPath);
    } catch (e) {
      // Ignore if already removed
    }
  } catch (e) {
    console.warn('[BookReveal] Warning: cleanup incomplete:', e);
  }
}

export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error('Error: No input JSON provided. Pass the input as a single JSON string argument.');
    Deno.exit(1);
  }
  let input: BookRevealReelInput;
  try {
    input = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }
  if (!input.videoUrl || !input.imageUrl || !input.hookText || !input.hookText2 || !input.ctaText) {
    console.error('Error: videoUrl, imageUrl, hookText, hookText2, and ctaText are required.');
    Deno.exit(1);
  }
  try {
    await generateBookRevealReel(input);
    console.log('✅ Book reveal reel generation completed');
  } catch (error) {
    console.error('❌ Error generating book reveal reel:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
