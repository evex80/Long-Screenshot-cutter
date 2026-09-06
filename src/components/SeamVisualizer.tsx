import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Scissors, 
  Plus, 
  Trash2, 
  Wand2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sparkles,
  MoveVertical,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { findBestWhitespaceGap } from '../utils/imageProcessing';

interface SeamVisualizerProps {
  canvas: HTMLCanvasElement | null;
  cutPoints: number[];
  onUpdateCutPoints: (points: number[]) => void;
  searchWindow: number;
}

export const SeamVisualizer: React.FC<SeamVisualizerProps> = ({
  canvas,
  cutPoints,
  onUpdateCutPoints,
  searchWindow,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [draggingCutIndex, setDraggingCutIndex] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canvasWidth = canvas?.width || 800;
  const canvasHeight = canvas?.height || 1200;

  // Memoize canvas data URL so mouse move doesn't repeatedly encode base64
  const cachedImageUrl = useMemo(() => {
    return canvas ? canvas.toDataURL() : '';
  }, [canvas]);

  // Auto-fit initial zoom on load so long screenshots fit nicely
  useEffect(() => {
    if (containerRef.current && canvas) {
      const containerWidth = containerRef.current.clientWidth - 40;
      if (containerWidth > 0 && canvas.width > 0) {
        const initialScale = Math.min(1, Math.max(0.35, containerWidth / canvas.width));
        setZoomLevel(initialScale);
      }
    }
  }, [canvas]);

  // Flash temporary status notification
  const flashStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Dragging cut lines
  const handleMouseDownOnCut = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDraggingCutIndex(index);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = (e.clientY - rect.top + containerRef.current.scrollTop) / zoomLevel;
      const clampedY = Math.max(20, Math.min(canvasHeight - 20, Math.round(relativeY)));

      setHoverY(clampedY);

      if (draggingCutIndex !== null && draggingCutIndex < cutPoints.length - 1) {
        // We do not drag the final point (which is canvas.height)
        const updated = [...cutPoints];
        updated[draggingCutIndex] = clampedY;
        // Sort cut points
        const sorted = Array.from(new Set(updated)).sort((a: number, b: number) => a - b);
        onUpdateCutPoints(sorted);
      }
    },
    [canvas, canvasHeight, cutPoints, draggingCutIndex, onUpdateCutPoints, zoomLevel]
  );

  const handleMouseUp = () => {
    setDraggingCutIndex(null);
  };

  // Add cut line at clicked position
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!canvas || !containerRef.current || draggingCutIndex !== null) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = (e.clientY - rect.top + containerRef.current.scrollTop) / zoomLevel;
    const clampedY = Math.max(50, Math.min(canvasHeight - 50, Math.round(relativeY)));

    // Prevent duplicate near existing cuts
    const isTooClose = cutPoints.some((p) => Math.abs(p - clampedY) < 30);
    if (!isTooClose) {
      const updated = [...cutPoints, clampedY].sort((a: number, b: number) => a - b);
      onUpdateCutPoints(updated);
      flashStatus(`Added cut line at Y: ${clampedY}px`);
    }
  };

  // Remove a cut line
  const handleRemoveCut = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index === cutPoints.length - 1) return; // cannot remove final boundary
    const updated = cutPoints.filter((_, i) => i !== index);
    onUpdateCutPoints(updated);
    flashStatus(`Removed cut point #${index + 1}`);
  };

  // Snap specific cut line to nearest whitespace gap
  const handleSnapToWhitespace = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTarget = cutPoints[index];
    const bestY = findBestWhitespaceGap(ctx, canvas.width, canvas.height, currentTarget, searchWindow);
    const updated = [...cutPoints];
    updated[index] = bestY;
    const sorted = Array.from(new Set(updated)).sort((a: number, b: number) => a - b);
    onUpdateCutPoints(sorted);
    flashStatus(`Snapped Cut #${index + 1} to whitespace at Y: ${bestY}px`);
  };

  // Snap all cut lines
  const handleSnapAllToWhitespace = () => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updated = cutPoints.map((pt, idx) => {
      if (idx === cutPoints.length - 1) return pt; // Keep final boundary
      return findBestWhitespaceGap(ctx, canvas.width, canvas.height, pt, searchWindow);
    });

    const sorted = Array.from(new Set(updated)).sort((a: number, b: number) => a - b);
    onUpdateCutPoints(sorted);
    flashStatus('All seams snapped to natural whitespace gaps!');
  };

  if (!canvas) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 bg-slate-50">
        <Scissors className="w-8 h-8 text-slate-400 mb-2" />
        <p className="font-semibold text-sm">No image loaded</p>
        <p className="text-xs text-slate-400">Upload a long screenshot or render the HTML report to begin</p>
      </div>
    );
  }

  // Calculate slice heights for badges
  const sliceHeights: number[] = [];
  let prev = 0;
  for (const pt of cutPoints) {
    sliceHeights.push(pt - prev);
    prev = pt;
  }

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg border border-slate-300 overflow-hidden shadow-sm">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-slate-800">
            <Scissors className="w-4 h-4 text-indigo-600" />
            <span>Interactive Seam Editor</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
            {cutPoints.length} Slices Planned
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Total Image: {canvasWidth} × {canvasHeight}px
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Snap all button */}
          <button
            id="snap-all-whitespace-btn"
            type="button"
            onClick={handleSnapAllToWhitespace}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded hover:bg-emerald-100 transition-colors shadow-2xs"
            title="Automatically aligns all cut lines to the nearest paragraph/table gap"
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Snap All to Gaps</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 rounded border border-slate-300 p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.2, Math.round((z - 0.15) * 100) / 100))}
              className="p-1 hover:bg-white rounded text-slate-700"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-medium px-2 text-slate-700 select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
              className="p-1 hover:bg-white rounded text-slate-700"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-1.5 py-0.5 text-[11px] font-medium hover:bg-white rounded text-slate-700 ml-0.5 border-l border-slate-200"
              title="Reset zoom to 100%"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Helper Notification Bar */}
      <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-1.5 text-xs text-indigo-900 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            <strong>Pro Tip:</strong> Click anywhere on the screenshot to insert a seam, or drag the red dashed lines to adjust.
          </span>
        </div>
        {statusMessage && (
          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[11px] font-medium animate-fade-in">
            {statusMessage}
          </span>
        )}
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        id="seam-canvas-viewport"
        onClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative flex-1 overflow-auto p-6 flex justify-center bg-slate-200/80 cursor-crosshair min-h-[520px] max-h-[750px]"
      >
        <div
          style={{
            width: canvasWidth * zoomLevel,
            height: canvasHeight * zoomLevel,
            position: 'relative',
          }}
          className="shadow-xl bg-white select-none transition-transform"
        >
          {/* Render image from source canvas */}
          <img
            src={cachedImageUrl}
            alt="Source Screenshot"
            style={{
              width: canvasWidth * zoomLevel,
              height: canvasHeight * zoomLevel,
              display: 'block',
              pointerEvents: 'none',
            }}
          />

          {/* Slices Overlay Indicators (Alternating subtle bands on hover) */}
          {cutPoints.map((cutY, index) => {
            const prevY = index === 0 ? 0 : cutPoints[index - 1];
            const isLast = index === cutPoints.length - 1;
            const topPx = prevY * zoomLevel;
            const heightPx = (cutY - prevY) * zoomLevel;

            return (
              <div
                key={`slice-zone-${index}`}
                style={{
                  position: 'absolute',
                  top: topPx,
                  left: 0,
                  width: '100%',
                  height: heightPx,
                  pointerEvents: 'none',
                }}
                className="group border-l-4 border-indigo-500/40 hover:bg-indigo-500/5 transition-colors"
              >
                {/* Slice Badge on top-right */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    pointerEvents: 'auto',
                  }}
                  className="bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-1 rounded shadow-md flex items-center gap-1.5"
                >
                  <span className="font-bold text-amber-400">Slice #{index + 1}</span>
                  <span className="text-slate-300">({Math.round(cutY - prevY)}px)</span>
                </div>
              </div>
            );
          })}

          {/* Interactive Horizontal Cut Lines */}
          {cutPoints.map((cutY, index) => {
            const isFinalBoundary = index === cutPoints.length - 1;
            const topPx = cutY * zoomLevel;

            return (
              <div
                key={`cut-line-${index}`}
                style={{
                  position: 'absolute',
                  top: topPx,
                  left: 0,
                  width: '100%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                }}
                className={`flex items-center group ${
                  isFinalBoundary ? 'pointer-events-none' : 'cursor-row-resize'
                }`}
                onMouseDown={(e) => !isFinalBoundary && handleMouseDownOnCut(e, index)}
              >
                {/* The visual cut line */}
                <div
                  className={`w-full h-0.5 border-t-2 ${
                    isFinalBoundary
                      ? 'border-slate-800'
                      : 'border-rose-500 border-dashed group-hover:border-rose-600 group-hover:h-1'
                  }`}
                />

                {/* Cut Line Controls Bubble (Left side) */}
                {!isFinalBoundary && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 12,
                      transform: 'translateY(-50%)',
                    }}
                    className="flex items-center gap-1 bg-white border border-rose-300 text-rose-800 rounded px-2 py-1 shadow-md text-xs font-semibold pointer-events-auto"
                  >
                    <MoveVertical className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-mono">Cut #{index + 1}: {cutY}px</span>

                    {/* Snap Button */}
                    <button
                      type="button"
                      onClick={(e) => handleSnapToWhitespace(e, index)}
                      className="ml-1 p-1 hover:bg-rose-50 rounded text-emerald-700"
                      title="Snap this cut to nearest gap"
                    >
                      <Wand2 className="w-3 h-3 text-emerald-600" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCut(e, index)}
                      className="p-1 hover:bg-rose-50 rounded text-rose-700"
                      title="Delete this cut line"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
