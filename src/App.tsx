import React, { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { 
  TfaeEntry, 
  SliceItem, 
  OptimizationSettings, 
  SlicingConfig 
} from './types';
import { INITIAL_TFAE_ENTRIES } from './data/sampleReportData';
import { TfaeReportView } from './components/TfaeReportView';
import { SeamVisualizer } from './components/SeamVisualizer';
import { OptimizationControls } from './components/OptimizationControls';
import { SlicesGrid } from './components/SlicesGrid';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { 
  detectSmartCutPoints, 
  generateSlices 
} from './utils/imageProcessing';
import { 
  Upload, 
  Scissors, 
  FileText, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Download,
  Eye,
  RefreshCw,
  Zap,
  HelpCircle,
  Layers
} from 'lucide-react';

export default function App() {
  // Navigation tabs: 'slicer' or 'report-studio'
  const [activeTab, setActiveTab] = useState<'slicer' | 'report-studio'>('slicer');

  // Report & Source Canvas State
  const [reportEntries, setReportEntries] = useState<TfaeEntry[]>(INITIAL_TFAE_ENTRIES);
  const reportRef = useRef<HTMLDivElement>(null);
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [reportTitle, setReportTitle] = useState<string>('Iraq_Erbil_TFAE_Field_Technical_Report');
  
  // Cut lines & Slices
  const [cutPoints, setCutPoints] = useState<number[]>([]);
  const [slices, setSlices] = useState<SliceItem[]>([]);

  // Processing & UI states
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Slicing Configuration
  const [slicingConfig, setSlicingConfig] = useState<SlicingConfig>({
    mode: 'smart-seam',
    targetHeight: 900,
    sliceCount: 4,
    searchWindow: 140,
    sensitivity: 8,
  });

  // Optimization & Email Readability Settings
  const [optimization, setOptimization] = useState<OptimizationSettings>({
    targetEmailWidth: 650,
    sharpness: 25,
    contrastBoost: 8,
    cleanWhiteBg: true,
    retinaDpi: true,
    imageFormat: 'image/png',
    jpegQuality: 0.92,
  });

  // Load and auto-render initial sample report on mount
  useEffect(() => {
    // Delay slightly to let fonts render cleanly
    const timer = setTimeout(() => {
      handleCaptureReport();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Global paste handler (Ctrl+V image from clipboard)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              loadBlobAsSource(blob, 'Pasted_Screenshot');
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [slicingConfig, optimization]);

  // Status message helper
  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Convert an Image/Blob to HTMLCanvasElement and trigger auto-slicing
  const loadBlobAsSource = (file: Blob, title: string) => {
    setIsProcessing(true);
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setSourceCanvas(canvas);
        setReportTitle(title.replace(/\.[^/.]+$/, ''));
        
        // Compute smart seam cut lines
        const detectedCuts = detectSmartCutPoints(canvas, slicingConfig);
        setCutPoints(detectedCuts);

        // Generate slices
        generateSlices(canvas, detectedCuts, optimization).then((newSlices) => {
          setSlices(newSlices);
          setIsProcessing(false);
          setActiveTab('slicer');
          showToast(`Loaded screenshot (${img.naturalWidth}×${img.naturalHeight}px) and auto-sliced into ${newSlices.length} parts!`);
        });
      }
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  // 1-Click: Render the HTML Report directly to high-resolution canvas
  const handleCaptureReport = async () => {
    if (!reportRef.current) return;
    setIsCapturing(true);
    setIsProcessing(true);

    try {
      // Small tick for DOM ref
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // 2x high-resolution capture for crisp executive readability
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 850,
      });

      setSourceCanvas(canvas);
      setReportTitle('Iraq_Erbil_TFAE_Field_Technical_Report');

      // Detect optimal whitespace seams
      const detectedCuts = detectSmartCutPoints(canvas, slicingConfig);
      setCutPoints(detectedCuts);

      // Generate the sliced images
      const initialSlices = await generateSlices(canvas, detectedCuts, optimization);
      setSlices(initialSlices);
      setActiveTab('slicer');
      showToast(`HTML Report successfully captured at 2× Retina resolution and sliced into ${initialSlices.length} email parts!`);
    } catch (err) {
      console.error('HTML Report capture failed:', err);
      showToast('Error capturing HTML report. Please try uploading an image directly.');
    } finally {
      setIsCapturing(false);
      setIsProcessing(false);
    }
  };

  // Recompute cut points when user tweaks slicing settings
  const handleRecomputeSeams = useCallback(() => {
    if (!sourceCanvas) return;
    const detectedCuts = detectSmartCutPoints(sourceCanvas, slicingConfig);
    setCutPoints(detectedCuts);
    showToast(`Recalculated seams: ${detectedCuts.length} parts found.`);
  }, [sourceCanvas, slicingConfig]);

  // Generate or regenerate slices using current cut lines and optimization
  const handleGenerateSlices = async () => {
    if (!sourceCanvas || cutPoints.length === 0) return;
    setIsProcessing(true);
    try {
      const newSlices = await generateSlices(sourceCanvas, cutPoints, optimization);
      setSlices(newSlices);
      showToast(`Generated ${newSlices.length} email-optimized slices.`);
    } catch (err) {
      console.error('Slice generation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // File Upload Handlers
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadBlobAsSource(file, file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadBlobAsSource(file, file.name);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white"
    >
      {/* Top Navigation Header */}
      <header className="bg-[#1E293B] text-slate-100 sticky top-0 z-40 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between flex-wrap gap-3">
          {/* Logo & Persona Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">
                  Seam<span className="text-indigo-400">Cut</span> Pro &bull; Screenshot Slicer
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                  v2.4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated Zero-Gap Segmentation &bull; High-DPI Readability &bull; Outlook &amp; Gmail Certified
              </p>
            </div>
          </div>

          {/* Engine Status & Action Tools in Navbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Engine: Optimized 4K Rendering</span>
            </div>

            {/* Tab switch */}
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('slicer')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'slicer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Seam Editor &amp; Slices</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('report-studio')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'report-studio'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>HTML Report Studio</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              id="screenshot-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Upload Button */}
            <label
              htmlFor="screenshot-file-input"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer transition-colors shadow-sm"
              title="Upload any long screenshot PNG/JPG"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Upload Screenshot</span>
              <span className="sm:hidden">Upload</span>
            </label>

            {/* Render HTML Report Button */}
            <button
              id="render-html-report-top-btn"
              type="button"
              onClick={handleCaptureReport}
              disabled={isCapturing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white cursor-pointer transition-colors shadow-sm border border-indigo-400/40"
              title="Render the TFAE HTML report into a long screenshot and auto-slice"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isCapturing ? 'Capturing...' : 'Auto-Capture HTML'}</span>
            </button>

            {/* Email Preview Modal Opener */}
            {slices.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 cursor-pointer transition-colors shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Email Simulator</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Drag Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/90 backdrop-blur-xs flex items-center justify-center pointer-events-none">
          <div className="p-8 bg-[#1E293B] rounded-2xl shadow-2xl text-center border-2 border-indigo-500 max-w-md text-slate-100">
            <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-white">Drop your long screenshot here</h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports PNG, JPG, WebP at any height. Auto-smart seam detection will trigger immediately.
            </p>
          </div>
        </div>
      )}

      {/* Status Toast Banner */}
      {statusMessage && (
        <div className="bg-indigo-900/40 border-b border-indigo-500/30 text-indigo-200 px-4 py-2 text-xs text-center font-medium flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: Slicer & Seam Editor */}
        {activeTab === 'slicer' && (
          <div className="space-y-6">
            {/* Quick Workflow Guide Banner */}
            <div className="bg-[#1E293B] rounded-xl border border-slate-700 p-4 shadow-lg flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Automated Seamless Slicing Pipeline Active
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    1. Smart seam detection scans whitespace &bull; 2. 2× Retina resolution applied &bull; 3. Table styling ensures 0px gap in Outlook/Gmail &bull; 4. Ready to paste directly into email!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  Tip: Press <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-slate-200 font-bold">Ctrl + V</kbd> anywhere to paste screenshot
                </span>
              </div>
            </div>

            {/* Split Workspace: Left (Visualizer) + Right (Controls) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Seam Visualizer (7 cols) */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
                <SeamVisualizer
                  canvas={sourceCanvas}
                  cutPoints={cutPoints}
                  onUpdateCutPoints={(newPoints) => {
                    setCutPoints(newPoints);
                    // Generate slices whenever cut points update
                    if (sourceCanvas) {
                      generateSlices(sourceCanvas, newPoints, optimization).then(setSlices);
                    }
                  }}
                  searchWindow={slicingConfig.searchWindow}
                />
              </div>

              {/* Right Column: Slicing & Optimization Controls (5 cols) */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                <OptimizationControls
                  slicingConfig={slicingConfig}
                  onChangeSlicingConfig={setSlicingConfig}
                  optimization={optimization}
                  onChangeOptimization={(opt) => {
                    setOptimization(opt);
                    if (sourceCanvas && cutPoints.length > 0) {
                      generateSlices(sourceCanvas, cutPoints, opt).then(setSlices);
                    }
                  }}
                  onRecomputeSeams={handleRecomputeSeams}
                  onGenerateSlices={handleGenerateSlices}
                  isProcessing={isProcessing}
                />
              </div>
            </div>

            {/* Bottom Section: Slices Grid & Output Delivery */}
            <SlicesGrid
              slices={slices}
              reportTitle={reportTitle}
              optimization={optimization}
              onOpenEmailPreview={() => setIsEmailModalOpen(true)}
            />
          </div>
        )}

        {/* TAB 2: HTML Report Studio */}
        {activeTab === 'report-studio' && (
          <div className="space-y-6">
            <div className="bg-[#1E293B] rounded-xl border border-slate-700 p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                    Iraq Erbil TFAE Field Technical &amp; Camera IQ Report Studio
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Engineered strictly per TFAE &amp; Image Evaluation Lead specifications (Infinix, Tecno, itel portfolio &bull; Fastlink 5G &bull; Camera IQ &bull; Regional Management Value Propositions).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCaptureReport}
                  disabled={isCapturing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg font-semibold text-xs shadow-md transition-colors cursor-pointer border border-indigo-400/40"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isCapturing ? 'Rendering & Slicing...' : '1-Click Capture & Slice for Email'}</span>
                </button>
              </div>
            </div>

            {/* Report View Paper Preview in Sleek Dark Frame */}
            <div className="bg-slate-900/90 p-4 sm:p-8 rounded-2xl border border-slate-700 shadow-xl overflow-x-auto">
              <TfaeReportView
                reportRef={reportRef}
                entries={reportEntries}
                isCapturing={isCapturing}
              />
            </div>
          </div>
        )}
      </main>

      {/* Email Preview Modal */}
      <EmailPreviewModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        slices={slices}
        reportTitle={reportTitle}
        optimization={optimization}
      />

      {/* Hidden Offscreen Container for HTML Report Rendering when in Slicer Tab */}
      <div
        style={{
          position: 'absolute',
          left: -99999,
          top: -99999,
          width: '850px',
          opacity: activeTab === 'report-studio' ? 0 : 1,
          pointerEvents: 'none',
        }}
      >
        {activeTab !== 'report-studio' && (
          <TfaeReportView
            reportRef={reportRef}
            entries={reportEntries}
            isCapturing={isCapturing}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#1E293B] border-t border-slate-700 py-3.5 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Format: 24-bit PNG</span>
            <span>&bull;</span>
            <span>PPI: 300 Optimized</span>
            <span>&bull;</span>
            <span>Total Quality: 98%</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline text-slate-500">TFAE Field Technical &amp; Executive Email Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Cloud Sync: Enabled</span>
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
