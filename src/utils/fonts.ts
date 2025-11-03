// Font registration utilities

import { GlobalFonts } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

/**
 * Register all Merriweather fonts and system emoji fonts
 */
export function registerFonts(): void {
  const fontDir = join(Deno.cwd(), 'assets', 'fonts');
  
  GlobalFonts.registerFromPath(
    join(fontDir, 'Merriweather-Regular.ttf'),
    'Merriweather',
  );
  
  GlobalFonts.registerFromPath(
    join(fontDir, 'Merriweather-Bold.ttf'),
    'Merriweather',
  );
  
  GlobalFonts.registerFromPath(
    join(fontDir, 'Merriweather-Italic.ttf'),
    'Merriweather',
  );
  
  GlobalFonts.registerFromPath(
    join(fontDir, 'Merriweather_120pt-ExtraBold.ttf'),
    'Merriweather ExtraBold',
  );
  
  // Try to register system emoji fonts
  try {
    // Try common system emoji font locations
    const systemEmojiPaths = [
      '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf',
      '/System/Library/Fonts/Apple Color Emoji.ttc',
      '/usr/share/fonts/truetype/ancient-scripts/Symbola_hint.ttf',
    ];
    
    for (const path of systemEmojiPaths) {
      try {
        GlobalFonts.registerFromPath(path, 'Emoji');
        console.log(`[Fonts] System emoji font registered from: ${path}`);
        break;
      } catch {
        // Continue to next path
      }
    }
  } catch (e) {
    console.warn('[Fonts] Could not register system emoji fonts');
  }
}

