import {
  Canvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
} from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

// Register fonts with absolute paths
const fontDir = Deno.cwd();
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

// Video dimensions - optimized for Instagram Reels (9:16)
const WIDTH = 1080;
const HEIGHT = 1920;

interface ReelInput {
  quote: string;
  author?: string;
  duration?: number; // Duration in seconds, default 10
  backgroundImage?: string; // Path to background image, defaults to background.jpeg
  musicPath?: string; // Optional path to background music
}

// Require input as a JSON string argument
if (!Deno.args[0]) {
  console.error(
    'Error: No input JSON provided. Pass the input as a single JSON string argument.',
  );
  Deno.exit(1);
}

let input: ReelInput;
try {
  input = JSON.parse(Deno.args[0]);
} catch (e) {
  console.error('Failed to parse input JSON:', e);
  Deno.exit(1);
}

// Validate required fields
if (!input.quote) {
  console.error('Error: "quote" field is required in input JSON');
  Deno.exit(1);
}

// Set defaults
const duration = input.duration || 10;
const backgroundImage = input.backgroundImage || 'background.jpeg';
const author = input.author || '';

const QUOTE_FONT = 'bold 72px Merriweather';
const QUOTE_LINE_HEIGHT = 100;
const AUTHOR_FONT = 'italic 36px Merriweather';

// Helper function to wrap text
function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  ctx.font = font;
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

// Helper function to draw text with shadow
function drawTextWithShadow(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
) {
  ctx.font = font;
  
  // Draw shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillText(text, x + 3, y + 3);
  
  // Draw text
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// Generate the image frame
async function generateFrame(): Promise<string> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  try {
    // Load and draw background image
    const currentDir = Deno.cwd();
    const bg = await loadImage(join(currentDir, backgroundImage));
    ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
    
    // Add semi-transparent overlay for better text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    const PAD_X = 80;
    const maxTextWidth = WIDTH - PAD_X * 2;
    
    // Wrap and draw quote
    const quoteLines = wrapText(ctx, input.quote, maxTextWidth, QUOTE_FONT);
    const totalQuoteHeight = quoteLines.length * QUOTE_LINE_HEIGHT;
    
    // Calculate starting Y position to center vertically
    let startY = (HEIGHT - totalQuoteHeight) / 2;
    
    // If there's an author, adjust to account for it
    if (author) {
      startY -= 60;
    }
    
    // Draw opening quote mark
    ctx.font = 'bold 120px Merriweather';
    drawTextWithShadow(ctx, '"', PAD_X - 20, startY - 20, ctx.font, '#F0E231');
    
    // Draw each line of the quote
    ctx.font = QUOTE_FONT;
    let currentY = startY;
    for (const line of quoteLines) {
      const lineWidth = ctx.measureText(line).width;
      const x = (WIDTH - lineWidth) / 2;
      drawTextWithShadow(ctx, line, x, currentY, QUOTE_FONT, '#FFFFFF');
      currentY += QUOTE_LINE_HEIGHT;
    }
    
    // Draw closing quote mark
    ctx.font = 'bold 120px Merriweather';
    const lastLine = quoteLines[quoteLines.length - 1];
    const lastLineWidth = ctx.measureText(lastLine).width;
    drawTextWithShadow(
      ctx,
      '"',
      (WIDTH + lastLineWidth) / 2 + 10,
      currentY - 80,
      ctx.font,
      '#F0E231',
    );
    
    // Draw author if provided
    if (author) {
      currentY += 60;
      ctx.font = AUTHOR_FONT;
      const authorText = `— ${author}`;
      const authorWidth = ctx.measureText(authorText).width;
      const authorX = (WIDTH - authorWidth) / 2;
      drawTextWithShadow(ctx, authorText, authorX, currentY, AUTHOR_FONT, '#F0E231');
    }
    
    // Export image as PNG for better quality in video
    const outputPath = 'reel_frame.png';
    const outputBuffer = await canvas.encode('png');
    await Deno.writeFile(outputPath, outputBuffer);
    console.log(`Frame generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating frame:', error);
    throw error;
  }
}

// Generate video using FFmpeg
async function generateVideo(framePath: string): Promise<string> {
  const outputPath = 'instagram_reel.mp4';
  
  try {
    console.log('Generating video with FFmpeg...');
    
    // Build FFmpeg command
    const ffmpegArgs = [
      '-loop', '1',
      '-i', framePath,
      '-c:v', 'libx264',
      '-t', duration.toString(),
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=1080:1920',
      '-r', '30',
      '-y', // Overwrite output file
    ];
    
    // If music is provided, add audio input and mixing
    if (input.musicPath) {
      ffmpegArgs.splice(2, 0, '-i', input.musicPath);
      ffmpegArgs.push(
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest', // End when shortest stream ends
      );
    }
    
    ffmpegArgs.push(outputPath);
    
    const command = new Deno.Command('ffmpeg', {
      args: ffmpegArgs,
      stdout: 'piped',
      stderr: 'piped',
    });
    
    const { code, stderr } = await command.output();
    
    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      console.error('FFmpeg error:', errorText);
      throw new Error('Failed to generate video with FFmpeg');
    }
    
    console.log(`Video generated: ${outputPath}`);
    
    // Clean up temporary frame
    await Deno.remove(framePath).catch(() => {});
    
    return outputPath;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}

// Main execution
try {
  console.log('Starting reel generation...');
  console.log(`Quote: "${input.quote}"`);
  console.log(`Author: ${author || 'None'}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Background: ${backgroundImage}`);
  if (input.musicPath) {
    console.log(`Music: ${input.musicPath}`);
  }
  
  const framePath = await generateFrame();
  const videoPath = await generateVideo(framePath);
  
  // Output JSON for the server to parse
  console.log(JSON.stringify({
    success: true,
    videoPath,
    duration,
  }));
} catch (error) {
  console.error('Error:', error);
  Deno.exit(1);
}

