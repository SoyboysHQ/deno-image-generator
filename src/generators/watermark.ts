// Watermark generator - adds a watermark to target images

import { Canvas, loadImage, Image } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import {
  getWatermarkConfig,
  AccountIdentifier,
} from '../config/watermarks.ts';

export interface WatermarkOptions {
  targetImagePath: string;
  account?: AccountIdentifier; // Account identifier for watermark selection (default: 'default')
  watermarkPath?: string; // Direct watermark path (overrides account if provided)
  outputPath?: string;
  opacity?: number; // Optional override for opacity
  scale?: number; // Optional override for scale
  padding?: number; // Optional override for padding
  horizontalOffset?: number; // Optional override for horizontal offset
  verticalOffset?: number; // Optional override for vertical offset
}

/**
 * Add a watermark to an image with high-quality rendering
 */
export async function generateWatermark(
  options: WatermarkOptions,
): Promise<string> {
  const {
    targetImagePath,
    account = 'default',
    watermarkPath,
    outputPath = 'watermarked_image.jpg',
  } = options;

  // Get watermark configuration for the account
  const config = getWatermarkConfig(account);

  // Use direct watermarkPath if provided, otherwise use account mapping
  const finalWatermarkPath = watermarkPath ?? config.path;

  // Use provided options or fall back to config defaults
  const opacity = options.opacity ?? config.position.opacity;
  const scale = options.scale ?? config.position.scale;
  const padding = options.padding ?? config.position.padding;
  const horizontalOffset =
    options.horizontalOffset ?? config.position.horizontalOffset;
  const verticalOffset =
    options.verticalOffset ?? config.position.verticalOffset;

  // Load the target image
  const targetImage = await loadImage(targetImagePath);
  const width = targetImage.width;
  const height = targetImage.height;

  // Create canvas with target image dimensions
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

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

  // Set opacity and draw watermark with high quality
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
  ctx.globalAlpha = 1.0;

  // Export as JPEG with maximum quality (required by Instagram)
  const outputBuffer = canvas.toBuffer('image/jpeg', 100);
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
