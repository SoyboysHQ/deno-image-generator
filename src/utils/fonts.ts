// Font registration utilities

import { GlobalFonts } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

/**
 * Register all Merriweather fonts from assets directory
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
}

