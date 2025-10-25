// Text parsing and manipulation utilities

import type { ParsedText, HighlightItem, PhraseIndex } from '../types/index.ts';

/**
 * Parse text with <mark> tags and extract highlighted phrases
 * Also handles <br> and <br/> tags by converting them to newlines
 */
export function parseMarkedText(markedText: string): ParsedText {
  // First, replace <br> and <br/> tags with newlines
  let processedText = markedText.replace(/<br\s*\/?>/gi, '\n');
  
  const regex = /<mark>(.*?)<\/mark>/g;
  const highlights: HighlightItem[] = [];
  let cleanText = '';
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(processedText)) !== null) {
    cleanText += processedText.slice(lastIndex, match.index);
    highlights.push({ phrase: match[1] });
    cleanText += match[1];
    lastIndex = match.index + match[0].length;
  }
  cleanText += processedText.slice(lastIndex);
  
  return { text: cleanText, highlights };
}

/**
 * Find all occurrences of a phrase in a string
 */
export function findAllPhraseIndices(
  line: string,
  phrase: string,
): PhraseIndex[] {
  const indices: PhraseIndex[] = [];
  let startIndex = 0;
  
  while (startIndex < line.length) {
    const idx = line.indexOf(phrase, startIndex);
    if (idx === -1) break;
    indices.push({ start: idx, end: idx + phrase.length });
    startIndex = idx + phrase.length;
  }
  
  return indices;
}

/**
 * Wrap text into lines based on maximum width
 */
export function wrapText(
  ctx: any,
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
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  
  return lines;
}

/**
 * Balanced text wrapping for titles (2-3 lines, minimizes raggedness)
 */
export function balancedWrapText(
  ctx: any,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  ctx.font = font;
  const words = text.split(' ');
  let bestLines: string[] | null = null;
  let minRaggedness = Infinity;

  // Try all possible break points for 2 or 3 lines
  for (let linesCount = 2; linesCount <= 3; linesCount++) {
    function search(line: string, idx: number, currLines: string[]): void {
      if (currLines.length === linesCount - 1) {
        const lastLine = words.slice(idx).join(' ');
        currLines.push(lastLine);
        
        // Score: sum of squared difference from maxWidth
        let raggedness = currLines.reduce((sum, l) => {
          const w = ctx.measureText(l).width;
          return sum + Math.pow(maxWidth - w, 2);
        }, 0);
        
        // Penalize single-word last lines
        if (currLines[currLines.length - 1].split(' ').length === 1) {
          raggedness += 1e6;
        }
        
        if (raggedness < minRaggedness) {
          minRaggedness = raggedness;
          bestLines = currLines.slice();
        }
        
        currLines.pop();
        return;
      }
      
      for (
        let i = idx + 1;
        i < words.length - (linesCount - currLines.length - 1);
        i++
      ) {
        const line = words.slice(idx, i).join(' ');
        search(line, i, currLines.concat([line]));
      }
    }
    
    search('', 0, []);
  }
  
  // Fallback: greedy wrap
  if (!bestLines) {
    bestLines = wrapText(ctx, text, maxWidth, font);
  }
  
  return bestLines;
}

/**
 * Calculate how many lines each item will need when wrapped
 */
export function calculateItemHeights(
  ctx: any,
  points: string[],
  font: string,
  maxWidth: number,
): number[] {
  ctx.font = font;
  const heights: number[] = [];
  
  for (const text of points) {
    const words = text.split(' ');
    let lineCount = 0;
    let line = '';
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        lineCount++;
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lineCount++; // Last line
    heights.push(lineCount);
  }
  
  return heights;
}

/**
 * Randomize capitalization of letters within each word
 * Example: "Hello World" -> "hElLo WoRLd"
 */
export function randomizeCapitalization(text: string): string {
  return text.split(' ').map(word => {
    return word.split('').map(char => {
      if (char.match(/[a-zA-Z]/)) {
        return Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase();
      }
      return char;
    }).join('');
  }).join(' ');
}

/**
 * Transform quote text for handwritten style
 * - Randomizes capitalization per word
 * - Replaces dashes with semicolons
 */
export function transformQuoteText(text: string): string {
  // Replace all dashes with semicolons
  const withSemicolons = text.replace(/-/g, ';');
  
  // Randomize capitalization
  return randomizeCapitalization(withSemicolons);
}

