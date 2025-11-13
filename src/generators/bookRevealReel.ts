// Book Reveal Reel generator (Video + Image)
// Part 1: Video with zoom effect (4s total)
//   - hookText appears early (0.2s), stays for 2s
//   - hookText2 appears below it (at 2.2s), stays for 2s
// Part 2: Fade from video to image (1s total, 0.5s fade)
// Part 3: Image with ctaText fade-in after 1s (2s total, 0.4s fade)

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { BookRevealReelInput } from '../types/index.ts';
import { wrapText } from '../utils/text.ts';
import { registerFonts } from '../utils/fonts.ts';
import { getRandomBackgroundMusicPath } from '../utils/audio.ts';
import { generateWatermark } from './watermark.ts';

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920;
const PART1_DURATION = 4.0;      // Video: hookText (2s) + hookText2 (2s)
const PART2_DURATION = 1.0;      // Fade to image (1s total, 0.5s fade)
const PART3_DURATION = 2.0;      // Image with CTA (1s plain + 1s with CTA)
const FADE_DURATION = 0.5;       // fade transition between video and image
const TEXT_FADE_DURATION = 0.4;  // fade-in for CTA
const HOOK1_START = 0.2;         // hookText appears at 0.2s
const HOOK1_DURATION = 2.0;      // hookText stays for 2s
const HOOK2_START = 2.2;         // hookText2 appears at 2.2s
const HOOK2_DURATION = 2.0;      // hookText2 stays for 2s
const ZOOM_START = 1.0;          // Start zoom at 1.0x
const ZOOM_END = 1.15;           // End zoom at 1.15x (15% zoom in)

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

// Re-render plain image to REEL dims (consistent color/lighting)
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

// Generate transparent text overlay matching REEL dims
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
  const BORDER_RADIUS = 60; // Rounder text boxes

  ctx.font = TEXT_FONT;

  const texts = Array.isArray(text) ? text : [text];
  const allLines: string[][] = texts.map(t => wrapText(ctx, t, REEL_WIDTH - PADDING_X * 2, TEXT_FONT));

  if (position === 'bottom') {
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
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

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

  // Text overlays for video
  const overlay1aPath = join(currentDir, 'br_text_1a.png'); // hookText only
  const overlay1bPath = join(currentDir, 'br_text_1b.png'); // hookText2 only (to add below hookText)
  await generateTextOverlay(input.hookText, overlay1aPath, 'center');
  await generateTextOverlay(input.hookText2, overlay1bPath, 'center');

  // Frames for image phase (2 and 3)
  const frame2Path = join(currentDir, 'br_frame2_plain.jpg');
  const tempFrame2Path = join(currentDir, 'br_frame2_plain_tmp.jpg');
  await generatePlainImage(imagePath, tempFrame2Path);
  // Watermark image frames using image watermark generator
  const wmOptions = {
    opacity: input.watermark?.opacity ?? 1.0,
    scale: input.watermark?.scale ?? 0.15,
    padding: input.watermark?.padding ?? 20,
    horizontalOffset: input.watermark?.horizontalOffset ?? 30,
    verticalOffset: input.watermark?.verticalOffset ?? 10,
  };
  await generateWatermark({
    targetImagePath: tempFrame2Path,
    outputPath: frame2Path,
    ...wmOptions,
  });
  await Deno.remove(tempFrame2Path);

  const tempFrame3Path = join(currentDir, 'br_frame3_tmp.jpg');
  const frame3Path = join(currentDir, 'br_frame3_cta.jpg');
  // Render CTA on image at bottom, then watermark
  await (async () => {
    // Render CTA text image first
    const ctaCanvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
    const ctx = ctaCanvas.getContext('2d');
    const src = await loadImage(imagePath);
    const scale = Math.max(REEL_WIDTH / src.width, REEL_HEIGHT / src.height);
    const w = src.width * scale;
    const h = src.height * scale;
    const x = (REEL_WIDTH - w) / 2;
    const y = (REEL_HEIGHT - h) / 2;
    ctx.drawImage(src, x, y, w, h);
    // Draw CTA with same bottom style
    registerFonts();
    const PADDING_X = 80;
    const FONT_SIZE = 30;
    const TEXT_FONT = `bold ${FONT_SIZE}px Merriweather, "Noto Emoji", Emoji, sans-serif`;
    const BOX_PADDING_X = 40;
    const BOX_PADDING_Y = 25;
    const BORDER_RADIUS = 60; // Rounder text boxes
    ctx.font = TEXT_FONT;
    const lines = wrapText(ctx, input.ctaText, REEL_WIDTH - PADDING_X * 2, TEXT_FONT);
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
    const out = ctaCanvas.toBuffer('image/jpeg', 95);
    await Deno.writeFile(tempFrame3Path, out);
  })();
  await generateWatermark({
    targetImagePath: tempFrame3Path,
    outputPath: frame3Path,
    ...wmOptions,
  });
  await Deno.remove(tempFrame3Path);

  // Build videos
  const part1VideoPath = join(currentDir, 'br_part1.mp4');   // Single 4s video with zoom + sequential text
  const part2VideoPath = join(currentDir, 'br_part2.mp4');   // fade video->image
  const part3VideoPath = join(currentDir, 'br_part3.mp4');   // image -> image+cta fade-in

  // Watermark overlay setup (video overlay uses watermark PNG)
  const watermarkPngPath = join(currentDir, 'assets', 'images', 'watermark.png');
  const wmWidth = Math.floor(REEL_WIDTH * (wmOptions.scale ?? 0.15));
  const wmXExpr = `main_w-overlay_w-${wmOptions.padding ?? 20}+${wmOptions.horizontalOffset ?? 0}`;
  const wmYExpr = `main_h-overlay_h-${wmOptions.padding ?? 20}+${wmOptions.verticalOffset ?? 0}`;

  // Part 1: Single continuous video with zoom effect and sequential text overlays
  // Use the full video from start (no seeking), play at normal speed, overlay texts with timing
  // Calculate zoom parameters
  const zoomScale = ZOOM_END; // 1.15x
  const scaledWidth = Math.floor(REEL_WIDTH * zoomScale);
  const scaledHeight = Math.floor(REEL_HEIGHT * zoomScale);
  const totalFrames = PART1_DURATION * 30;
  const zoomIncrement = (ZOOM_END - ZOOM_START) / totalFrames;

  // Create combined overlay with both texts
  const overlayBothPath = join(currentDir, 'br_text_both.png');
  await generateTextOverlay([input.hookText, input.hookText2], overlayBothPath, 'center');

  // Create single continuous video: use full video from start (no seeking), apply zoom, overlay texts
  // Create 3 segments that play the video continuously, just with different overlays
  const part1Seg1Path = join(currentDir, 'br_part1_seg1.mp4'); // 0-0.2s: video only
  const part1Seg2Path = join(currentDir, 'br_part1_seg2.mp4'); // 0.2-2.2s: video + hookText
  const part1Seg3Path = join(currentDir, 'br_part1_seg3.mp4'); // 2.2-4.2s: video + both texts

  // Segment 1: 0-0.2s - video with zoom, no text (plays from start of video at normal speed)
  {
    const segFrames = HOOK1_START * 30;
    const filter =
      `[0:v]scale=${scaledWidth}:${scaledHeight}:force_original_aspect_ratio=increase,crop=${scaledWidth}:${scaledHeight},` +
      `zoompan=z='1+${zoomIncrement}*on':d=${segFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${REEL_WIDTH}x${REEL_HEIGHT}[v0];` +
      `[1:v]scale=${wmWidth}:-1[wm];` +
      `[v0][wm]overlay=${wmXExpr}:${wmYExpr}[outv]`;
    const args = [
      '-i', videoPath, // Start from beginning, no seeking - plays at normal speed
      '-i', watermarkPngPath,
      '-filter_complex', filter,
      '-map', '[outv]',
      '-map', '0:a?', // Preserve audio
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr', // Constant frame rate to ensure normal playback speed
      '-c:a', 'copy',
      '-t', HOOK1_START.toString(), // Exactly 0.2s
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
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

  // Segment 2: 0.2-2.2s - video with zoom + hookText (seek to 0.2s in source video, play at normal speed)
  {
    const segFrames = HOOK1_DURATION * 30; // 60 frames for 2 seconds
    const zoomStart = 1.0 + (zoomIncrement * HOOK1_START * 30);
    const filter =
      `[0:v]scale=${scaledWidth}:${scaledHeight}:force_original_aspect_ratio=increase,crop=${scaledWidth}:${scaledHeight},` +
      `zoompan=z='${zoomStart}+${zoomIncrement}*on':d=${segFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${REEL_WIDTH}x${REEL_HEIGHT}[v0];` +
      `[v0][1:v]overlay=0:0[v1];` +
      `[2:v]scale=${wmWidth}:-1[wm];` +
      `[v1][wm]overlay=${wmXExpr}:${wmYExpr}[outv]`;
    const args = [
      '-ss', HOOK1_START.toString(), // Seek to 0.2s (accurate seeking, doesn't change playback speed)
      '-i', videoPath,
      '-loop', '1',
      '-t', HOOK1_DURATION.toString(),
      '-i', overlay1aPath, // hookText only
      '-i', watermarkPngPath,
      '-filter_complex', filter,
      '-map', '[outv]',
      '-map', '0:a?', // Preserve audio
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr', // Constant frame rate to ensure normal playback speed
      '-c:a', 'copy',
      '-t', HOOK1_DURATION.toString(), // Exactly 2.0s
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-y', part1Seg2Path,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 seg2:', err);
      throw new Error(`FFmpeg failed part1 seg2: code ${res.code}`);
    }
  }

  // Segment 3: 2.2-4.2s - video with zoom + both texts (seek to 2.2s in source video, play at normal speed)
  {
    const segFrames = HOOK2_DURATION * 30; // 60 frames for 2 seconds
    const zoomStart = 1.0 + (zoomIncrement * HOOK2_START * 30);
    const filter =
      `[0:v]scale=${scaledWidth}:${scaledHeight}:force_original_aspect_ratio=increase,crop=${scaledWidth}:${scaledHeight},` +
      `zoompan=z='${zoomStart}+${zoomIncrement}*on':d=${segFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${REEL_WIDTH}x${REEL_HEIGHT}[v0];` +
      `[v0][1:v]overlay=0:0[v1];` +
      `[2:v]scale=${wmWidth}:-1[wm];` +
      `[v1][wm]overlay=${wmXExpr}:${wmYExpr}[outv]`;
    const args = [
      '-ss', HOOK2_START.toString(), // Seek to 2.2s (accurate seeking, doesn't change playback speed)
      '-i', videoPath,
      '-loop', '1',
      '-t', HOOK2_DURATION.toString(),
      '-i', overlayBothPath, // Both texts
      '-i', watermarkPngPath,
      '-filter_complex', filter,
      '-map', '[outv]',
      '-map', '0:a?', // Preserve audio
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-vsync', 'cfr', // Constant frame rate to ensure normal playback speed
      '-c:a', 'copy',
      '-t', HOOK2_DURATION.toString(), // Exactly 2.0s
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-y', part1Seg3Path,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 seg3:', err);
      throw new Error(`FFmpeg failed part1 seg3: code ${res.code}`);
    }
    await Deno.remove(overlayBothPath);
  }

  // Concatenate the three segments (video plays continuously, audio preserved)
  {
    const listPath = join(currentDir, 'br_concat_p1.txt');
    await Deno.writeTextFile(listPath,
      `file '${part1Seg1Path}'\nfile '${part1Seg2Path}'\nfile '${part1Seg3Path}'`);
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c:v', 'copy',
      '-c:a', 'copy', // Preserve audio
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-y', part1VideoPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error concat p1:', err);
      throw new Error(`FFmpeg failed concat p1: code ${res.code}`);
    }
    await Deno.remove(listPath);
    await Deno.remove(part1Seg1Path);
    await Deno.remove(part1Seg2Path);
    await Deno.remove(part1Seg3Path);
    console.log('[BookReveal] ✅ Part 1 video created with zoom and sequential text');
  }

  // Part 2: Fade from video (with both hooks) to image (no text) - 1s total, 0.5s fade
  // Use approach similar to threePartReel: create two video segments of same duration and fade between them
  // Extract last 1s of Part 1 (which has both hooks) and create 1s image video, then fade
  const part1LastSegmentPath = join(currentDir, 'br_part1_last.mp4');
  const part2ImageVideoPath = join(currentDir, 'br_part2_image_video.mp4');

  // Extract last 1s segment of Part 1 (starting from 3s, so we get the last 1s with both hooks)
  {
    const args = [
      '-ss', (PART1_DURATION - PART2_DURATION).toString(), // Start at 3s (last 1s of 4s video)
      '-i', part1VideoPath,
      '-t', PART2_DURATION.toString(), // Duration of 1s
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-an',
      '-y', part1LastSegmentPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1 last segment:', err);
      throw new Error(`FFmpeg failed part1 last segment: code ${res.code}`);
    }
  }

  // Create image video (1s total) - same approach as threePartReel
  {
    const args = [
      '-loop', '1',
      '-t', PART2_DURATION.toString(),
      '-i', frame2Path,
      '-filter_complex',
      `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-an',
      '-y', part2ImageVideoPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part2 image video:', err);
      throw new Error(`FFmpeg failed part2 image video: code ${res.code}`);
    }
  }

  // Now fade between the two videos - same approach as threePartReel
  {
    const args = [
      '-i', part1LastSegmentPath,
      '-i', part2ImageVideoPath,
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
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part2:', err);
      throw new Error(`FFmpeg failed part2: code ${res.code}`);
    }
    // Clean up intermediate files
    await Deno.remove(part1LastSegmentPath);
    await Deno.remove(part2ImageVideoPath);
  }

  // Part 3: Image with CTA fade-in after 1s (2s total: 1s plain + 0.4s fade + 0.6s CTA)
  // Use same approach as threePartReel: create two segments and fade between them
  const part3Image1VideoPath = join(currentDir, 'br_part3_image1_video.mp4');
  const part3Image2VideoPath = join(currentDir, 'br_part3_image2_video.mp4');
  const CTA_DELAY = 1.0; // CTA appears after 1s

  // Create plain image video - needs to be long enough for offset + fade
  {
    const args = [
      '-loop', '1',
      '-t', (CTA_DELAY + TEXT_FADE_DURATION).toString(), // 1s + 0.4s = 1.4s (enough for offset + fade)
      '-i', frame2Path,
      '-filter_complex',
      `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-an',
      '-y', part3Image1VideoPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part3 image1 video:', err);
      throw new Error(`FFmpeg failed part3 image1 video: code ${res.code}`);
    }
  }

  // Create image with CTA video - needs to be long enough for fade + remaining time
  {
    const remainingTime = PART3_DURATION - CTA_DELAY; // 1s remaining after fade starts
    const args = [
      '-loop', '1',
      '-t', (TEXT_FADE_DURATION + remainingTime).toString(), // 0.4s fade + 1s = 1.4s
      '-i', frame3Path,
      '-filter_complex',
      `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-an',
      '-y', part3Image2VideoPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part3 image2 video:', err);
      throw new Error(`FFmpeg failed part3 image2 video: code ${res.code}`);
    }
  }

  // Now fade between the two videos with offset (CTA starts fading in at 1s)
  // Use same approach as threePartReel
  {
    const args = [
      '-i', part3Image1VideoPath,
      '-i', part3Image2VideoPath,
      '-filter_complex',
      `[0:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v0];` +
      `[1:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v1];` +
      `[v0][v1]xfade=transition=fade:duration=${TEXT_FADE_DURATION}:offset=${CTA_DELAY}[outv]`,
      '-map', '[outv]',
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
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part3:', err);
      throw new Error(`FFmpeg failed part3: code ${res.code}`);
    }
    // Clean up intermediate files
    await Deno.remove(part3Image1VideoPath);
    await Deno.remove(part3Image2VideoPath);
  }

  // Trim Part 1 to remove the last 1s (since Part 2 uses it)
  const part1TrimmedPath = join(currentDir, 'br_part1_trimmed.mp4');
  {
    const args = [
      '-i', part1VideoPath,
      '-t', (PART1_DURATION - PART2_DURATION).toString(), // 3s (remove last 1s)
      '-c:v', 'copy',
      '-c:a', 'copy', // Preserve audio when trimming
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
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

  // Extract audio from source video first (if it exists) to add to final output
  // Don't limit duration - extract full audio, we'll trim it when adding to video
  const sourceAudioPath = join(currentDir, 'br_source_audio.aac');
  const extractAudioCmd = new Deno.Command('ffmpeg', {
    args: [
      '-i', videoPath,
      '-vn', // No video
      '-acodec', 'copy', // Copy audio codec
      '-y', sourceAudioPath,
    ],
    stdout: 'piped',
    stderr: 'piped',
  });
  const extractAudioRes = await extractAudioCmd.output();
  const sourceHasAudio = extractAudioRes.code === 0;

  // Concat all parts (video only, audio will be added separately)
  const concatFilePath = join(currentDir, 'br_concat_all.txt');
  await Deno.writeTextFile(concatFilePath, `file '${part1TrimmedPath}'\nfile '${part2VideoPath}'\nfile '${part3VideoPath}'`);
  const videoOnlyPath = join(currentDir, 'br_video_only.mp4');
  {
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-c:v', 'copy',
      '-an', // No audio in concatenated video (we'll add it separately)
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-y', videoOnlyPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error concat ALL:', err);
      throw new Error(`FFmpeg failed concat ALL: code ${res.code}`);
    }
  }

  // Add audio to the final video
  const finalOutputPath = input.outputPath || 'book_reveal_reel.mp4';

  if (sourceHasAudio) {
    // Add extracted source audio to video
    // Use video duration, not audio duration (don't use -shortest)
    const totalVideoDuration = (PART1_DURATION - PART2_DURATION) + PART2_DURATION + PART3_DURATION; // 3s + 1s + 2s = 6s
    console.log('[BookReveal] ✅ Adding audio from source video');
    const args = [
      '-i', videoOnlyPath,
      '-i', sourceAudioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-t', totalVideoDuration.toString(), // Use video duration, trim audio if needed
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-y', finalOutputPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code === 0) {
      console.log('[BookReveal] ✅ Audio added from source video');
      await Deno.remove(sourceAudioPath);
    } else {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] ⚠️ Failed to add source audio:', err);
      await Deno.remove(sourceAudioPath);
      // Fall through to background audio
    }
  }

  // If source doesn't have audio or adding it failed, use background audio
  if (!sourceHasAudio || !await exists(finalOutputPath)) {
    let audioPath: string | undefined = input.audioPath;
    if (!audioPath) {
      const selected = await getRandomBackgroundMusicPath(currentDir);
      if (selected) {
        audioPath = selected;
        console.log('[BookReveal] ✅ Using background audio:', audioPath);
      } else {
        console.log('[BookReveal] No audio available, exporting as silent video');
        if (!await exists(finalOutputPath)) {
          await Deno.rename(videoOnlyPath, finalOutputPath);
        }
        return;
      }
    } else {
      audioPath = audioPath.startsWith('/') ? audioPath : join(currentDir, audioPath);
    }

    if (audioPath && !await exists(finalOutputPath)) {
      const totalVideoDuration = (PART1_DURATION - PART2_DURATION) + PART2_DURATION + PART3_DURATION; // 3s + 1s + 2s = 6s
      const args = [
        '-i', videoOnlyPath,
        '-i', audioPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-t', totalVideoDuration.toString(), // Use video duration, trim audio if needed
        '-threads', '2',
        '-max_muxing_queue_size', '1024',
        '-y', finalOutputPath,
      ];
      const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
      const res = await cmd.output();
      if (res.code !== 0) {
        const err = new TextDecoder().decode(res.stderr);
        console.error('[BookReveal] FFmpeg error adding audio:', err);
        throw new Error(`FFmpeg failed adding audio: code ${res.code}`);
      }
    }
  }

  console.log(`[BookReveal] ✅ Video generated successfully: ${finalOutputPath}`);

  // Cleanup
  try {
    await Deno.remove(videoPath);
    await Deno.remove(imagePath);
    await Deno.remove(overlay1aPath);
    await Deno.remove(overlay1bPath);
    await Deno.remove(frame2Path);
    await Deno.remove(frame3Path);
    await Deno.remove(part1VideoPath);
    await Deno.remove(part1TrimmedPath);
    await Deno.remove(part2VideoPath);
    await Deno.remove(part3VideoPath);
    await Deno.remove(concatFilePath);
    if (await exists(videoOnlyPath)) {
      await Deno.remove(videoOnlyPath);
    }
  } catch (e) {
    console.warn('[BookReveal] Warning: cleanup incomplete:', e);
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
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


