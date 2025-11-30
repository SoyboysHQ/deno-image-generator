// Book Takeaways Carousel generator

import { Canvas, loadImage } from 'npm:@napi-rs/canvas@^0.1.52';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import type { BookTakeawaysCarouselInput, BookTakeawaysCarouselOutput, BookTakeawaysSlide } from '../types/index.ts';
import { parseMarkedText, wrapText, findAllPhraseIndices } from '../utils/text.ts';
import { drawTextWithHighlights, drawHighlight } from '../utils/canvas.ts';
import { registerFonts } from '../utils/fonts.ts';

const WIDTH = 1080;
const HEIGHT = 1350;

/**
 * Download an image from a URL
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  console.error(`[BookTakeawaysCarousel] Downloading image from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const imageData = await response.arrayBuffer();
  await Deno.writeFile(outputPath, new Uint8Array(imageData));
  console.error(`[BookTakeawaysCarousel] ✅ Image downloaded: ${outputPath}`);
}

/**
 * Convert markdown bold (**text**) to <mark> tags for highlighting
 */
function convertMarkdownBoldToMark(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<mark>$1</mark>');
}

/**
 * Parse text with **bold** markdown and return segments with bold info
 */
interface TextSegment {
  text: string;
  bold: boolean;
}

function parseBoldMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        bold: false,
      });
    }
    // Add bold text
    segments.push({
      text: match[1],
      bold: true,
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      bold: false,
    });
  }

  // If no bold found, return whole text as one segment
  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}

/**
 * Load and draw SVG bookmark icon
 */
async function drawBookmarkIcon(ctx: any, x: number, y: number, size: number): Promise<void> {
  const currentDir = Deno.cwd();
  const svgPath = join(currentDir, 'assets', 'icons', 'save.svg');
  
  try {
    const svgImage = await loadImage(svgPath);
    // Scale SVG to desired size and apply 60% opacity
    ctx.save();
    ctx.globalAlpha = 0.6; // 60% opacity
    ctx.drawImage(svgImage, x, y, size, size);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  } catch (error) {
    console.error(`Failed to load bookmark icon: ${error}`);
    // Fallback: draw simple bookmark shape if SVG fails
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.globalAlpha = 0.6;
    const width = size * 0.6;
    const height = size;
    const notchSize = size * 0.15;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height - notchSize);
    ctx.lineTo(x + width / 2 + notchSize / 2, y + height - notchSize);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x + width / 2 - notchSize / 2, y + height - notchSize);
    ctx.lineTo(x, y + height - notchSize);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
}

/**
 * Generate cover slide from downloaded image
 */
async function generateCoverSlide(
  coverImagePath: string,
  outputPath: string,
  coverText?: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Load the cover image
  const coverImage = await loadImage(coverImagePath);

  // Calculate scaling to fit canvas while maintaining aspect ratio
  const imgWidth = coverImage.width;
  const imgHeight = coverImage.height;
  const imgAspect = imgWidth / imgHeight;
  const canvasAspect = WIDTH / HEIGHT;

  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  if (imgAspect > canvasAspect) {
    // Image is wider - fit to height
    drawHeight = HEIGHT;
    drawWidth = imgWidth * (HEIGHT / imgHeight);
    drawX = (WIDTH - drawWidth) / 2;
    drawY = 0;
  } else {
    // Image is taller - fit to width
    drawWidth = WIDTH;
    drawHeight = imgHeight * (WIDTH / imgWidth);
    drawX = 0;
    drawY = (HEIGHT - drawHeight) / 2;
  }

  // Fill background with white (in case of cropping)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw the cover image
  ctx.drawImage(coverImage, drawX, drawY, drawWidth, drawHeight);

  // Save
  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

/**
 * Generate point slide (similar to existing carousel point slides)
 */
async function generatePointSlide(
  slide: BookTakeawaysSlide,
  bgImage: any,
  outputPath: string,
  authorSlug?: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Draw paper background
  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  const padding = 100;
  let currY = 400;

  // Parse title with highlights (convert markdown bold to <mark> tags first)
  const titleWithMark = convertMarkdownBoldToMark(slide.title);
  const parsed = parseMarkedText(titleWithMark);
  const titleFont = 'bold 48px Merriweather';
  const titleLineHeight = 65; // Original line height

  // Wrap title to see how many lines we have
  ctx.font = titleFont;
  const titleLines = wrapText(ctx, parsed.text, WIDTH - padding * 2, titleFont);

  // Add entire title as highlight if no highlights exist
  // For multi-line titles, highlight each line separately
  const titleHighlights = parsed.highlights.length > 0
    ? parsed.highlights
    : titleLines.map(line => ({ phrase: line.trim() }));

  const titleHeight = drawTextWithHighlights(
    ctx,
    parsed.text,
    padding,
    currY,
    titleHighlights,
    titleFont,
    '#222',
    '#F0E231',
    WIDTH - padding * 2,
    titleLineHeight,
    'left',
    false, // boldHighlights
    false, // slantedEnds - reverted to original
  );

  currY += titleHeight + 40;

  // Draw body text (handle both <mark> highlights and **bold** markdown)
  // Split by \n\n for paragraphs, then handle \n within paragraphs
  const bodyParagraphs = (slide.body || '').split('\n\n');

    for (const para of bodyParagraphs) {
    const bodyFont = '32px Merriweather';
    const bodyLineHeight = 52; // Original line height
    
    // Split paragraph by \n to get explicit line breaks
    const paraLines = para.split('\n');
    
    for (const paraLine of paraLines) {
      // Process each line segment independently
      // First, remove ** markers and parse bold segments
      const boldSegments = parseBoldMarkdown(paraLine);
      const bodyText = boldSegments.map(s => s.text).join('');
      
      // Then parse <mark> tags for highlights
      const bodyParsed = parseMarkedText(bodyText);
      
      // Build bold map for this line segment (0-based for this paraLine)
      let charPos = 0;
      const boldMap = new Map<number, boolean>();
      for (const seg of boldSegments) {
        for (let i = 0; i < seg.text.length; i++) {
          boldMap.set(charPos + i, seg.bold);
        }
        charPos += seg.text.length;
      }
      
      // Wrap this line segment if it's too long
      ctx.font = bodyFont;
      const wrappedLines = wrapText(ctx, bodyParsed.text, WIDTH - padding * 2, bodyFont);
      
      // Check if original paraLine starts with bullet
      const paraLineStartsWithBullet = paraLine.trim().startsWith('•');
      let isFirstWrappedLine = true;
      
      // Track position in original text as we process wrapped lines
      let textOffset = 0;
      
      // Draw each wrapped line
      for (const line of wrappedLines) {
        // Find where this line starts in the original text
        // Search from current offset to find the line (accounting for trimmed spaces)
        const remainingText = bodyParsed.text.slice(textOffset);
        const lineTrimmed = line.trim();
        let lineStartPos = textOffset;
        
        // Try to find the line in remaining text
        const foundIndex = remainingText.indexOf(lineTrimmed);
        if (foundIndex >= 0) {
          lineStartPos = textOffset + foundIndex;
        }
        
        // Draw highlights first
        for (const hi of bodyParsed.highlights) {
          const matches = findAllPhraseIndices(line, hi.phrase);
          for (const match of matches) {
            const prefix = line.slice(0, match.start);
            const highlightText = line.slice(match.start, match.end);
            ctx.font = bodyFont;
            const prefixWidth = ctx.measureText(prefix).width;
            const highlightWidth = ctx.measureText(highlightText).width;
            const fontSize = 32;
            const padX = 10;
            const halfChar = ctx.measureText(' ').width / 2;

            // Use drawHighlight for book takeaways carousel
            // Color: rgb(189, 177, 10) = #BDB10A
            drawHighlight(
              ctx,
              padding + prefixWidth - padX + halfChar,
              currY - fontSize * 0.85,
              highlightWidth + padX * 2 - halfChar * 2,
              fontSize,
              '#BDB10A',
              false, // slantedEnds - reverted to original
            );
          }
        }
        
        // Draw text with bold segments and bigger bullets
        // Check if this is the first wrapped line and original line starts with bullet
        const hasBullet = paraLineStartsWithBullet && isFirstWrappedLine && lineTrimmed.startsWith('•');
        let currentX = padding;
        
        if (hasBullet) {
          // First line of paragraph with bullet - render bullet bigger and vertically centered
          ctx.font = 'bold 42px Merriweather'; // Bigger bullet (42px vs 32px body)
          const bulletWidth = ctx.measureText('•').width;
          ctx.fillStyle = '#222';
          ctx.fillText('•', currentX, currY); // Vertically centered (same baseline as text)
          currentX += bulletWidth + 6; // 6px spacing after bullet
          
          // Render rest of line - find bullet position in original line
          const leadingSpaces = line.length - line.trimStart().length;
          const bulletIndexInLine = leadingSpaces; // Bullet is right after leading spaces
          
          // Render the rest of the line using normal logic, starting after bullet
          for (let i = bulletIndexInLine + 1; i < line.length; i++) {
            // Map to original text position
            const charPosInOriginal = lineStartPos + i;
            const isBold = boldMap.get(charPosInOriginal) || false;
            const fontToUse = isBold ? `bold ${bodyFont}` : bodyFont;
            ctx.font = fontToUse;
            ctx.fillStyle = isBold ? '#000' : '#222';
            
            // Group consecutive same-style characters
            let j = i;
            while (j < line.length && (boldMap.get(lineStartPos + j) || false) === isBold) {
              j++;
            }
            
            const textToDraw = line.slice(i, j);
            ctx.fillText(textToDraw, currentX, currY);
            currentX += ctx.measureText(textToDraw).width;
            i = j - 1; // -1 because loop will increment
          }
          isFirstWrappedLine = false;
        } else {
          // Normal line rendering (no bullet or wrapped line)
          for (let i = 0; i < line.length; i++) {
            // Find corresponding position in original text
            // Account for potential leading spaces that were trimmed
            const charPosInOriginal = lineStartPos + i;
            const isBold = boldMap.get(charPosInOriginal) || false;
            const fontToUse = isBold ? `bold ${bodyFont}` : bodyFont;
            ctx.font = fontToUse;
            // Use black (#000) for bold text to make it pop more
            ctx.fillStyle = isBold ? '#000' : '#222';
            
            // Group consecutive same-style characters
            let j = i;
            while (j < line.length && (boldMap.get(lineStartPos + j) || false) === isBold) {
              j++;
            }
            
            const textToDraw = line.slice(i, j);
            ctx.fillText(textToDraw, currentX, currY);
            currentX += ctx.measureText(textToDraw).width;
            i = j - 1; // -1 because loop will increment
          }
          if (isFirstWrappedLine) isFirstWrappedLine = false;
        }
        
        // Update textOffset for next line
        textOffset = lineStartPos + line.length;
        // Skip any trailing space
        while (textOffset < bodyParsed.text.length && bodyParsed.text[textOffset] === ' ') {
          textOffset++;
        }
        
        currY += bodyLineHeight;
      }
    }

    currY += 25; // Spacing between paragraphs (\n\n)
  }

  // Draw author slug at bottom center (like last slide)
  if (authorSlug) {
    const authorFont = 'italic 24px Merriweather';
    ctx.font = authorFont;
    const authorText = `@${authorSlug}`;
    const authorWidth = ctx.measureText(authorText).width;
    const authorX = (WIDTH - authorWidth) / 2;
    const authorY = HEIGHT - 100;
    ctx.fillStyle = 'rgba(34, 34, 34, 0.6)'; // #222 with 60% opacity
    ctx.fillText(authorText, authorX, authorY);
  }

  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

/**
 * Generate CTA closing slide
 */
async function generateCTASlide(
  ctaText1: string | undefined,
  ctaText2: string | undefined,
  ctaText3: string | undefined,
  ctaText4: string | undefined,
  authorSlug: string,
  bgImage: any,
  outputPath: string,
  goodreadsCoverUrl?: string,
): Promise<void> {
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Draw paper background
  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  const padding = 100;
  const maxWidth = WIDTH - padding * 2;

  // Fixed positions for layout
  const saveTextY = HEIGHT - 180; // Fixed position for "Save this for later"
  const authorSlugY = HEIGHT - 120; // Fixed position for author slug
  
  // Calculate available space for CTA text and book cover
  // Reserve space: top padding, CTA text area, book cover (40% height), spacing, and bottom area
  const topPadding = 150;
  const bottomReserved = HEIGHT - saveTextY + 60; // Space for "Save this for later" and author slug
  const bookCoverHeight = HEIGHT * 0.4;
  const availableSpace = HEIGHT - topPadding - bottomReserved - bookCoverHeight - 80; // 80px for spacing
  
  // Draw ctaText1 (centered, with "Read" bolded) - start from top
  let currY = topPadding;
  
  if (ctaText1) {
    // Parse and make "Read" bold
    const parsed = parseMarkedText(convertMarkdownBoldToMark(ctaText1));
    const ctaFont = '38px Merriweather';
    const ctaLineHeight = 60;
    const lines = wrapText(ctx, parsed.text, maxWidth, ctaFont);

    for (const line of lines) {
      ctx.font = ctaFont;
      const lineWidth = ctx.measureText(line).width;
      const lineX = (WIDTH - lineWidth) / 2;

      // Find "Read" and highlight it with pink marker
      const readIndex = line.toLowerCase().indexOf('read');
      if (readIndex !== -1) {
        // Draw text before "Read"
        if (readIndex > 0) {
          const beforeText = line.slice(0, readIndex);
          ctx.font = ctaFont;
          ctx.fillStyle = '#222';
          ctx.fillText(beforeText, lineX, currY);
        }
        
        // Draw "Read" with pink highlight
        const readText = line.slice(readIndex, readIndex + 4);
        ctx.font = ctaFont;
        const beforeWidth = ctx.measureText(line.slice(0, readIndex)).width;
        const readWidth = ctx.measureText(readText).width;
        const fontSize = 38;
        const padX = 10;
        const halfChar = ctx.measureText(' ').width / 2;
        
        // Draw pink highlight (same opacity as yellow: 0.7)
        drawHighlight(
          ctx,
          lineX + beforeWidth - padX + halfChar,
          currY - fontSize * 0.85,
          readWidth + padX * 2 - halfChar * 2,
          fontSize,
          '#FF69B4', // Pink color
          false, // slantedEnds
        );
        
        // Draw "Read" text
        ctx.font = ctaFont;
        ctx.fillStyle = '#222';
        ctx.fillText(readText, lineX + beforeWidth, currY);
        
        // Draw text after "Read"
        if (readIndex + 4 < line.length) {
          const afterText = line.slice(readIndex + 4);
          ctx.font = ctaFont;
          ctx.fillStyle = '#222';
          ctx.fillText(afterText, lineX + beforeWidth + readWidth, currY);
        }
      } else {
        // No "Read" found, draw normally
        ctx.fillStyle = '#222';
        ctx.fillText(line, lineX, currY);
      }
      
      currY += ctaLineHeight;
    }
    
    currY += 30; // Spacing
  }

  // Draw ctaText2 and ctaText3 (left-aligned with bullet points)
  // Align bullets with "Comment" text from first line
  const bulletFont = '38px Merriweather';
  const bulletLineHeight = 60;
  const ctaFont = '38px Merriweather'; // Define ctaFont for use in comment alignment calculation
  
  // Calculate the X position where "Comment" starts to align bullets
  let commentStartX = padding;
  if (ctaText1) {
    ctx.font = ctaFont;
    const cta1Parsed = parseMarkedText(convertMarkdownBoldToMark(ctaText1));
    const firstLine = wrapText(ctx, cta1Parsed.text, maxWidth, ctaFont)[0];
    const commentIndex = firstLine.toLowerCase().indexOf('comment');
    if (commentIndex !== -1) {
      const beforeComment = firstLine.slice(0, commentIndex);
      const firstLineWidth = ctx.measureText(firstLine).width;
      const beforeCommentWidth = ctx.measureText(beforeComment).width;
      commentStartX = (WIDTH - firstLineWidth) / 2 + beforeCommentWidth;
    }
  }
  
  if (ctaText2) {
    // Force line break: "a deeper, expanded version" on first line, "of the key takeaways" on second
    const textToWrap = ctaText2.replace('expanded version', 'expanded version\n');
    const parsed = parseMarkedText(convertMarkdownBoldToMark(textToWrap));
    // Split by explicit line breaks first, then wrap each segment
    const textSegments = parsed.text.split('\n');
    const allLines: string[] = [];
    for (const segment of textSegments) {
      const wrapped = wrapText(ctx, segment, maxWidth - 40, bulletFont);
      allLines.push(...wrapped);
    }
    
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      const bullet = i === 0 ? '• ' : '  '; // Bullet only on first line
      
      ctx.font = bulletFont;
      ctx.fillStyle = '#222';
      // Draw bullet separately with bigger font for larger bullet, aligned with "Comment"
      if (i === 0) {
        ctx.font = 'bold 48px Merriweather'; // Bigger bullet
        const bulletWidth = ctx.measureText('•').width;
        ctx.fillText('•', commentStartX - bulletWidth - 8, currY); // Align with Comment, 8px spacing
        ctx.font = bulletFont;
        
        // Make "expanded version" bold
        const expandedIndex = line.toLowerCase().indexOf('expanded version');
        if (expandedIndex !== -1) {
          // Draw text before "expanded version"
          if (expandedIndex > 0) {
            ctx.font = bulletFont;
            ctx.fillStyle = '#222';
            ctx.fillText(line.slice(0, expandedIndex), commentStartX, currY);
          }
          // Draw "expanded version" in bold
          ctx.font = `bold ${bulletFont}`;
          ctx.fillStyle = '#222';
          const beforeWidth = expandedIndex > 0 ? ctx.measureText(line.slice(0, expandedIndex)).width : 0;
          ctx.fillText('expanded version', commentStartX + beforeWidth, currY);
          // Draw text after "expanded version" (should be empty on first line)
          if (expandedIndex + 'expanded version'.length < line.length) {
            ctx.font = bulletFont;
            ctx.fillStyle = '#222';
            const expandedWidth = ctx.measureText('expanded version').width;
            ctx.fillText(line.slice(expandedIndex + 'expanded version'.length), commentStartX + beforeWidth + expandedWidth, currY);
          }
        } else {
          ctx.fillText(line, commentStartX, currY); // Start text at Comment position
        }
      } else {
        // For subsequent lines (like "of the key takeaways"), draw normally
        ctx.fillText(bullet + line, commentStartX, currY);
      }
      currY += bulletLineHeight;
    }
    
    currY += 20; // Spacing
  }
  
  if (ctaText3) {
    const parsed = parseMarkedText(convertMarkdownBoldToMark(ctaText3));
    const lines = wrapText(ctx, parsed.text, maxWidth - 40, bulletFont);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const bullet = i === 0 ? '• ' : '  '; // Bullet only on first line
      
      ctx.font = bulletFont;
      ctx.fillStyle = '#222';
      // Draw bullet separately with bigger font for larger bullet, aligned with "Comment"
      if (i === 0) {
        ctx.font = 'bold 48px Merriweather'; // Bigger bullet
        const bulletWidth = ctx.measureText('•').width;
        ctx.fillText('•', commentStartX - bulletWidth - 8, currY); // Align with Comment, 8px spacing
        ctx.font = bulletFont;
        
        // Make "link to the book" bold
        const linkIndex = line.toLowerCase().indexOf('link to the book');
        if (linkIndex !== -1) {
          // Draw text before "link to the book"
          if (linkIndex > 0) {
            ctx.font = bulletFont;
            ctx.fillStyle = '#222';
            ctx.fillText(line.slice(0, linkIndex), commentStartX, currY);
          }
          // Draw "link to the book" in bold
          ctx.font = `bold ${bulletFont}`;
          ctx.fillStyle = '#222';
          const beforeWidth = linkIndex > 0 ? ctx.measureText(line.slice(0, linkIndex)).width : 0;
          ctx.fillText('link to the book', commentStartX + beforeWidth, currY);
          // Draw text after "link to the book"
          if (linkIndex + 'link to the book'.length < line.length) {
            ctx.font = bulletFont;
            ctx.fillStyle = '#222';
            const linkWidth = ctx.measureText('link to the book').width;
            ctx.fillText(line.slice(linkIndex + 'link to the book'.length), commentStartX + beforeWidth + linkWidth, currY);
          }
        } else {
          ctx.fillText(line, commentStartX, currY); // Start text at Comment position
        }
      } else {
        ctx.fillText(bullet + line, commentStartX, currY);
      }
      currY += bulletLineHeight;
    }
  }
  
  // Draw cover image between CTA text and "Save this for later" if provided
  if (goodreadsCoverUrl) {
    try {
      const currentDir = Deno.cwd();
      const coverImagePath = join(currentDir, 'temp_goodreads_cover.jpg');
      await downloadImage(goodreadsCoverUrl, coverImagePath);
      const coverImage = await loadImage(coverImagePath);
      
      // Calculate image size: 40% of slide height
      const imageHeight = HEIGHT * 0.4;
      const imageAspect = coverImage.width / coverImage.height;
      const imageWidth = imageHeight * imageAspect;
      
      // Position image: centered horizontally, in the middle area between CTA text and "Save this for later"
      // Calculate position to center it in available space
      const imageX = (WIDTH - imageWidth) / 2;
      const imageY = currY + 40; // Spacing from CTA text above
      const borderRadius = 20;
      const shadowOffset = 8; // Wider spread
      const shadowBlur = 20; // Softer shadow
      
      // Draw drop shadow - equal on all sides with rounded corners on right side
      // Draw multiple shadow layers for softer, wider spread effect
      ctx.save();
      const shadowLayers = [
        { offset: shadowOffset, blur: shadowBlur, opacity: 0.15 },
        { offset: shadowOffset * 0.7, blur: shadowBlur * 0.7, opacity: 0.1 },
        { offset: shadowOffset * 0.4, blur: shadowBlur * 0.4, opacity: 0.08 },
      ];
      
      for (const layer of shadowLayers) {
        ctx.fillStyle = `rgba(0, 0, 0, ${layer.opacity})`;
        ctx.filter = `blur(${layer.blur}px)`;
        
        // Create shadow path with rounded corners on right side
        ctx.beginPath();
        ctx.moveTo(imageX + layer.offset, imageY + layer.offset);
        ctx.lineTo(imageX + imageWidth - borderRadius + layer.offset, imageY + layer.offset);
        ctx.quadraticCurveTo(
          imageX + imageWidth + layer.offset,
          imageY + layer.offset,
          imageX + imageWidth + layer.offset,
          imageY + borderRadius + layer.offset
        );
        ctx.lineTo(imageX + imageWidth + layer.offset, imageY + imageHeight - borderRadius + layer.offset);
        ctx.quadraticCurveTo(
          imageX + imageWidth + layer.offset,
          imageY + imageHeight + layer.offset,
          imageX + imageWidth - borderRadius + layer.offset,
          imageY + imageHeight + layer.offset
        );
        ctx.lineTo(imageX + layer.offset, imageY + imageHeight + layer.offset);
        ctx.lineTo(imageX + layer.offset, imageY + layer.offset);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.filter = 'none';
      ctx.restore();
      
      // Draw the image with rounded corners (upper right and bottom right)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(imageX, imageY);
      ctx.lineTo(imageX + imageWidth - borderRadius, imageY);
      ctx.quadraticCurveTo(imageX + imageWidth, imageY, imageX + imageWidth, imageY + borderRadius);
      ctx.lineTo(imageX + imageWidth, imageY + imageHeight - borderRadius);
      ctx.quadraticCurveTo(imageX + imageWidth, imageY + imageHeight, imageX + imageWidth - borderRadius, imageY + imageHeight);
      ctx.lineTo(imageX, imageY + imageHeight);
      ctx.lineTo(imageX, imageY);
      ctx.closePath();
      ctx.clip();
      
      // Draw the image
      ctx.drawImage(coverImage, imageX, imageY, imageWidth, imageHeight);
      ctx.restore();
      
      // Clean up temporary file
      try {
        await Deno.remove(coverImagePath);
      } catch {
        // Ignore cleanup errors
      }
    } catch (error) {
      console.error(`Failed to load Goodreads cover image: ${error}`);
      // Continue without image if download fails
    }
  }

  // Draw "Save this for later" (ctaText4) at fixed bottom position with bookmark icon
  if (ctaText4) {
    const saveFont = '36px Merriweather'; // Slightly bigger
    ctx.font = saveFont;
    const saveText = ctaText4;
    const saveTextWidth = ctx.measureText(saveText).width;
    const iconSize = 28 * 1.2; // 20% bigger (33.6)
    const iconSpacing = 12; // Space between icon and text
    const totalWidth = iconSize + iconSpacing + saveTextWidth;
    const saveX = (WIDTH - totalWidth) / 2;
    const saveY = saveTextY; // Fixed position
    
    // Draw bookmark icon (vertically centered with text)
    // Calculate text metrics for vertical centering
    const metrics = ctx.measureText(saveText);
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    const iconY = saveY - textHeight / 2 - iconSize / 2; // Center icon vertically with text
    await drawBookmarkIcon(ctx, saveX, iconY, iconSize);
    
    // Draw text with #222 and 60% opacity
    ctx.fillStyle = 'rgba(34, 34, 34, 0.6)'; // #222 with 60% opacity
    ctx.fillText(saveText, saveX + iconSize + iconSpacing, saveY);
  }

  // Draw author slug with @ prefix below "Save this for later" at fixed position
  const authorFont = 'italic 24px Merriweather';
  ctx.font = authorFont;
  const authorText = `@${authorSlug}`;
  const authorWidth = ctx.measureText(authorText).width;
  const authorX = (WIDTH - authorWidth) / 2;
  const authorY = authorSlugY; // Fixed position
  ctx.fillStyle = 'rgba(34, 34, 34, 0.6)'; // #222 with 60% opacity
  ctx.fillText(authorText, authorX, authorY);

  const buffer = canvas.toBuffer('image/jpeg', 95);
  await Deno.writeFile(outputPath, buffer);
}

/**
 * Generate a book takeaways carousel from input data
 */
export async function generateBookTakeawaysCarousel(
  input: BookTakeawaysCarouselInput,
): Promise<BookTakeawaysCarouselOutput> {
  // Register fonts
  registerFonts();

  const currentDir = Deno.cwd();

  // Download cover image
  const coverImagePath = join(currentDir, 'temp_cover_image.jpg');
  await downloadImage(input.coverUrl, coverImagePath);

  // Load paper background images
  const bgImage1 = await loadImage(join(currentDir, 'assets', 'images', 'bg-1.jpeg'));
  const bgImage2 = await loadImage(join(currentDir, 'assets', 'images', 'bg-2.jpg'));

  const outputPrefix = input.outputPrefix || 'book_takeaways_carousel';
  const outputs: string[] = [];

  // Generate cover slide (first)
  const coverOutputPath = `${outputPrefix}_slide_1.jpg`;
  console.error(`Generating cover slide...`);
  await generateCoverSlide(coverImagePath, coverOutputPath, input.coverText);
  outputs.push(coverOutputPath);

  // Generate point slides (alternating backgrounds)
  for (let i = 0; i < input.slides.length; i++) {
    const slide = input.slides[i];
    const slideIndex = i + 2; // +2 because cover is slide 1
    const outputPath = `${outputPrefix}_slide_${slideIndex}.jpg`;

    // Alternate between the two background images
    const bgImage = i % 2 === 0 ? bgImage1 : bgImage2;

    console.error(`Generating point slide ${i + 1}/${input.slides.length}...`);

    await generatePointSlide(slide, bgImage, outputPath, input.authorSlug);
    outputs.push(outputPath);
  }

  // Generate CTA slide (last)
  const ctaSlideIndex = input.slides.length + 2;
  const ctaOutputPath = `${outputPrefix}_slide_${ctaSlideIndex}.jpg`;
  console.error(`Generating CTA slide...`);
  // Use bg-1 for CTA slide
  await generateCTASlide(
    input.ctaText1,
    input.ctaText2,
    input.ctaText3,
    input.ctaText4,
    input.authorSlug,
    bgImage1,
    ctaOutputPath,
    input.goodreadsCoverUrl,
  );
  outputs.push(ctaOutputPath);

  // Clean up downloaded cover image
  try {
    await Deno.remove(coverImagePath);
  } catch {
    // Ignore cleanup errors
  }

  return {
    success: true,
    slideCount: outputs.length,
    files: outputs,
  };
}

/**
 * CLI entry point for generating book takeaways carousels
 */
export async function main(): Promise<void> {
  if (!Deno.args[0]) {
    console.error('Error: No input JSON provided');
    Deno.exit(1);
  }

  let input: BookTakeawaysCarouselInput;
  try {
    input = JSON.parse(Deno.args[0]);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    Deno.exit(1);
  }

  try {
    const output = await generateBookTakeawaysCarousel(input);
    console.log(JSON.stringify(output));
  } catch (error) {
    console.error('Error generating book takeaways carousel:', error);
    Deno.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

