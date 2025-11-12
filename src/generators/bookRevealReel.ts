// Book Reveal Reel generator (Video + Image)
// Part 1a: Video with hookText (0.5s)
// Part 1b: Video with hookText + hookText2 (1.5s)
// Part 2: Fade from video (with text) to image (no text) (1.5s total, 0.5s fade)
// Part 3: Image with ctaText (bottom) with quick text fade-in (2s, 0.4s fade)

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { BookRevealReelInput } from '../types/index.ts';
import { wrapText } from '../utils/text.ts';
import { registerFonts } from '../utils/fonts.ts';
import { getRandomBackgroundMusicPath } from '../utils/audio.ts';
import { generateWatermark } from './watermark.ts';

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920;
const PART1_DURATION = 2.0;      // 0.5s + 1.5s
const PART2_DURATION = 1.5;      // fade segment duration
const PART3_DURATION = 2.0;      // final image with CTA
const FADE_DURATION = 0.5;       // fade transition between video and image
const TEXT_FADE_DURATION = 0.4;  // fade-in for CTA

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
  const BORDER_RADIUS = 35;

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
  const overlay1bPath = join(currentDir, 'br_text_1b.png'); // hookText + hookText2
  await generateTextOverlay(input.hookText, overlay1aPath, 'center');
  await generateTextOverlay([input.hookText, input.hookText2], overlay1bPath, 'center');

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
    const BORDER_RADIUS = 35;
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
  const part1aVideoPath = join(currentDir, 'br_part1a.mp4'); // 0.5s video + hookText + watermark
  const part1bVideoPath = join(currentDir, 'br_part1b.mp4'); // 1.5s video + hookText+hookText2 + watermark
  const part1VideoPath = join(currentDir, 'br_part1.mp4');   // concat of 1a and 1b
  const part2VideoPath = join(currentDir, 'br_part2.mp4');   // fade video->image
  const part3VideoPath = join(currentDir, 'br_part3.mp4');   // image -> image+cta fade-in

  // Watermark overlay setup (video overlay uses watermark PNG)
  const watermarkPngPath = join(currentDir, 'assets', 'images', 'watermark.png');
  const wmWidth = Math.floor(REEL_WIDTH * (wmOptions.scale ?? 0.15));
  const wmXExpr = `main_w-overlay_w-${wmOptions.padding ?? 20}+${wmOptions.horizontalOffset ?? 0}`;
  const wmYExpr = `main_h-overlay_h-${wmOptions.padding ?? 20}+${wmOptions.verticalOffset ?? 0}`;

  // Part 1a: overlay hookText on video (0.5s)
  {
    const filter =
      `[0:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v0];` +
      `[2:v]scale=${wmWidth}:-1[wm];` +
      `[v0][1:v]overlay=0:0[v1];` +
      `[v1][wm]overlay=${wmXExpr}:${wmYExpr}[outv]`;
    const args = [
      '-i', videoPath,
      '-i', overlay1aPath,
      '-i', watermarkPngPath,
      '-filter_complex', filter,
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-t', (PART1_DURATION / 2).toFixed(1),
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-an',
      '-y', part1aVideoPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1a:', err);
      throw new Error(`FFmpeg failed part1a: code ${res.code}`);
    }
  }

  // Part 1b: overlay hookText+hookText2 on video (1.5s)
  {
    const filter =
      `[0:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v0];` +
      `[2:v]scale=${wmWidth}:-1[wm];` +
      `[v0][1:v]overlay=0:0[v1];` +
      `[v1][wm]overlay=${wmXExpr}:${wmYExpr}[outv]`;
    const args = [
      '-i', videoPath,
      '-i', overlay1bPath,
      '-i', watermarkPngPath,
      '-filter_complex', filter,
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-t', PART1_DURATION.toFixed(1),
      '-threads', '2',
      '-max_muxing_queue_size', '1024',
      '-an',
      '-y', part1bVideoPath,
    ];
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error part1b:', err);
      throw new Error(`FFmpeg failed part1b: code ${res.code}`);
    }
  }

  // Concat 1a + 1b
  {
    const listPath = join(currentDir, 'br_concat_p1.txt');
    await Deno.writeTextFile(listPath, `file '${part1aVideoPath}'\nfile '${part1bVideoPath}'`);
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c:v', 'copy',
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
  }

  // Part 2: Fade from (video with text) to image (no text)
  // First convert image to video, then fade between two videos
  const part2ImageVideoPath = join(currentDir, 'br_part2_image_video.mp4');
  {
    const args = [
      '-loop', '1',
      '-framerate', '30',
      '-i', frame2Path,
      '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-t', PART2_DURATION.toString(),
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

  // Now fade between the two videos
  {
    const args = [
      '-i', part1bVideoPath,     // last state of video with both hooks
      '-i', part2ImageVideoPath, // image converted to video
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
    // Clean up intermediate file
    await Deno.remove(part2ImageVideoPath);
  }

  // Part 3: Fade-in CTA on image (plain -> CTA)
  // Convert both images to videos first, then fade between them
  const part3Image1VideoPath = join(currentDir, 'br_part3_image1_video.mp4');
  const part3Image2VideoPath = join(currentDir, 'br_part3_image2_video.mp4');

  // Convert frame2 (plain) to video
  {
    const args = [
      '-loop', '1',
      '-framerate', '30',
      '-i', frame2Path,
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

  // Convert frame3 (with CTA) to video
  {
    const args = [
      '-loop', '1',
      '-framerate', '30',
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

  // Now fade between the two videos
  {
    const args = [
      '-i', part3Image1VideoPath,
      '-i', part3Image2VideoPath,
      '-filter_complex',
      `[0:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v0];` +
      `[1:v]scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}[v1];` +
      `[v0][v1]xfade=transition=fade:duration=${TEXT_FADE_DURATION}:offset=0[outv]`,
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
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

  // Concat all parts
  const concatFilePath = join(currentDir, 'br_concat_all.txt');
  await Deno.writeTextFile(concatFilePath, `file '${part1VideoPath}'\nfile '${part2VideoPath}'\nfile '${part3VideoPath}'`);
  const videoOnlyPath = join(currentDir, 'br_video_only.mp4');
  {
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-c:v', 'copy',
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

  // Add background audio if provided or auto-selected
  let audioPath: string | undefined = input.audioPath;
  if (!audioPath) {
    const selected = await getRandomBackgroundMusicPath(currentDir);
    if (selected) {
      audioPath = selected;
      console.log('[BookReveal] ✅ Using background audio:', audioPath);
    } else {
      console.log('[BookReveal] No background audio found, exporting as silent video');
    }
  } else {
    audioPath = audioPath.startsWith('/') ? audioPath : join(currentDir, audioPath);
  }

  const finalOutputPath = input.outputPath || 'book_reveal_reel.mp4';
  if (audioPath) {
    const args = [
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
    const cmd = new Deno.Command('ffmpeg', { args, stdout: 'piped', stderr: 'piped' });
    const res = await cmd.output();
    if (res.code !== 0) {
      const err = new TextDecoder().decode(res.stderr);
      console.error('[BookReveal] FFmpeg error adding audio:', err);
      throw new Error(`FFmpeg failed adding audio: code ${res.code}`);
    }
  } else {
    await Deno.rename(videoOnlyPath, finalOutputPath);
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
    await Deno.remove(part1aVideoPath);
    await Deno.remove(part1bVideoPath);
    await Deno.remove(part1VideoPath);
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


