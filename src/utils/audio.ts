import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

/**
 * Available background music files
 * Add new music files to this array to extend the selection
 */
const AVAILABLE_BACKGROUND_MUSIC = [
  'background-music-1.mp3',
  'background-music-2.mp3',
  'background-music-3.mp3',
  'background-music-4.mp3',
];

/**
 * Randomly selects a background music file from the available options
 * @returns The filename of the selected music file, or null if none available
 */
export function selectRandomBackgroundMusic(): string {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_BACKGROUND_MUSIC.length);
  return AVAILABLE_BACKGROUND_MUSIC[randomIndex];
}

/**
 * Gets the full path to a randomly selected background music file
 * @param basePath The base directory path (defaults to current working directory)
 * @returns The full path to the music file, or null if file doesn't exist
 */
export async function getRandomBackgroundMusicPath(
  basePath?: string,
): Promise<string | null> {
  console.log("[Audio] Getting random background music path...");
  const currentDir = basePath || Deno.cwd();
  const musicFile = selectRandomBackgroundMusic();
  const musicPath = join(currentDir, 'assets', 'audio', musicFile);
  
  console.log("[Audio] Full music path:", musicPath);
  
  // Check if the file exists
  try {
    await Deno.stat(musicPath);
    console.log("[Audio] ✅ Music file found!");
    return musicPath;
  } catch {
    console.log("[Audio] ❌ Music file not found at:", musicPath);
    return null;
  }
}

/**
 * Gets all available background music files
 * @returns Array of all available background music filenames
 */
export function getAvailableBackgroundMusic(): string[] {
  return [...AVAILABLE_BACKGROUND_MUSIC];
}

