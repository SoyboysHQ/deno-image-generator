// Central configuration for watermark paths and positioning by account
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

/**
 * Positioning configuration for watermarks
 */
export interface WatermarkPositionConfig {
  scale: number; // Scale factor for watermark (0-1), percentage of image width
  padding: number; // Padding from edges in pixels
  horizontalOffset: number; // Additional horizontal offset (positive = right, negative = left)
  verticalOffset: number; // Additional vertical offset (positive = down, negative = up)
  opacity: number; // Opacity (0-1)
}

/**
 * Watermark configuration including path and positioning
 */
export interface WatermarkConfig {
  path: string;
  position: WatermarkPositionConfig;
}

/**
 * Account identifiers mapped to their watermark configurations
 */
export const WATERMARK_CONFIGS: Record<string, WatermarkConfig> = {
  default: {
    path: join(Deno.cwd(), 'assets', 'images', 'watermark.png'),
    position: {
      scale: 0.13,
      padding: 0,
      horizontalOffset: 0,
      verticalOffset: 0,
      opacity: 1.0,
    },
  },
  compounding_wisdom: {
    path: join(Deno.cwd(), 'assets', 'images', 'watermark_compounding_wisdom.png'),
    position: {
      scale: 0.13,
      padding: 0,
      horizontalOffset: 0,
      verticalOffset: 0,
      opacity: 1.0,
    },
  },
  itsnotwhatisaid: {
    path: join(Deno.cwd(), 'assets', 'images', 'watermark_itsnotwhatisaid.png'),
    position: {
      scale: 0.12,
      padding: 30,
      horizontalOffset: 10,
      verticalOffset: 0,
      opacity: 1.0,
    },
  },
} as const;

/**
 * Valid account identifiers
 */
export type AccountIdentifier = keyof typeof WATERMARK_CONFIGS;

/**
 * Get the watermark configuration for a given account identifier
 * @param account - The account identifier (defaults to 'default')
 * @returns The watermark configuration including path and positioning
 */
export function getWatermarkConfig(account: AccountIdentifier = 'default'): WatermarkConfig {
  return WATERMARK_CONFIGS[account];
}

/**
 * Get the watermark path for a given account identifier
 * @param account - The account identifier (defaults to 'default')
 * @returns The full path to the watermark image
 */
export function getWatermarkPath(account: AccountIdentifier = 'default'): string {
  return WATERMARK_CONFIGS[account].path;
}

/**
 * Check if an account identifier is valid
 */
export function isValidAccount(account: string): account is AccountIdentifier {
  return account in WATERMARK_CONFIGS;
}

