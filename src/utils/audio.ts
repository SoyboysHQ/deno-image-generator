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
  'background-music-5.mp3',
  'background-music-6.mp3',
  'background-music-7.mp3',
  'background-music-8.mp3',
  'background-music-9.mp3',
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

/**
 * Gets the duration of an audio file in seconds using FFprobe
 * @param audioPath The path to the audio file
 * @returns The duration in seconds, or null if unable to determine
 */
export async function getAudioDuration(audioPath: string): Promise<number | null> {
  try {
    console.log("[Audio] Getting duration for:", audioPath);
    
    const command = new Deno.Command('ffprobe', {
      args: [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        audioPath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stdout, stderr } = await command.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      console.error('[Audio] FFprobe error:', errorText);
      return null;
    }

    const output = new TextDecoder().decode(stdout).trim();
    const duration = parseFloat(output);
    
    if (isNaN(duration)) {
      console.error('[Audio] Unable to parse duration:', output);
      return null;
    }
    
    console.log(`[Audio] ✅ Audio duration: ${duration.toFixed(2)}s`);
    return duration;
  } catch (error) {
    console.error('[Audio] Error getting audio duration:', error);
    return null;
  }
}

