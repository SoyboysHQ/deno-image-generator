// Central configuration for watermark paths by account
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

/**
 * Account identifiers mapped to their watermark image paths
 */
export const WATERMARK_PATHS = {
  default: join(Deno.cwd(), 'assets', 'images', 'watermark.png'),
  compounding_wisdom: join(Deno.cwd(), 'assets', 'images', 'watermark_compounding_wisdom.png'),
  itsnotwhatisaid: join(Deno.cwd(), 'assets', 'images', 'watermark_itsnotwhatisaid.png'),
} as const;

/**
 * Valid account identifiers
 */
export type AccountIdentifier = keyof typeof WATERMARK_PATHS;

/**
 * Get the watermark path for a given account identifier
 * @param account - The account identifier (defaults to 'default')
 * @returns The full path to the watermark image
 */
export function getWatermarkPath(account: AccountIdentifier = 'default'): string {
  return WATERMARK_PATHS[account];
}

/**
 * Check if an account identifier is valid
 */
export function isValidAccount(account: string): account is AccountIdentifier {
  return account in WATERMARK_PATHS;
}

