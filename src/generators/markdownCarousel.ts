// Markdown Carousel generator - Creates slides from markdown input

import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import type { MarkdownCarouselInput, MarkdownCarouselOutput } from '../types/index.ts';
import { parseMarkedText, wrapText } from '../utils/text.ts';
import { drawTextWithHighlights } from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';

const WIDTH = 1080;
const HEIGHT = 1350;

interface MarkdownSlide {
  content: string;
}

interface TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

interface RenderedLine {
  segments: TextSegment[];
  baseFontSize: number;
  color: string;
  lineHeight: number;
  highlights: Array<{ phrase: string; color?: string }>;
  indent?: number;
  type: 'text' | 'blockquote' | 'list' | 'spacer';
  extraSpacingAfter?: number;  // Additional spacing to add after this line
}

/**
 * Parse inline markdown (*bold* and _italic_) into text segments
 * Bold: *text* 
 * Italic: _text_
 */
function parseInlineFormatting(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentPos = 0;
  
  // Pattern to match *bold* or _italic_
  const pattern = /(\*[^*]+\*|_[^_]+_)/g;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match as regular text
    if (match.index > currentPos) {
      segments.push({
        text: text.substring(currentPos, match.index),
        bold: false,
        italic: false,
      });
    }
    
    // Add the formatted text
    const matchedText = match[0];
    if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      // Bold - but check if there's italic inside
      const innerText = matchedText.slice(1, -1);
      
      // Check for nested _italic_ inside *bold*
      if (innerText.includes('_') && innerText.match(/_[^_]+_/)) {
        // Recursively parse the inner text for italic
        const innerSegments = parseInlineFormatting(innerText);
        innerSegments.forEach(seg => {
          segments.push({
            text: seg.text,
            bold: true,  // Outer bold applies
            italic: seg.italic,  // Inner italic preserved
          });
        });
      } else {
        segments.push({
          text: innerText,
          bold: true,
          italic: false,
        });
      }
    } else if (matchedText.startsWith('_') && matchedText.endsWith('_')) {
      // Italic - but check if there's bold inside
      const innerText = matchedText.slice(1, -1);
      
      // Check for nested *bold* inside _italic_
      if (innerText.includes('*') && innerText.match(/\*[^*]+\*/)) {
        // Recursively parse the inner text for bold
        const innerSegments = parseInlineFormatting(innerText);
        innerSegments.forEach(seg => {
          segments.push({
            text: seg.text,
            bold: seg.bold,  // Inner bold preserved
            italic: true,  // Outer italic applies
          });
        });
      } else {
        segments.push({
          text: innerText,
          bold: false,
          italic: true,
        });
      }
    }
    
    currentPos = match.index + matchedText.length;
  }
  
  // Add remaining text
  if (currentPos < text.length) {
    segments.push({
      text: text.substring(currentPos),
      bold: false,
      italic: false,
    });
  }
  
  // If no segments were created, return the original text as one segment
  if (segments.length === 0) {
    segments.push({
      text: text,
      bold: false,
      italic: false,
    });
  }
  
  return segments;
}

/**
 * Parse markdown into slides separated by ---
 */
function parseMarkdownSlides(markdown: string): MarkdownSlide[] {
  const slides = markdown.split(/\n---\n/);
  return slides
    .map((content) => ({ content: content.trim() }))
    .filter((slide) => slide.content.length > 0);
}

/**
 * Parse a single markdown slide into rendered lines
 */
function parseSlideContent(content: string): RenderedLine[] {
  const lines: RenderedLine[] = [];
  const rawLines = content.split('\n');

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];

    // Empty line = paragraph break (add spacing)
    if (!line.trim()) {
      // Add a small spacer line
      lines.push({
        segments: [{ text: '', bold: false, italic: false }],
        baseFontSize: 1,
        color: 'transparent',
        lineHeight: 30,  // Paragraph break spacing
        highlights: [],
        type: 'spacer',
      });
      continue;
    }

    // H1 - Large title (# Text) - Base is bold, but parse inline formatting
    if (line.match(/^#\s+/)) {
      const text = line.replace(/^#\s+/, '');
      const parsed = parseMarkedText(text);
      const segments = parseInlineFormatting(parsed.text);
      // For headers, if a segment isn't explicitly italic, make it bold
      segments.forEach(seg => {
        if (!seg.italic) {
          seg.bold = true;
        }
      });
      lines.push({
        segments,
        baseFontSize: 90,
        color: '#222',
        lineHeight: 110,
        highlights: parsed.highlights,
        type: 'text',
      });
      continue;
    }

    // H2 - Section header (## Text) - Base is bold, but parse inline formatting
    if (line.match(/^##\s+/)) {
      const text = line.replace(/^##\s+/, '');
      const parsed = parseMarkedText(text);
      const segments = parseInlineFormatting(parsed.text);
      // For headers, if a segment isn't explicitly italic, make it bold
      segments.forEach(seg => {
        if (!seg.italic) {
          seg.bold = true;
        }
      });
      lines.push({
        segments,
        baseFontSize: 54,
        color: '#222',
        lineHeight: 70,
        highlights: parsed.highlights,
        type: 'text',
      });
      continue;
    }

    // H3 - Subsection header (### Text) - Base is bold, but parse inline formatting
    if (line.match(/^###\s+/)) {
      const text = line.replace(/^###\s+/, '');
      const parsed = parseMarkedText(text);
      const segments = parseInlineFormatting(parsed.text);
      // For headers, if a segment isn't explicitly italic, make it bold
      segments.forEach(seg => {
        if (!seg.italic) {
          seg.bold = true;
        }
      });
      lines.push({
        segments,
        baseFontSize: 42,
        color: '#222',
        lineHeight: 58,
        highlights: parsed.highlights,
        type: 'text',
      });
      continue;
    }

    // Blockquote (> Text) - Base is italic, but parse inline formatting too
    if (line.match(/^>\s+/)) {
      const text = line.replace(/^>\s+/, '');
      const parsed = parseMarkedText(text);
      const segments = parseInlineFormatting(parsed.text);
      // For blockquotes, if a segment isn't explicitly bold, make it italic
      segments.forEach(seg => {
        if (!seg.bold) {
          seg.italic = true;
        }
      });
      lines.push({
        segments,
        baseFontSize: 32,
        color: '#555',
        lineHeight: 50,
        highlights: parsed.highlights,
        indent: 40,
        type: 'blockquote',
      });
      continue;
    }

    // List item (- Text) - Parse inline formatting
    // Note: * is used for bold, so only - creates lists
    if (line.match(/^-\s+/)) {
      const text = line.replace(/^-\s+/, '');
      const parsed = parseMarkedText(text);
      const segments = parseInlineFormatting(parsed.text);
      // Add bullet at the start
      segments.unshift({ text: '• ', bold: false, italic: false });
      lines.push({
        segments,
        baseFontSize: 32,
        color: '#222',
        lineHeight: 46,  // Tight spacing within bullet point
        highlights: parsed.highlights,
        indent: 20,
        type: 'list',
        extraSpacingAfter: 20,  // Add extra space AFTER the bullet point
      });
      continue;
    }

    // Regular paragraph text - Parse inline formatting (*bold* and _italic_)
    const parsed = parseMarkedText(line);
    const segments = parseInlineFormatting(parsed.text);
    
    lines.push({
      segments,
      baseFontSize: 34,
      color: '#222',
      lineHeight: 52,
      highlights: parsed.highlights,
      type: 'text',
    });
  }

  return lines;
}

/**
 * Wrap segments into lines that fit within maxWidth
 */
function wrapSegments(
  ctx: any,
  segments: TextSegment[],
  maxWidth: number,
  baseFontSize: number,
): Array<{ segments: TextSegment[]; width: number }> {
  const lines: Array<{ segments: TextSegment[]; width: number }> = [];
  let currentLine: TextSegment[] = [];
  let currentWidth = 0;
  
  for (const segment of segments) {
    // Handle bold, italic, or both
    const fontStyle = segment.bold && segment.italic ? 'bold italic' :
                      segment.bold ? 'bold' :
                      segment.italic ? 'italic' : '';
    const font = `${fontStyle} ${baseFontSize}px Merriweather, "Noto Emoji", Emoji, sans-serif`.trim();
    ctx.font = font;
    
    // Split segment text by spaces to enable wrapping
    const words = segment.text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordWithSpace = i < words.length - 1 ? word + ' ' : word;
      const wordWidth = ctx.measureText(wordWithSpace).width;
      
      // Check if adding this word would exceed maxWidth
      if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
        // Save current line and start a new one
        lines.push({ segments: currentLine, width: currentWidth });
        currentLine = [];
        currentWidth = 0;
      }
      
      // Add word to current line
      currentLine.push({
        text: wordWithSpace,
        bold: segment.bold,
        italic: segment.italic,
      });
      currentWidth += wordWidth;
    }
  }
  
  // Add remaining line
  if (currentLine.length > 0) {
    lines.push({ segments: currentLine, width: currentWidth });
  }
  
  return lines;
}

/**
 * Render segments with different fonts on canvas
 */
function renderSegmentedLine(
  ctx: any,
  segments: TextSegment[],
  x: number,
  y: number,
  baseFontSize: number,
  color: string,
  highlights: Array<{ phrase: string; color?: string }>,
  maxWidth: number,
  lineHeight: number,
): number {
  // Wrap segments into multiple lines if needed
  const wrappedLines = wrapSegments(ctx, segments, maxWidth, baseFontSize);
  
  let currentY = y;
  
  // Build full text for highlight detection
  const fullText = segments.map(s => s.text).join('');
  
  // Draw each line
  for (const line of wrappedLines) {
    let currentX = x;
    
    // Draw each segment in the line
    for (const segment of line.segments) {
      // Handle bold, italic, or both
      const fontStyle = segment.bold && segment.italic ? 'bold italic' :
                        segment.bold ? 'bold' :
                        segment.italic ? 'italic' : '';
      const font = `${fontStyle} ${baseFontSize}px Merriweather, "Noto Emoji", Emoji, sans-serif`.trim();
      ctx.font = font;
      
      // Check if this segment should be highlighted
      let shouldHighlight = false;
      let highlightColor = '#F0E231';
      
      for (const hi of highlights) {
        if (segment.text.includes(hi.phrase) || fullText.includes(hi.phrase)) {
          shouldHighlight = true;
          highlightColor = hi.color || '#F0E231';
          break;
        }
      }
      
      // Draw highlight if needed
      if (shouldHighlight) {
        const textWidth = ctx.measureText(segment.text).width;
        const padX = 10;
        ctx.fillStyle = highlightColor;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(
          currentX - padX,
          currentY - baseFontSize * 0.85,
          textWidth + padX * 2,
          baseFontSize
        );
        ctx.globalAlpha = 1.0;
      }
      
      // Draw text
      ctx.fillStyle = color;
      ctx.fillText(segment.text, currentX, currentY);
      currentX += ctx.measureText(segment.text).width;
    }
    
    currentY += lineHeight;
  }
  
  // Return total height used
  return wrappedLines.length * lineHeight;
}

/**
 * Generate a single slide from markdown content
 */
async function generateMarkdownSlide(
  slide: MarkdownSlide,
  bgImage: any,
  outputPath: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  const padding = 100;
  const maxWidth = WIDTH - padding * 2;
  let currY = 250; // Start from top with some padding

  // Parse slide content into rendered lines
  const renderedLines = parseSlideContent(slide.content);

  // Calculate actual content height by accounting for wrapping
  let estimatedHeight = 0;
  for (const line of renderedLines) {
    const lineIndent = line.indent || 0;
    const lineMaxWidth = maxWidth - lineIndent;
    
    // Calculate how many wrapped lines this will create
    const wrappedLines = wrapSegments(ctx, line.segments, lineMaxWidth, line.baseFontSize);
    estimatedHeight += wrappedLines.length * line.lineHeight;
    
    // Add extra spacing before large headers (same as render logic)
    if (line.baseFontSize >= 54 && estimatedHeight > 0) {
      estimatedHeight += 30;
    }
    
    // Add extra spacing after this line type (same as render logic)
    if (line.extraSpacingAfter) {
      estimatedHeight += line.extraSpacingAfter;
    }
    
    // Add spacing after blockquotes (same as render logic)
    if (line.type === 'blockquote') {
      estimatedHeight += 10;
    }
  }

  // Center content vertically
  currY = (HEIGHT - estimatedHeight) / 2;

  // Draw each line
  for (const line of renderedLines) {
    const lineIndent = line.indent || 0;
    const lineMaxWidth = maxWidth - lineIndent;

    // Add extra spacing before large headers
    if (line.baseFontSize >= 54 && currY > 300) {
      currY += 30;
    }

    // Render the line with proper wrapping
    const heightUsed = renderSegmentedLine(
      ctx,
      line.segments,
      padding + lineIndent,
      currY,
      line.baseFontSize,
      line.color,
      line.highlights,
      lineMaxWidth,
      line.lineHeight,
    );

    currY += heightUsed;

    // Add extra spacing after large headers
    if (line.baseFontSize >= 54) {
      currY += 20;
    }
    
    // Add extra spacing after specific line types (e.g., bullet points)
    if (line.extraSpacingAfter) {
      currY += line.extraSpacingAfter;
    }

    // Add spacing after blockquotes
    if (line.type === 'blockquote') {
      currY += 10;
    }
  }

  // Save
  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

/**
 * Generate a markdown carousel from input data
 */
export async function generateMarkdownCarousel(
  input: MarkdownCarouselInput,
): Promise<MarkdownCarouselOutput> {
  // Register fonts
  registerFonts();

  // Load background image
  const currentDir = Deno.cwd();
  const bgImage = await loadImage(join(currentDir, 'assets', 'images', 'background.jpeg'));

  // Parse markdown into slides
  const slides = parseMarkdownSlides(input.markdown);

  if (slides.length === 0) {
    throw new Error('No slides found in markdown. Slides should be separated by ---');
  }

  const outputPrefix = input.outputPrefix || 'markdown_carousel';
  const outputs: string[] = [];

  // Generate each slide
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const outputPath = `${outputPrefix}_slide_${i + 1}.jpg`;

    console.error(`Generating slide ${i + 1}/${slides.length}...`);

    await generateMarkdownSlide(slide, bgImage, outputPath);
    outputs.push(outputPath);
  }

  return {
    success: true,
    slideCount: outputs.length,
    files: outputs,
  };
}

/**
 * CLI entry point for generating markdown carousels
 */
export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error('Error: No input JSON provided');
    Deno.exit(1);
  }

  let input: MarkdownCarouselInput;
  try {
    input = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }

  try {
    const output = await generateMarkdownCarousel(input);
    console.log(JSON.stringify(output));
  } catch (error) {
    console.error('Error generating markdown carousel:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

