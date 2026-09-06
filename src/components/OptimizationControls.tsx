import React from 'react';
import { OptimizationSettings, SlicingConfig, SlicingMode } from '../types';
import { 
  Sliders, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Eye, 
  Cpu, 
  FileCheck,
  Zap,
  Gauge
} from 'lucide-react';

interface OptimizationControlsProps {
  slicingConfig: SlicingConfig;
  onChangeSlicingConfig: (config: SlicingConfig) => void;
  optimization: OptimizationSettings;
  onChangeOptimization: (opt: OptimizationSettings) => void;
  onRecomputeSeams: () => void;
  onGenerateSlices: () => void;
  isProcessing: boolean;
}

export const OptimizationControls: React.FC<OptimizationControlsProps> = ({
  slicingConfig,
  onChangeSlicingConfig,
  optimization,
  onChangeOptimization,
  onRecomputeSeams,
  onGenerateSlices,
  isProcessing,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Slicing &amp; Readability Optimization
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Executive Email Grade
        </span>
      </div>

      {/* Slicing Strategy Section */}
      <div className="space-y-4">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Segmentation Mode</span>
        </label>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              onChangeSlicingConfig({ ...slicingConfig, mode: 'smart-seam' });
              setTimeout(onRecomputeSeams, 50);
            }}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              slicingConfig.mode === 'smart-seam'
                ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="font-semibold text-indigo-900">Smart Seams</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Content-aware gap finding</div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeSlicingConfig({ ...slicingConfig, mode: 'fixed-height' });
              setTimeout(onRecomputeSeams, 50);
            }}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              slicingConfig.mode === 'fixed-height'
                ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="font-semibold text-indigo-900">Fixed Height</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Strict pixel increments</div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeSlicingConfig({ ...slicingConfig, mode: 'slice-count' });
              setTimeout(onRecomputeSeams, 50);
            }}
            className={`p-2.5 rounded text-left border text-xs transition-all ${
              slicingConfig.mode === 'slice-count'
                ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="font-semibold text-indigo-900">Equal Slices</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Exact N segments</div>
          </button>
        </div>

        {/* Dynamic controls depending on mode */}
        {slicingConfig.mode === 'slice-count' ? (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
              <span className="font-medium">Number of Slices:</span>
              <span className="font-mono font-bold text-indigo-600">{slicingConfig.sliceCount} parts</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              value={slicingConfig.sliceCount}
              onChange={(e) => {
                onChangeSlicingConfig({ ...slicingConfig, sliceCount: Number(e.target.value) });
                setTimeout(onRecomputeSeams, 50);
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
              <span className="font-medium">Target Slice Height (Email Optimal):</span>
              <span className="font-mono font-bold text-indigo-600">{slicingConfig.targetHeight}px</span>
            </div>
            <input
              type="range"
              min="500"
              max="1600"
              step="50"
              value={slicingConfig.targetHeight}
              onChange={(e) => {
                onChangeSlicingConfig({ ...slicingConfig, targetHeight: Number(e.target.value) });
                setTimeout(onRecomputeSeams, 50);
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Compact (500px)</span>
              <span>Recommended (800-1000px)</span>
              <span>Tall (1600px)</span>
            </div>
          </div>
        )}

        {slicingConfig.mode === 'smart-seam' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
              <span className="font-medium">Gap Search Tolerance:</span>
              <span className="font-mono font-bold text-indigo-600">±{slicingConfig.searchWindow}px</span>
            </div>
            <input
              type="range"
              min="60"
              max="300"
              step="20"
              value={slicingConfig.searchWindow}
              onChange={(e) => {
                onChangeSlicingConfig({ ...slicingConfig, searchWindow: Number(e.target.value) });
                setTimeout(onRecomputeSeams, 50);
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Readability & Executive Rendering */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-indigo-600" />
          <span>Readability &amp; High-DPI Email Optimization</span>
        </label>

        {/* 2x Retina Toggle */}
        <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>2× High-DPI Retina Output</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">
                Crisp Text
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Renders images at double resolution for crystal-clear clarity on Apple Mail, Outlook &amp; mobile
            </div>
          </div>
          <input
            type="checkbox"
            checked={optimization.retinaDpi}
            onChange={(e) =>
              onChangeOptimization({ ...optimization, retinaDpi: e.target.checked })
            }
            className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
          />
        </div>

        {/* Clean White Background */}
        <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-900">Clean Pure-White Background (#FFFFFF)</div>
            <div className="text-[11px] text-slate-500">
              Turns compression artifacts and off-white edges into pure white to avoid dirty seams in emails
            </div>
          </div>
          <input
            type="checkbox"
            checked={optimization.cleanWhiteBg}
            onChange={(e) =>
              onChangeOptimization({ ...optimization, cleanWhiteBg: e.target.checked })
            }
            className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
          />
        </div>

        {/* Contrast Boost */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
            <span className="font-medium">Text Contrast Boost:</span>
            <span className="font-mono font-bold text-indigo-600">+{optimization.contrastBoost}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={optimization.contrastBoost}
            onChange={(e) =>
              onChangeOptimization({ ...optimization, contrastBoost: Number(e.target.value) })
            }
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Target Email Display Width */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Target Email Container Width:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: '650px (Std)', val: 650 },
              { label: '720px', val: 720 },
              { label: '800px (Wide)', val: 800 },
              { label: 'Original', val: 0 },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onChangeOptimization({ ...optimization, targetEmailWidth: item.val })}
                className={`py-1.5 px-2 rounded text-xs text-center border font-medium transition-all ${
                  optimization.targetEmailWidth === item.val
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Export Format:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'PNG (Lossless)', val: 'image/png' },
              { label: 'JPEG (Compact)', val: 'image/jpeg' },
              { label: 'WebP (Modern)', val: 'image/webp' },
            ].map((f) => (
              <button
                key={f.val}
                type="button"
                onClick={() =>
                  onChangeOptimization({
                    ...optimization,
                    imageFormat: f.val as OptimizationSettings['imageFormat'],
                  })
                }
                className={`py-1.5 px-2 rounded text-xs text-center border font-medium transition-all ${
                  optimization.imageFormat === f.val
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          id="generate-slices-btn"
          type="button"
          onClick={onGenerateSlices}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded shadow-md transition-all text-sm cursor-pointer"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Slicing &amp; Optimizing Slices...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Slices &amp; Stitch for Email</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
