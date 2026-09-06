export type KpiType = 'Market Feedback' | 'Scenario Conversion' | 'Requirement';
export type ValueScore = 'High' | 'Mid' | 'Low';
export type Brand = 'Infinix' | 'Tecno' | 'itel' | 'Transsion Ecosystem';
export type TechCategory = 'Camera IQ' | 'Software Stability' | 'Network / Signal (Fastlink/5G)' | 'Hardware Durability (QC)';

export interface TfaeEntry {
  id: string;
  kpiType: KpiType;
  technicalTitle: string;
  marketReality: string;
  engineeringDeepDive: string;
  actionableStep: string;
  valueScore: ValueScore;
  brand: Brand;
  category: TechCategory;
  missingValidation?: string;
}

export interface SliceItem {
  id: string;
  index: number;
  startY: number;
  endY: number;
  height: number;
  width: number;
  dataUrl: string;
  blob?: Blob;
  sizeKb: number;
  isAutoDetected?: boolean;
}

export interface OptimizationSettings {
  targetEmailWidth: number; // e.g. 650, 720, 800, or 0 for original
  sharpness: number; // 0 - 100
  contrastBoost: number; // 0 - 50 (%)
  cleanWhiteBg: boolean; // Whiten near-white backgrounds (>245)
  retinaDpi: boolean; // Export at 2x logical resolution for high-DPI email clients
  imageFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  jpegQuality: number; // 0.7 - 1.0
}

export type SlicingMode = 'smart-seam' | 'fixed-height' | 'slice-count';

export interface SlicingConfig {
  mode: SlicingMode;
  targetHeight: number; // default ~900px
  sliceCount: number; // default 4
  searchWindow: number; // default 150px range to find whitespace
  sensitivity: number; // 1-10 whitespace threshold
}
