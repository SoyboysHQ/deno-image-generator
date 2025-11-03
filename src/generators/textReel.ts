// Text Reel generator - Creates a video with handwritten text on background for audio duration

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import type { TextReelInput } from '../types/index.ts';
import { parseMarkedText, wrapText } from '../utils/text.ts';
import { drawHandwrittenHighlight } from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';
import { getRandomBackgroundMusicPath, getAudioDuration } from '../utils/audio.ts';

const DEFAULT_DURATION = 5; // 5 seconds
const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920; // Instagram Reel dimensions (9:16)

/**
 * Generate a text image with handwritten font
 */
async function generateTextImage(
  text: string,
  outputPath: string = 'text_image.jpg',
): Promise<void> {
  registerFonts();

  // Parse the text for highlights
  const parsed = parseMarkedText(text);
  const displayText = parsed.text;
  const highlights = parsed.highlights;

  // Create canvas
  const canvas = new Canvas(REEL_WIDTH, REEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Load background image
  const currentDir = Deno.cwd();
  const bg = await loadImage(join(currentDir, 'assets', 'images', 'background.jpeg'));
  ctx.drawImage(bg, 0, 0, REEL_WIDTH, REEL_HEIGHT);
  
  // Load signature image
  const signature = await loadImage(join(currentDir, 'assets', 'images', 'signature.png'));

  // Styling constants for handwritten font
  const PADDING_X = 100;
  const PADDING_Y = 150;
  const FONT_SIZE = 86; // Larger font size for handwritten style
  const TEXT_FONT = `${FONT_SIZE}px "Handwritten soyboys i"`;
  const LINE_HEIGHT = 100; // More generous line height for readability
  const PARAGRAPH_SPACING = 120; // Extra spacing between paragraphs

  // Calculate available space for text
  const maxWidth = REEL_WIDTH - PADDING_X * 2;
  
  // Build highlight ranges in the original text (character positions)
  const highlightRanges: Array<{ start: number; end: number; color: string }> = [];
  for (const highlight of highlights) {
    let searchStart = 0;
    while (true) {
      const index = displayText.indexOf(highlight.phrase, searchStart);
      if (index === -1) break;
      highlightRanges.push({
        start: index,
        end: index + highlight.phrase.length,
        color: highlight.color || '#FDB849'
      });
      searchStart = index + 1; // Continue searching for more instances
    }
  }
  
  // Split by paragraphs first (double newlines)
  const paragraphs = displayText.split('\n\n').filter(p => p.trim());
  
  // Wrap each paragraph separately, handling single newlines within paragraphs
  ctx.font = TEXT_FONT;
  const allLines: { text: string; isParagraphEnd: boolean; startChar: number; endChar: number }[] = [];
  let globalCharPos = 0; // Track our position in displayText as we build lines
  
  for (let i = 0; i < paragraphs.length; i++) {
    // Split each paragraph by single newlines to preserve explicit line breaks
    const explicitLines = paragraphs[i].split('\n').filter(l => l.trim());
    
    // Wrap each explicit line separately
    for (let j = 0; j < explicitLines.length; j++) {
      const originalLine = explicitLines[j];
      const wrappedLines = wrapText(ctx, originalLine, maxWidth, TEXT_FONT);
      
      // Build string that represents how text flows through wrapped lines
      let textFlowPos = globalCharPos;
      
      wrappedLines.forEach((wrappedLine, idx) => {
        const isLastLineOfParagraph = (j === explicitLines.length - 1) && 
                                       (idx === wrappedLines.length - 1) && 
                                       (i < paragraphs.length - 1);
        
        // Each wrapped line contains consecutive characters from displayText
        // Length excludes trailing spaces that wrapText might have added
        const lineContentLength = wrappedLine.trim().length;
        
        allLines.push({
          text: wrappedLine,
          isParagraphEnd: isLastLineOfParagraph,
          startChar: textFlowPos,
          endChar: textFlowPos + lineContentLength
        });
        
        // Move position forward by the actual content + space (except last line)
        textFlowPos += lineContentLength;
        if (idx < wrappedLines.length - 1) {
          textFlowPos++; // Space between wrapped lines
        }
      });
      
      // Update global position: move past the original line length
      globalCharPos += originalLine.length;
      if (j < explicitLines.length - 1) {
        globalCharPos++; // Newline between explicit lines
      }
    }
    
    if (i < paragraphs.length - 1) {
      globalCharPos += 2; // Paragraph break (\n\n)
    }
  }
  
  // Calculate total height needed for text
  const paragraphBreaks = allLines.filter(l => l.isParagraphEnd).length;
  const totalHeight = allLines.length * LINE_HEIGHT + paragraphBreaks * PARAGRAPH_SPACING;
  
  // Start Y position (vertically centered)
  let currY = (REEL_HEIGHT - totalHeight) / 2 + FONT_SIZE;

  // Draw each line with optional highlight background and variable character spacing
  for (const lineObj of allLines) {
    const line = lineObj.text;
    const lineStart = lineObj.startChar;
    const lineEnd = lineObj.endChar;
    
    // Calculate total width with variable spacing
    const chars = line.split('');
    let totalWidth = 0;
    const charWidths: number[] = [];
    const charSpacings: number[] = [];
    
    ctx.font = TEXT_FONT;
    for (let i = 0; i < chars.length; i++) {
      const charWidth = ctx.measureText(chars[i]).width;
      charWidths.push(charWidth);
      
      // Add variable spacing between characters (0.5 to 2.5 pixels random variation)
      const baseSpacing = i < chars.length - 1 ? 1.5 : 0;
      const variableSpacing = baseSpacing + (Math.random() * 2 - 0.5); // Random between 1 and 3
      charSpacings.push(variableSpacing);
      
      totalWidth += charWidth + variableSpacing;
    }
    
    const lineX = (REEL_WIDTH - totalWidth) / 2; // Center each line horizontally

    // Find highlight ranges that overlap with this line
    const lineHighlightSegments: Array<{ startIdx: number; endIdx: number; color: string }> = [];
    for (const range of highlightRanges) {
      // Check if this highlight range overlaps with the current line
      if (range.start < lineEnd && range.end > lineStart) {
        // Calculate the portion of the highlight that's on this line
        const segmentStart = Math.max(0, range.start - lineStart);
        const segmentEnd = Math.min(line.trim().length, range.end - lineStart);
        
        // Only add if the segment has positive width
        if (segmentEnd > segmentStart) {
          lineHighlightSegments.push({
            startIdx: segmentStart,
            endIdx: segmentEnd,
            color: range.color
          });
        }
      }
    }
    
    // Fallback: also check for direct phrase matches in this line
    // This helps catch cases where character position tracking is slightly off
    for (const highlight of highlights) {
      const phrase = highlight.phrase;
      const trimmedLine = line.trim();
      
      // Check if this line contains part of the phrase
      for (const word of phrase.split(' ')) {
        if (word.length > 3 && trimmedLine.includes(word)) {
          const wordIdx = trimmedLine.indexOf(word);
          
          // Check if this word isn't already covered by a segment
          const alreadyCovered = lineHighlightSegments.some(seg => 
            wordIdx >= seg.startIdx && wordIdx < seg.endIdx
          );
          
          if (!alreadyCovered) {
            lineHighlightSegments.push({
              startIdx: wordIdx,
              endIdx: wordIdx + word.length,
              color: highlight.color || '#FDB849'
            });
          }
        }
      }
    }
    
    // Draw highlight backgrounds for all segments on this line
    for (const segment of lineHighlightSegments) {
      // Calculate width up to the segment with variable spacing
      let beforeWidth = 0;
      for (let i = 0; i < segment.startIdx; i++) {
        beforeWidth += charWidths[i] + charSpacings[i];
      }
      
      // Calculate segment width with variable spacing
      let segmentWidth = 0;
      for (let i = segment.startIdx; i < segment.endIdx; i++) {
        segmentWidth += charWidths[i] + charSpacings[i];
      }
      
      const padX = 15;
      drawHandwrittenHighlight(
        ctx,
        lineX + beforeWidth - padX,
        currY - FONT_SIZE * 0.85,
        segmentWidth + padX * 2,
        FONT_SIZE,
        segment.color,
      );
    }

    // Draw the text character by character with variable spacing
    ctx.font = TEXT_FONT;
    ctx.fillStyle = '#16228a'; // Pen blue color
    
    let xPos = lineX;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], xPos, currY);
      xPos += charWidths[i] + charSpacings[i];
    }
    
    currY += LINE_HEIGHT;
    
    // Add extra spacing after paragraph end
    if (lineObj.isParagraphEnd) {
      currY += PARAGRAPH_SPACING;
    }
  }
  
  // Draw signature below the text
  // Signature dimensions from the PNG: approximately 1136 x 247
  const signatureWidth = 550; // Larger size
  const signatureHeight = (signatureWidth / 1136) * 247;
  const signatureX = (REEL_WIDTH - signatureWidth) / 2; // Center horizontally
  const signatureY = currY + 80; // 60px below the last line of text
  
  ctx.drawImage(signature, signatureX, signatureY, signatureWidth, signatureHeight);

  // Export image as JPEG
  const outputBuffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, outputBuffer);
  
  console.log(`[TextReel] Text image generated: ${outputPath}`);
}

/**
 * Generate a text reel with handwritten font
 */
export async function generateTextReel(
  input: TextReelInput,
  outputPath: string = 'text_reel.mp4',
): Promise<void> {
  console.log('[TextReel] ========================================');
  console.log('[TextReel] Starting text reel generation...');
  console.log('[TextReel] Input:', JSON.stringify(input, null, 2));
  console.log('[TextReel] ========================================');
  
  const currentDir = Deno.cwd();
  
  // Generate text image
  const tempImagePath = join(currentDir, 'text_image_temp.jpg');
  console.log(`[TextReel] Generating text image with handwritten font...`);
  await generateTextImage(input.text, tempImagePath);
  
  // Auto-select random background music if not provided
  console.log('[TextReel] ========================================');
  console.log('[TextReel] Checking for audio...');
  console.log('[TextReel] input.audioPath:', input.audioPath);
  let audioPath: string | undefined = input.audioPath;
  if (!audioPath) {
    console.log('[TextReel] No audioPath provided, selecting random music...');
    const selectedMusicPath = await getRandomBackgroundMusicPath(currentDir);
    console.log('[TextReel] Selected music path:', selectedMusicPath);
    if (selectedMusicPath) {
      audioPath = selectedMusicPath;
      console.log('[TextReel] ✅ Using audio:', audioPath);
    } else {
      console.log('[TextReel] No background music found, generating without audio');
    }
  } else {
    // Resolve relative paths to absolute
    audioPath = audioPath.startsWith('/') 
      ? audioPath 
      : join(currentDir, audioPath);
    console.log('[TextReel] Using provided audioPath:', audioPath);
  }
  console.log('[TextReel] ========================================');
  
  // Determine duration: use provided duration, or if not provided and audio exists, use audio duration
  let duration = input.duration;
  if (!duration && audioPath) {
    console.log('[TextReel] No duration provided, getting audio file duration...');
    const audioDuration = await getAudioDuration(audioPath);
    if (audioDuration) {
      duration = audioDuration;
      console.log(`[TextReel] ✅ Using audio file duration: ${duration.toFixed(2)}s`);
    } else {
      duration = DEFAULT_DURATION;
      console.log(`[TextReel] ⚠️  Could not determine audio duration, using default: ${duration}s`);
    }
  } else if (!duration) {
    duration = DEFAULT_DURATION;
    console.log(`[TextReel] Using default duration: ${duration}s`);
  } else {
    console.log(`[TextReel] Using provided duration: ${duration}s`);
  }
  
  const finalOutputPath = input.outputPath || outputPath;
  
  console.log(`[TextReel] Generating ${duration}s video from image: ${tempImagePath}`);
  console.log(`[TextReel] Output: ${finalOutputPath}`);

  // Build FFmpeg command
  const ffmpegArgs: string[] = [
    '-loop', '1',                    // Loop the input image
    '-i', tempImagePath,             // Input image
  ];

  // Add audio if provided or auto-selected
  if (audioPath) {
    console.log(`[TextReel] Adding audio: ${audioPath}`);
    ffmpegArgs.push('-i', audioPath);
  }

  // Video filters and output options
  ffmpegArgs.push(
    '-vf', `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`,
    '-c:v', 'libx264',               // H.264 codec
    '-preset', 'faster',             // Faster preset for lower memory usage
    '-tune', 'stillimage',           // Optimize for still images
    '-crf', '23',                    // Quality (lower = better, 23 is good)
    '-pix_fmt', 'yuv420p',          // Pixel format for compatibility
    '-r', '30',                      // Frame rate
    '-t', duration.toString(),       // Duration
    '-threads', '4',                 // Limit threads to reduce memory usage
    '-max_muxing_queue_size', '1024', // Limit muxing queue size
  );

  // Audio options
  if (audioPath) {
    ffmpegArgs.push(
      '-c:a', 'aac',                 // AAC audio codec
      '-b:a', '128k',                // Audio bitrate
    );
  } else {
    // No audio track
    ffmpegArgs.push('-an');
  }

  // Output file (overwrite if exists)
  ffmpegArgs.push('-y', finalOutputPath);

  console.log(`[TextReel] Running FFmpeg with args:`, ffmpegArgs.join(' '));

  // Execute FFmpeg command
  const command = new Deno.Command('ffmpeg', {
    args: ffmpegArgs,
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    console.error('[TextReel] FFmpeg error:', errorText);
    throw new Error(`FFmpeg failed with code ${code}: ${errorText}`);
  }

  const outputText = new TextDecoder().decode(stdout);
  console.log('[TextReel] FFmpeg output:', outputText);
  console.log(`[TextReel] ✅ Video generated successfully: ${finalOutputPath}`);
  
  // Clean up temporary text image
  try {
    await Deno.remove(tempImagePath);
    console.log('[TextReel] Cleaned up temporary text image');
  } catch (e) {
    // Ignore errors if temp file doesn't exist
  }
}

/**
 * CLI entry point for generating text reels
 */
export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error(
      'Error: No input JSON provided. Pass the input as a single JSON string argument.',
    );
    Deno.exit(1);
  }

  let input: TextReelInput;
  try {
    input = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }

  // Validate required fields
  if (!input.text) {
    console.error('Error: text is required in the input JSON');
    Deno.exit(1);
  }

  try {
    await generateTextReel(input);
    console.log('✅ Text reel generation completed');
  } catch (error) {
    console.error('❌ Error generating text reel:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

