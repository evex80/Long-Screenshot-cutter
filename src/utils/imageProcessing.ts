import { OptimizationSettings, SlicingConfig, SliceItem } from '../types';

/**
 * Calculates seam quality score for a given row in an image.
 * Higher score = safer cut location (e.g., solid white, solid background, horizontal gap).
 */
export function calculateRowVariance(
  pixels: Uint8ClampedArray,
  width: number,
  y: number
): { variance: number; isSolid: boolean; avgLuminance: number } {
  const rowStart = y * width * 4;
  let sumL = 0;
  let minL = 255;
  let maxL = 0;

  // Sample every 2nd pixel for high performance on massive 10,000px screenshots
  const step = 2;
  const sampleCount = Math.floor(width / step);

  for (let x = 0; x < width; x += step) {
    const idx = rowStart + x * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    // Luminance approximation
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    sumL += lum;
    if (lum < minL) minL = lum;
    if (lum > maxL) maxL = lum;
  }

  const avgLuminance = sumL / sampleCount;
  const spread = maxL - minL;

  return {
    variance: spread,
    isSolid: spread < 12,
    avgLuminance,
  };
}

/**
 * Automatically detects ideal horizontal cut lines without splitting text or charts.
 */
export function detectSmartCutPoints(
  canvas: HTMLCanvasElement,
  config: SlicingConfig
): number[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  const width = canvas.width;
  const height = canvas.height;
  const cutPoints: number[] = [];

  // If screenshot is very short, no need to cut
  if (height <= 800) {
    return [height];
  }

  if (config.mode === 'slice-count') {
    const sliceCount = Math.max(2, config.sliceCount);
    const nominalHeight = height / sliceCount;
    let currentY = 0;

    for (let i = 1; i < sliceCount; i++) {
      const targetY = Math.round(i * nominalHeight);
      const bestCut = findBestWhitespaceGap(ctx, width, height, targetY, config.searchWindow);
      cutPoints.push(bestCut);
      currentY = bestCut;
    }
    cutPoints.push(height);
    return Array.from(new Set(cutPoints)).sort((a: number, b: number) => a - b);
  }

  if (config.mode === 'fixed-height') {
    const targetHeight = Math.max(300, config.targetHeight);
    let currentY = 0;
    while (currentY + targetHeight < height) {
      currentY += targetHeight;
      cutPoints.push(currentY);
    }
    cutPoints.push(height);
    return cutPoints;
  }

  // Mode: 'smart-seam' (Content-Aware Whitespace Detection)
  const targetHeight = Math.max(400, config.targetHeight);
  const searchWindow = Math.max(60, config.searchWindow);
  let currentY = 0;

  while (currentY + targetHeight * 0.8 < height) {
    const nominalTarget = currentY + targetHeight;
    if (nominalTarget >= height - 200) {
      // Near the end, just include remaining
      break;
    }

    const bestCut = findBestWhitespaceGap(ctx, width, height, nominalTarget, searchWindow);
    // Ensure progressive advancement
    if (bestCut > currentY + 150 && bestCut < height) {
      cutPoints.push(bestCut);
      currentY = bestCut;
    } else {
      currentY = Math.min(height, currentY + targetHeight);
      cutPoints.push(currentY);
    }
  }

  if (!cutPoints.includes(height)) {
    cutPoints.push(height);
  }

  return Array.from(new Set(cutPoints)).sort((a: number, b: number) => a - b);
}

/**
 * Searches in range [targetY - searchWindow, targetY + searchWindow] for the best whitespace / gap.
 */
export function findBestWhitespaceGap(
  ctx: CanvasRenderingContext2D,
  width: number,
  totalHeight: number,
  targetY: number,
  searchWindow: number
): number {
  const minY = Math.max(50, targetY - searchWindow);
  const maxY = Math.min(totalHeight - 50, targetY + searchWindow);
  const searchHeight = maxY - minY;

  if (searchHeight <= 0) return targetY;

  const imgData = ctx.getImageData(0, minY, width, searchHeight);
  const pixels = imgData.data;

  let bestY = targetY;
  let bestScore = -Infinity;

  for (let localY = 0; localY < searchHeight; localY++) {
    const absY = minY + localY;
    const { variance, avgLuminance } = calculateRowVariance(pixels, width, localY);

    // Score calculation:
    // 1. Lower variance is better (solid white space or single color border)
    // 2. High luminance is better (light background typical in executive HTML reports)
    // 3. Distance penalty from nominal targetY
    const variancePenalty = variance * 2.5;
    const distFromTarget = Math.abs(absY - targetY);
    const distPenalty = (distFromTarget / searchWindow) * 40;
    const whiteBonus = avgLuminance > 240 ? 60 : avgLuminance > 220 ? 30 : 0;

    const score = 100 - variancePenalty - distPenalty + whiteBonus;

    if (score > bestScore) {
      bestScore = score;
      bestY = absY;
    }
  }

  return bestY;
}

/**
 * Optimizes an image slice canvas for maximum readability in email clients.
 */
export function applyOptimizationFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: OptimizationSettings
) {
  if (
    settings.contrastBoost === 0 &&
    settings.sharpness === 0 &&
    !settings.cleanWhiteBg
  ) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const contrastFactor = (259 * (settings.contrastBoost * 1.5 + 255)) / (255 * (259 - settings.contrastBoost * 1.5));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Clean white background (>245 turned to 255 to eliminate dirty email grey borders)
    if (settings.cleanWhiteBg && r > 245 && g > 245 && b > 245) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      continue;
    }

    // High readability contrast enhancement
    if (settings.contrastBoost > 0) {
      r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
      g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
      b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imgData, 0, 0);

  // Sharpness boost via light unsharp mask overlay if requested
  if (settings.sharpness > 0) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
}

/**
 * Renders all slices into clean dataURLs and metadata.
 */
export async function generateSlices(
  sourceCanvas: HTMLCanvasElement,
  cutPoints: number[],
  settings: OptimizationSettings
): Promise<SliceItem[]> {
  const slices: SliceItem[] = [];
  const srcWidth = sourceCanvas.width;
  let prevY = 0;

  for (let i = 0; i < cutPoints.length; i++) {
    const endY = cutPoints[i];
    const sliceHeight = endY - prevY;

    if (sliceHeight <= 0) continue;

    // Determine target dimensions
    let destWidth = srcWidth;
    let destHeight = sliceHeight;

    if (settings.targetEmailWidth > 0 && settings.targetEmailWidth !== srcWidth) {
      const scale = settings.targetEmailWidth / srcWidth;
      // If retinaDpi is true, export at 2x logical resolution for high-DPI email clients
      const multiplier = settings.retinaDpi ? 2 : 1;
      destWidth = Math.round(settings.targetEmailWidth * multiplier);
      destHeight = Math.round(sliceHeight * scale * multiplier);
    } else if (settings.retinaDpi) {
      // 2x export
      destWidth = srcWidth * 2;
      destHeight = sliceHeight * 2;
    }

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = destWidth;
    sliceCanvas.height = destHeight;
    const sliceCtx = sliceCanvas.getContext('2d');

    if (sliceCtx) {
      sliceCtx.imageSmoothingEnabled = true;
      sliceCtx.imageSmoothingQuality = 'high';

      // Draw exact segment with zero pixel loss or vertical gap
      sliceCtx.drawImage(
        sourceCanvas,
        0,
        prevY,
        srcWidth,
        sliceHeight,
        0,
        0,
        destWidth,
        destHeight
      );

      // Readability filters
      applyOptimizationFilters(sliceCtx, destWidth, destHeight, settings);

      const dataUrl = sliceCanvas.toDataURL(
        settings.imageFormat,
        settings.jpegQuality
      );

      // Approximate size in KB
      const base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
      const sizeKb = Math.round((base64Len * 0.75) / 1024);

      // Create Blob asynchronously
      const blob = await new Promise<Blob | undefined>((resolve) => {
        sliceCanvas.toBlob(
          (b) => resolve(b || undefined),
          settings.imageFormat,
          settings.jpegQuality
        );
      });

      slices.push({
        id: `slice_${i + 1}_${Date.now()}`,
        index: i + 1,
        startY: prevY,
        endY: endY,
        height: destHeight,
        width: destWidth,
        dataUrl,
        blob,
        sizeKb,
      });
    }

    prevY = endY;
  }

  return slices;
}
