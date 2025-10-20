import {
  Canvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
} from 'npm:@napi-rs/canvas@^0.1.52';

// Register fonts
GlobalFonts.registerFromPath('./Merriweather-Regular.ttf', 'Merriweather');
GlobalFonts.registerFromPath('./Merriweather-Bold.ttf', 'Merriweather');
GlobalFonts.registerFromPath('./Merriweather-Italic.ttf', 'Merriweather');

const WIDTH = 1080;
const HEIGHT = 1350;
const canvas = new Canvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// --- DYNAMIC INPUT ---
// Require input as a JSON string argument (for n8n)
if (!Deno.args[0]) {
  console.error(
    'Error: No input JSON provided. Pass the input as a single JSON string argument.',
  );
  Deno.exit(1);
}

interface HighlightItem {
  phrase: string;
}

interface ParsedText {
  text: string;
  highlights: HighlightItem[];
}

interface InputItem {
  title: string;
  list: string[];
}

let input: InputItem[];
try {
  input = JSON.parse(Deno.args[0]);
} catch (e) {
  console.error('Failed to parse input JSON:', e);
  Deno.exit(1);
}

// --- PARSING LOGIC ---
function parseMarkedText(markedText: string): ParsedText {
  // Returns {text: string, highlights: [{phrase: string}]}
  const regex = /<mark>(.*?)<\/mark>/g;
  const highlights: HighlightItem[] = [];
  let cleanText = '';
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(markedText)) !== null) {
    cleanText += markedText.slice(lastIndex, match.index);
    highlights.push({ phrase: match[1] });
    cleanText += match[1];
    lastIndex = match.index + match[0].length;
  }
  cleanText += markedText.slice(lastIndex);
  return { text: cleanText, highlights };
}

// --- EXTRACT DYNAMIC DATA ---
const parsedTitle = parseMarkedText(input[0].title);
const title = parsedTitle.text;
const titleHighlight = parsedTitle.highlights;

const points: string[] = [];
const highlights: HighlightItem[][] = [];
for (const item of input[0].list) {
  // If multiple <mark>...</mark> in one string separated by §§§, split and treat as separate points
  const subpoints = item.split('§§§');
  for (const sub of subpoints) {
    const parsed = parseMarkedText(sub);
    points.push(parsed.text);
    highlights.push(parsed.highlights);
  }
}

const TITLE_FONT = 'bold 64px Merriweather'; // 54px * 1.5
const TITLE_LINE_HEIGHT = 70; // 62 * 1.5
const AUTHOR_FONT = 'italic 20px Merriweather'; // 26px * 0.5

interface PhraseIndex {
  start: number;
  end: number;
}

// Helper: find all occurrences of a phrase in a string, return [{start, end}]
function findAllPhraseIndices(line: string, phrase: string): PhraseIndex[] {
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

// Utility: wrap and center text
function drawWrappedCenteredText(
  ctx: SKRSContext2D,
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
  for (let i = 0; i < lines.length; i++) {
    const lw = ctx.measureText(lines[i]).width;
    ctx.fillText(lines[i], x + (maxWidth - lw) / 2, y + i * lineHeight);
  }
  return lines.length * lineHeight;
}

// Highlight: simple rectangle (Docker-compatible - NO save/restore/globalAlpha)
function drawWavyHighlight(
  ctx: SKRSContext2D,
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

interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Improved drawTextWithHighlight: wraps, highlights, and wavy
function drawTextWithHighlightWrapped(
  ctx: SKRSContext2D,
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
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  const lineStartIndices: number[] = [];
  let charCount = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      lineStartIndices.push(charCount);
      charCount += line.length;
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  lineStartIndices.push(charCount);

  let currY = y;
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    const lineStart = lineStartIndices[l];
    const lineEnd = lineStart + line.length;
    const currX = x;
    // --- Collect highlight rects for this line ---
    const highlightRects: HighlightRect[] = [];
    // For each phrase, find all matches in this line
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
        // Calculate half a character width (space character)
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

// Balanced, centered wrapping for title
function balancedWrapText(
  ctx: SKRSContext2D,
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
    bestLines = lines;
  }
  return bestLines;
}

// Draw balanced, centered, highlighted title
function drawBalancedCenteredTitleWithHighlight(
  ctx: SKRSContext2D,
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
  const totalHeight = lines.length * lineHeight;
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
  return totalHeight;
}

// Helper: Calculate how many lines each item will need
function calculateItemHeights(
  ctx: SKRSContext2D,
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

// Main execution
try {
  // Load background image
  const bg = await loadImage('./background.jpeg');
  ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

  // Padding
  const PAD_X = 60;
  let currY = 90;

  // Title (balanced, centered, with highlight)
  ctx.font = TITLE_FONT;
  const titleHeight = drawBalancedCenteredTitleWithHighlight(
    ctx,
    title,
    PAD_X,
    currY,
    titleHighlight,
    TITLE_FONT,
    '#F0E231',
    WIDTH - PAD_X * 2,
    TITLE_LINE_HEIGHT,
  );
  currY += titleHeight - 20;

  // Author (centered, italic, smaller)
  ctx.font = 'italic 20px Merriweather';
  ctx.fillStyle = '#666';
  const author = 'by Compounding Wisdom';
  const authorWidth = ctx.measureText(author).width;
  ctx.fillText(author, (WIDTH - authorWidth) / 2, currY);
  currY += 30;

  // Divider line
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD_X, currY);
  ctx.lineTo(WIDTH - PAD_X, currY);
  ctx.stroke();
  currY += 40;

  const listStartY = currY;

  // Calculate heights for all items to determine if we need to adjust spacing
  const LIST_FONT = '26px Merriweather';
  const BASE_LINE_HEIGHT = 47;
  const numWidth = ctx.measureText('20.').width;
  const itemHeights = calculateItemHeights(
    ctx,
    points,
    LIST_FONT,
    WIDTH - PAD_X * 2 - numWidth - 12,
  );

  // Calculate total needed height
  const totalLines = itemHeights.reduce((sum, h) => sum + h, 0);
  const baseItemSpacing = 2;
  const extraSpacing = 12; // Extra spacing after items 8 and 14
  const estimatedHeight =
    totalLines * BASE_LINE_HEIGHT + 20 * baseItemSpacing + extraSpacing;
  const availableHeight = HEIGHT - listStartY - 30; // 30px bottom padding

  // Dynamically adjust line height if content is too tall
  let LIST_LINE_HEIGHT = BASE_LINE_HEIGHT;
  let itemSpacing = baseItemSpacing;

  if (estimatedHeight > availableHeight) {
    // Calculate adjusted line height to fit everything
    const targetHeight = availableHeight - 20 * itemSpacing - extraSpacing;
    LIST_LINE_HEIGHT = Math.floor(targetHeight / totalLines);
    // Ensure minimum readable line height
    if (LIST_LINE_HEIGHT < 38) {
      LIST_LINE_HEIGHT = 38;
      itemSpacing = 0; // Remove item spacing if still too tight
    }
  }

  // List
  for (let i = 0; i < 20; ++i) {
    ctx.font = LIST_FONT;
    ctx.fillStyle = '#222';
    const numStr = i + 1 + '.';
    const numWidth = ctx.measureText(numStr).width;
    ctx.fillText(numStr, PAD_X, currY + 26);
    const usedHeight = drawTextWithHighlightWrapped(
      ctx,
      points[i],
      PAD_X + numWidth + 12,
      currY + 26,
      highlights[i],
      LIST_FONT,
      '#F0E231',
      WIDTH - PAD_X * 2 - numWidth - 12,
      LIST_LINE_HEIGHT,
    );
    currY += usedHeight + itemSpacing;
    if (i === 7 || i === 13) currY += 6;
  }

  // Export image as JPEG
  const outputBuffer = await canvas.encode('jpeg', 95);
  await Deno.writeFile('real_life_cheat_codes_instagram.jpg', outputBuffer);
  console.log('Image generated as real_life_cheat_codes_instagram.jpg');
} catch (error) {
  console.error('Error generating image:', error);
  Deno.exit(1);
}
