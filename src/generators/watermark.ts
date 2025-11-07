// Watermark generator - adds a watermark to target images

import { Canvas, loadImage, Image } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { getWatermarkPath, AccountIdentifier } from '../config/watermarks.ts';

export interface WatermarkOptions {
  targetImagePath: string;
  account?: AccountIdentifier; // Account identifier for watermark selection (default: 'default')
  watermarkPath?: string; // Direct watermark path (overrides account if provided)
  outputPath?: string;
  opacity?: number;
  scale?: number; // Scale factor for watermark (0-1), default 0.15 (15% of image width)
  padding?: number; // Padding from edges in pixels, default 20
  horizontalOffset?: number; // Additional horizontal offset (positive = right, negative = left), default 0
  verticalOffset?: number; // Additional vertical offset (positive = down, negative = up), default 0
}

/**
 * Add a watermark to an image
 */
export async function generateWatermark(
  options: WatermarkOptions,
): Promise<string> {
  const {
    targetImagePath,
    account = 'default',
    watermarkPath,
    outputPath = 'watermarked_image.jpg',
    opacity = 1.0,
    scale = 0.15,
    padding = 20,
    horizontalOffset = 0,
    verticalOffset = 0,
  } = options;

  // Use direct watermarkPath if provided, otherwise use account mapping
  const finalWatermarkPath = watermarkPath ?? getWatermarkPath(account);

  // Load the target image
  const targetImage = await loadImage(targetImagePath);
  const width = targetImage.width;
  const height = targetImage.height;

  // Create canvas with target image dimensions
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw the target image
  ctx.drawImage(targetImage, 0, 0, width, height);

  // Load the watermark
  const watermark = await loadImage(finalWatermarkPath);

  // Calculate watermark dimensions (maintain aspect ratio)
  const watermarkTargetWidth = Math.floor(width * scale);
  const watermarkAspectRatio = watermark.width / watermark.height;
  const watermarkWidth = watermarkTargetWidth;
  const watermarkHeight = Math.floor(
    watermarkTargetWidth / watermarkAspectRatio,
  );

  // Calculate position (bottom right with padding + custom offsets)
  const x = width - watermarkWidth - padding + horizontalOffset;
  const y = height - watermarkHeight - padding + verticalOffset;

  // Set opacity and draw watermark
  ctx.globalAlpha = opacity;
  ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
  ctx.globalAlpha = 1.0;

  // Export as JPEG
  const outputBuffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);

  return outputPath;
}

/**
 * CLI entry point for watermarking images
 */
export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error(
      'Error: No input JSON provided. Pass the input as a single JSON string argument.',
    );
    Deno.exit(1);
  }

  let options: WatermarkOptions;
  try {
    options = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }

  try {
    const outputPath = await generateWatermark(options);
    console.log(`✅ Watermarked image saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating watermarked image:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}
