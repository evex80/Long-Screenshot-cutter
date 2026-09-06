import React, { useState } from 'react';
import { SliceItem, OptimizationSettings } from '../types';
import { 
  Download, 
  Copy, 
  Check, 
  Mail, 
  Eye, 
  Archive, 
  FileImage, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { downloadSlicesZip, copyRichHtmlToClipboard } from '../utils/emailGenerator';

interface SlicesGridProps {
  slices: SliceItem[];
  reportTitle: string;
  optimization: OptimizationSettings;
  onOpenEmailPreview: () => void;
}

export const SlicesGrid: React.FC<SlicesGridProps> = ({
  slices,
  reportTitle,
  optimization,
  onOpenEmailPreview,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSliceId, setCopiedSliceId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  if (slices.length === 0) {
    return null;
  }

  const totalSizeKb = slices.reduce((acc, s) => acc + s.sizeKb, 0);
  const totalHeight = slices.reduce((acc, s) => acc + s.height, 0);
  const avgWidth = slices[0]?.width || 0;

  // Handle Copy All for Email
  const handleCopyForEmail = async () => {
    const success = await copyRichHtmlToClipboard(slices, {
      emailSubject: reportTitle,
      maxWidthPx: optimization.targetEmailWidth || 650,
      includeBorder: true,
      inlineBase64: true,
    });

    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
    }
  };

  // Handle Download ZIP
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadSlicesZip(slices, reportTitle, {
        emailSubject: reportTitle,
        maxWidthPx: optimization.targetEmailWidth || 650,
        includeBorder: true,
        inlineBase64: true,
      });
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Handle Download Single Slice
  const handleDownloadSingle = (slice: SliceItem) => {
    const a = document.createElement('a');
    a.href = slice.dataUrl;
    const pad = String(slice.index).padStart(2, '0');
    const ext = slice.dataUrl.includes('image/png') ? 'png' : slice.dataUrl.includes('image/webp') ? 'webp' : 'jpg';
    a.download = `${pad}_${reportTitle.replace(/\s+/g, '_')}_part${slice.index}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle Copy Single Slice to Clipboard
  const handleCopySingle = async (slice: SliceItem) => {
    try {
      if (slice.blob) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [slice.blob.type || 'image/png']: slice.blob,
          }),
        ]);
        setCopiedSliceId(slice.id);
        setTimeout(() => setCopiedSliceId(null), 2000);
      }
    } catch (err) {
      console.warn('Failed to copy image blob:', err);
    }
  };

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header & Stats */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900">
              Generated Email-Ready Slices ({slices.length} Seamless Parts)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Perfect zero-gap vertical alignment • Slices ordered 01 to {String(slices.length).padStart(2, '0')} • Formatted for management readability
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <span className="text-slate-500">Total Email Payload: </span>
            <strong className="text-slate-900">
              {totalSizeKb > 1024 ? `${(totalSizeKb / 1024).toFixed(2)} MB` : `${totalSizeKb} KB`}
            </strong>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <span className="text-slate-500">Render Resolution: </span>
            <strong className="text-slate-900">{avgWidth} × {totalHeight}px</strong>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1-Click Copy For Email */}
        <button
          id="copy-for-email-btn"
          type="button"
          onClick={handleCopyForEmail}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-sm text-xs cursor-pointer transition-all"
        >
          {copiedAll ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Copied! Ready to Paste (Ctrl+V)</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-emerald-100" />
              <span>Copy for Email (One-Click Paste)</span>
            </>
          )}
        </button>

        {/* Download All as ZIP */}
        <button
          id="download-zip-btn"
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold rounded shadow-sm text-xs cursor-pointer transition-all"
        >
          {isZipping ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Packing ZIP Archive...</span>
            </>
          ) : (
            <>
              <Archive className="w-4 h-4 text-slate-300" />
              <span>Download All as ZIP (.zip)</span>
            </>
          )}
        </button>

        {/* Preview in Simulated Email Client */}
        <button
          id="preview-email-modal-btn"
          type="button"
          onClick={onOpenEmailPreview}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold rounded shadow-2xs text-xs cursor-pointer transition-all"
        >
          <Mail className="w-4 h-4 text-indigo-600" />
          <span>Preview in Email Client</span>
        </button>
      </div>

      {/* Slices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {slices.map((slice) => (
          <div
            key={slice.id}
            className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col hover:border-indigo-300 transition-all shadow-2xs group"
          >
            {/* Slice Header */}
            <div className="bg-white px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  {slice.index}
                </span>
                <span>Part #{String(slice.index).padStart(2, '0')}</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">{slice.sizeKb} KB</span>
            </div>

            {/* Thumbnail Preview with Checkerboard Background */}
            <div className="relative p-2 bg-slate-200/40 flex items-center justify-center overflow-hidden max-h-56">
              <img
                src={slice.dataUrl}
                alt={`Slice ${slice.index}`}
                className="max-h-52 w-auto object-contain shadow-xs bg-white rounded-xs"
              />
              <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                {slice.width} × {slice.height}px
              </div>
            </div>

            {/* Slice Action Footer */}
            <div className="bg-white p-2.5 border-t border-slate-200 grid grid-cols-2 gap-2 mt-auto">
              <button
                type="button"
                onClick={() => handleCopySingle(slice)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Copy this image slice to clipboard"
              >
                {copiedSliceId === slice.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadSingle(slice)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Download this slice as image file"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
