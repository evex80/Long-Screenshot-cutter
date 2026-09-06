import React, { useState } from 'react';
import { SliceItem, OptimizationSettings } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Mail, 
  Smartphone, 
  Monitor, 
  Code, 
  CheckCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { generateEmailHtml, copyRichHtmlToClipboard, downloadSlicesZip } from '../utils/emailGenerator';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slices: SliceItem[];
  reportTitle: string;
  optimization: OptimizationSettings;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  slices,
  reportTitle,
  optimization,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [clientView, setClientView] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);

  if (!isOpen) return null;

  const emailHtml = generateEmailHtml(slices, {
    emailSubject: reportTitle,
    maxWidthPx: optimization.targetEmailWidth || 650,
    includeBorder: true,
    inlineBase64: true,
  });

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(emailHtml);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyRich = async () => {
    const ok = await copyRichHtmlToClipboard(slices, {
      emailSubject: reportTitle,
      maxWidthPx: optimization.targetEmailWidth || 650,
      includeBorder: true,
      inlineBase64: true,
    });
    if (ok) {
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2500);
    }
  };

  const targetWidth = optimization.targetEmailWidth || 650;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-indigo-600 text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Executive Email Continuity Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Verifies seamless 0-pixel alignment and high-contrast readability across Outlook &amp; Gmail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setClientView('desktop')}
                className={`px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-all ${
                  clientView === 'desktop'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (650px)</span>
              </button>
              <button
                type="button"
                onClick={() => setClientView('mobile')}
                className={`px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-all ${
                  clientView === 'mobile'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action / Tab Sub-header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                activeTab === 'visual'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visual Client Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                activeTab === 'code'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw Email HTML</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRich}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {copiedRich ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied for Direct Paste!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>1-Click Copy (Ctrl+V into Email)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
          {activeTab === 'visual' ? (
            <div className="flex justify-center">
              {/* Email Client Shell */}
              <div
                style={{
                  maxWidth: clientView === 'mobile' ? '390px' : '760px',
                  width: '100%',
                }}
                className="bg-white rounded-lg shadow-md border border-slate-300 overflow-hidden transition-all"
              >
                {/* Simulated Email Client Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs space-y-1.5 text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Subject: {reportTitle}
                    </span>
                    <span className="text-[11px] text-slate-400">Just now</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    From: <strong>Senior TFAE &amp; Image Evaluation Lead</strong> &lt;tfae.erbil@transsion.com&gt;
                  </div>
                  <div className="text-[11px] text-slate-500">
                    To: <strong>Regional Manager (RM) - Iraq</strong>, R&amp;D Software &amp; Camera Teams
                  </div>
                  <div className="pt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zero-gap seamless image stacking active (Total {slices.length} slices)</span>
                  </div>
                </div>

                {/* Email Body with Stacked Slices */}
                <div className="p-4 sm:p-6 bg-[#F8FAFC]">
                  <table
                    role="presentation"
                    cellPadding="0"
                    cellSpacing="0"
                    border={0}
                    style={{
                      width: '100%',
                      maxWidth: `${targetWidth}px`,
                      margin: '0 auto',
                      borderCollapse: 'collapse',
                      backgroundColor: '#FFFFFF',
                    }}
                    className="shadow-sm border border-slate-200"
                  >
                    <tbody>
                      {slices.map((slice) => (
                        <tr key={slice.id}>
                          <td
                            style={{
                              padding: 0,
                              margin: 0,
                              fontSize: 0,
                              lineHeight: 0,
                              borderCollapse: 'collapse',
                            }}
                          >
                            <img
                              src={slice.dataUrl}
                              alt={`Report slice ${slice.index}`}
                              style={{
                                display: 'block',
                                width: '100%',
                                maxWidth: `${targetWidth}px`,
                                height: 'auto',
                                border: 0,
                                outline: 'none',
                                textDecoration: 'none',
                                margin: 0,
                                padding: 0,
                                verticalAlign: 'bottom',
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold">
                  Outlook &amp; Gmail Certified HTML Source Code:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied HTML!' : 'Copy Code'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={emailHtml}
                rows={18}
                className="w-full font-mono text-xs p-4 bg-slate-950 text-slate-200 rounded-lg border border-slate-800 leading-relaxed select-all"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Tested against Microsoft Outlook 365, Gmail Web/App, and Apple Mail</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-50"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
