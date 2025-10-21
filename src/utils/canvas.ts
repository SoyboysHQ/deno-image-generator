// Canvas drawing utilities

import type { HighlightItem, HighlightRect, PhraseIndex } from '../types/index.ts';
import { findAllPhraseIndices, wrapText, balancedWrapText } from './text.ts';

/**
 * Draw wavy highlight background (simple rectangle for Docker compatibility)
 */
export function drawWavyHighlight(
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  // Docker canvas doesn't handle save/restore or globalAlpha properly
  // Use a semi-transparent color instead
  ctx.fillStyle = 'rgba(240, 226, 49, 0.7)'; // #F0E231 at 70% opacity
  
  // Position highlight behind text - adjust Y coordinate
  // Text baseline is at y, move up much less to position lower behind text
  ctx.fillRect(x, y, width, height);
}

/**
 * Draw highlight background with rounded corners and wavy edges (for carousel)
 */
export function drawHighlight(
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  ctx.save();
  ctx.beginPath();

  const waveAmp = 1 + Math.random() * 0.5; // very subtle wave
  const waveLen = 18;
  const radius = 8;

  // Top edge (wavy)
  ctx.moveTo(x + radius, y);
  for (let i = 0; i <= width - 2 * radius; i += waveLen) {
    ctx.lineTo(
      x + radius + i,
      y + Math.sin((i / (width - 2 * radius)) * Math.PI * 2) * waveAmp,
    );
  }
  ctx.lineTo(x + width - radius, y);

  // Top-right corner
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

  // Right edge
  ctx.lineTo(x + width, y + height - radius);

  // Bottom-right corner
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);

  // Bottom edge (wavy)
  for (let i = width - 2 * radius; i >= 0; i -= waveLen) {
    ctx.lineTo(
      x + radius + i,
      y +
        height +
        Math.sin((i / (width - 2 * radius)) * Math.PI * 2 + Math.PI) * waveAmp,
    );
  }
  ctx.lineTo(x + radius, y + height);

  // Bottom-left corner
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

  // Left edge
  ctx.lineTo(x, y + radius);

  // Top-left corner
  ctx.quadraticCurveTo(x, y, x + radius, y);

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

/**
 * Draw wrapped and centered text
 */
export function drawWrappedCenteredText(
  ctx: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: string,
  color: string,
  lineHeight: number,
): number {
  ctx.font = font;
  ctx.fillStyle = color;
  const lines = wrapText(ctx, text, maxWidth, font);
  
  for (let i = 0; i < lines.length; i++) {
    const lw = ctx.measureText(lines[i]).width;
    ctx.fillText(lines[i], x + (maxWidth - lw) / 2, y + i * lineHeight);
  }
  
  return lines.length * lineHeight;
}

/**
 * Draw text with highlighted phrases (wrapped, supports multiple lines)
 */
export function drawTextWithHighlightWrapped(
  ctx: any,
  text: string,
  x: number,
  y: number,
  highlights: HighlightItem[] | undefined,
  normalFont: string,
  highlightColor: string,
  maxWidth: number,
  lineHeight: number,
): number {
  ctx.font = normalFont;
  const lines = wrapText(ctx, text, maxWidth, normalFont);
  const lineStartIndices: number[] = [];
  
  let charCount = 0;
  for (const line of lines) {
    lineStartIndices.push(charCount);
    charCount += line.length + 1; // +1 for space
  }

  let currY = y;
  
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    const currX = x;
    
    // Collect highlight rects for this line
    const highlightRects: HighlightRect[] = [];
    
    for (const hi of highlights || []) {
      const phrase = hi.phrase;
      const matches = findAllPhraseIndices(line, phrase);
      
      for (const match of matches) {
        const prefix = line.slice(0, match.start);
        const highlightText = line.slice(match.start, match.end);
        const prefixWidth = ctx.measureText(prefix).width;
        const highlightWidth = ctx.measureText(highlightText).width;
        const fontSize = parseInt(normalFont, 10) || 26;
        const padY = 0;
        const padX = 10;
        const halfChar = ctx.measureText(' ').width / 2;
        
        highlightRects.push({
          x: currX + prefixWidth - padX + halfChar,
          y: currY - fontSize * 0.85 - padY,
          width: highlightWidth + padX * 2 - halfChar * 3,
          height: fontSize,
        });
      }
    }
    
    // Draw all highlight rects first
    for (const rect of highlightRects) {
      drawWavyHighlight(
        ctx,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        highlightColor,
      );
    }
    
    // Now draw the text
    ctx.font = normalFont;
    ctx.fillStyle = '#222';
    ctx.fillText(line, currX, currY);
    currY += lineHeight;
  }
  
  return lines.length * lineHeight;
}

/**
 * Draw balanced, centered title with highlights
 */
export function drawBalancedCenteredTitleWithHighlight(
  ctx: any,
  text: string,
  x: number,
  y: number,
  highlights: HighlightItem[],
  font: string,
  highlightColor: string,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = balancedWrapText(ctx, text, maxWidth, font);
  let currY = y;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lw = ctx.measureText(line).width;
    
    // Find highlights for this line
    const lineHighlights: PhraseIndex[] = [];
    for (const hi of highlights || []) {
      const phrase = hi.phrase;
      const matches = findAllPhraseIndices(line, phrase);
      for (const match of matches) {
        lineHighlights.push({ start: match.start, end: match.end });
      }
    }
    
    // Draw highlight rects
    const currX = x + (maxWidth - lw) / 2;
    const highlightRects: HighlightRect[] = [];
    
    for (const hi of lineHighlights) {
      const prefix = line.slice(0, hi.start);
      const highlightText = line.slice(hi.start, hi.end);
      const prefixWidth = ctx.measureText(prefix).width;
      const highlightWidth = ctx.measureText(highlightText).width;
      const fontSize = parseInt(font, 10) || 54;
      const padY = 0;
      const padX = 10;
      const halfChar = ctx.measureText(' ').width / 2;
      
      highlightRects.push({
        x: currX + prefixWidth - padX + halfChar * 2,
        y: currY - fontSize * 0.85 - padY,
        width: highlightWidth + padX * 2 - halfChar * 4,
        height: fontSize,
      });
    }
    
    for (const rect of highlightRects) {
      drawWavyHighlight(
        ctx,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        highlightColor,
      );
    }
    
    ctx.font = font;
    ctx.fillStyle = '#222';
    ctx.fillText(line, currX, currY);
    currY += lineHeight;
  }
  
  return lines.length * lineHeight;
}

/**
 * Draw text with highlights for carousel (supports bold highlights and center alignment)
 */
export function drawTextWithHighlights(
  ctx: any,
  text: string,
  x: number,
  y: number,
  highlights: HighlightItem[],
  font: string,
  textColor: string,
  highlightColor: string,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' = 'left',
  boldHighlights: boolean = false,
): number {
  // Split by newlines first to respect explicit line breaks
  const textSegments = text.split('\n');
  const allLines: string[] = [];

  // Wrap each segment separately
  for (const segment of textSegments) {
    const wrappedLines = wrapText(ctx, segment, maxWidth, font);
    allLines.push(...wrappedLines);
  }

  let currY = y;

  for (const line of allLines) {
    ctx.font = font;
    const lineWidth = ctx.measureText(line).width;
    const lineX = align === 'center' ? x + (maxWidth - lineWidth) / 2 : x;

    // Find highlights in this line
    const lineHighlights: PhraseIndex[] = [];
    for (const hi of highlights) {
      const matches = findAllPhraseIndices(line, hi.phrase);
      lineHighlights.push(...matches);
    }

    // Draw highlight backgrounds
    const fontSize = parseInt(font.match(/\d+/)?.[0] || '26', 10);
    const halfChar = ctx.measureText(' ').width / 2;

    for (const hi of lineHighlights) {
      const prefix = line.slice(0, hi.start);
      const highlightText = line.slice(hi.start, hi.end);
      const prefixWidth = ctx.measureText(prefix).width;
      const highlightWidth = ctx.measureText(highlightText).width;
      const padX = 10;
      const padY = 0;

      drawHighlight(
        ctx,
        lineX + prefixWidth - padX + halfChar,
        currY - fontSize * 0.85 - padY,
        highlightWidth + padX * 2 - halfChar,
        fontSize,
        highlightColor,
      );
    }

    // Draw text
    ctx.fillStyle = textColor;

    if (boldHighlights && lineHighlights.length > 0) {
      // Draw text in segments with bold for highlighted parts
      const boldFont = font.includes('bold')
        ? font
        : font.replace(/^/, 'bold ');

      // Sort highlights by start position
      const sortedHighlights = [...lineHighlights].sort(
        (a, b) => a.start - b.start,
      );

      let currentX = lineX;
      let lastEnd = 0;

      for (const hi of sortedHighlights) {
        // Draw non-highlighted text before this highlight
        if (hi.start > lastEnd) {
          const beforeText = line.slice(lastEnd, hi.start);
          ctx.font = font;
          ctx.fillText(beforeText, currentX, currY);
          currentX += ctx.measureText(beforeText).width;
        }

        // Draw highlighted text in bold
        const highlightText = line.slice(hi.start, hi.end);
        ctx.font = boldFont;
        ctx.fillText(highlightText, currentX, currY);
        currentX += ctx.measureText(highlightText).width;

        lastEnd = hi.end;
      }

      // Draw any remaining non-highlighted text
      if (lastEnd < line.length) {
        const afterText = line.slice(lastEnd);
        ctx.font = font;
        ctx.fillText(afterText, currentX, currY);
      }
    } else {
      // Draw text normally (non-bold highlights)
      ctx.fillText(line, lineX, currY);
    }

    currY += lineHeight;
  }

  return allLines.length * lineHeight;
}

