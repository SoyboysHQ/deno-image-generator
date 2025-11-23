// Shared TypeScript interfaces and types

export interface HighlightItem {
  phrase: string;
  color?: string; // Optional color for the highlight, defaults to yellow
}

export interface ParsedText {
  text: string;
  highlights: HighlightItem[];
}

export interface InputItem {
  title: string;
  list: string[];
}

export interface PhraseIndex {
  start: number;
  end: number;
}

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CarouselSlide {
  type: 'title' | 'intro' | 'point' | 'closing';
  title?: string;
  subtitle?: string;
  body?: string;
  number?: number;
  author?: string;
}

export interface CarouselInput {
  slides: CarouselSlide[];
  outputPrefix?: string;
  highlightColors?: string[]; // Array of colors to cycle through for highlights
  authorSlug?: string; // Account identifier for watermark (e.g., 'compounding_wisdom', 'itsnotwhatisaid')
}

export interface CarouselOutput {
  success: boolean;
  slideCount: number;
  files: string[];  
}

export interface ReelInput {
  quote?: string; // Quote text with optional <mark> tags for highlights
  author?: string; // Author attribution
  imagePath?: string; // Optional custom image path (if not generating quote)
  audioPath?: string;
  duration?: number; // Duration in seconds, default 5
  outputPath?: string;
  highlightColor?: string;
}

export interface ReelOutput {
  success: boolean;
  file: string;
  duration: number;
}

export interface TwoImageReelInput {
  title: string; // Title for first image with optional <mark> tags
  items: string[]; // List items for second image with optional <mark> tags
  audioPath?: string; // Optional audio path, will auto-select if not provided
  duration?: number; // Duration in seconds, will use audio duration if not provided
  outputPath?: string;
  author?: string; // Optional author signature, default 'by @compounding.wisdom'
  style?: {
    primaryHighlightColor?: string; // Color for first <mark> tag, default '#F0E231' (yellow)
    secondaryHighlightColor?: string; // Color for second <mark> tag, default '#FFA500' (orange)
    additionalHighlightColor?: string; // Color for additional <mark> tags, default '#F0E231' (yellow)
  };
}

export interface TwoImageReelOutput {
  success: boolean;
  file: string;
  duration: number;
}

export interface WatermarkInput {
  targetImage: string; // Base64 encoded image data
  opacity?: number; // 0-1, default 1.0
  scale?: number; // 0-1, watermark size relative to image width, default 0.12
  padding?: number; // Padding from edges in pixels, default 10
}

export interface WatermarkOutput {
  success: boolean;
  file: string;
}

export interface ThreePartReelInput {
  image1Url: string; // URL to first image
  image2Url: string; // URL to second image
  text1: string; // First text overlay for first frame
  text2: string; // Second text overlay for first frame
  text3: string; // Text overlay for third frame
  audioPath?: string; // Optional audio path, will auto-select if not provided
  outputPath?: string;
  watermark?: {
    opacity?: number; // 0-1, default 1.0
    scale?: number; // 0-1, watermark size relative to image width, default 0.15
    padding?: number; // Padding from edges in pixels, default 20
    horizontalOffset?: number; // Additional horizontal offset (positive = right, negative = left), default 0
    verticalOffset?: number; // Additional vertical offset (positive = down, negative = up), default 0
  };
}

export interface ThreePartReelOutput {
  success: boolean;
  file: string;
  duration: number;
}

export interface TextReelInput {
  text: string; // The text to display (supports <mark> tags for highlights)
  audioPath?: string; // Optional audio path, will auto-select if not provided
  duration?: number; // Duration in seconds, will use audio duration if not provided
  outputPath?: string;
}

export interface TextReelOutput {
  success: boolean;
  file: string;
  duration: number;
}

// =========================
// Markdown Carousel
// =========================
export interface MarkdownCarouselInput {
  markdown: string; // Markdown text with slides separated by ---
  outputPrefix?: string;
}

export interface MarkdownCarouselOutput {
  success: boolean;
  slideCount: number;
  files: string[];
}

// =========================
// Book Reveal Reel (Video + Image)
// =========================
export interface BookRevealReelInput {
  videoUrl: string;    // URL to intro video (first part)
  imageUrl: string;    // URL to reveal image (second/third parts)
  hookText: string;    // First text overlay (appears first)
  hookText2: string;   // Second text overlay (appears below hookText)
  ctaText: string;     // Bottom CTA text on the final image
  musicName?: string;  // Optional music filename (e.g., "background-music-7.mp3") from assets/audio/; takes precedence over audioPath
  audioPath?: string;  // Optional background audio override (full path or URL); if omitted, defaults to background-music-7.mp3
  outputPath?: string; // Optional output path; defaults to book_reveal_reel.mp4
  watermark?: {
    opacity?: number;          // 0-1, default 1.0 for image watermark rendering
    scale?: number;            // 0-1, watermark width relative to frame width, default 0.15
    padding?: number;          // Padding from edges in pixels, default 20
    horizontalOffset?: number; // Positive = right, negative = left, default 30
    verticalOffset?: number;   // Positive = down, negative = up, default 10
  };
}

export interface BookRevealReelOutput {
  success: boolean;
  file: string;
  duration: number;
}

// =========================
// Book Takeaways Carousel
// =========================
export interface BookTakeawaysSlide {
  type: 'point';
  title: string; // Title (may include number prefix like "1. Become...")
  body: string; // Body text with paragraph breaks (\n\n)
}

export interface BookTakeawaysCarouselInput {
  coverUrl: string; // URL to cover image
  coverText?: string; // Optional cover text
  slides: BookTakeawaysSlide[]; // Array of point slides
  ctaText1?: string; // First CTA text
  ctaText2?: string; // Second CTA text
  ctaText3?: string; // Third CTA text
  ctaText4?: string; // Fourth CTA text (also used as "Save this for later")
  authorSlug: string; // Author slug (e.g., "itsnotwhatisaid")
  goodreadsCoverUrl?: string; // URL to Goodreads cover image for CTA slide
  outputPrefix?: string; // Optional output prefix
}

export interface BookTakeawaysCarouselOutput {
  success: boolean;
  slideCount: number;
  files: string[];
}

