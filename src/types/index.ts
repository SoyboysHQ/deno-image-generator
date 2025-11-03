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

export interface TwoImageReelInput {
  title: string; // Title for first image with optional <mark> tags
  items: string[]; // List items for second image with optional <mark> tags
  audioPath?: string; // Optional audio path, will auto-select if not provided
  duration?: number; // Duration in seconds, will use audio duration if not provided
  outputPath?: string;
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
}

export interface ThreePartReelOutput {
  success: boolean;
  file: string;
  duration: number;
}

