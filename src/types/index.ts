// Shared TypeScript interfaces and types

export interface HighlightItem {
  phrase: string;
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
}

export interface ReelOutput {
  success: boolean;
  file: string;
  duration: number;
}

