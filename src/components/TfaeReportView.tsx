import React from 'react';
import { TfaeEntry, Brand, TechCategory, KpiType, ValueScore } from '../types';
import { INITIAL_TFAE_ENTRIES, MONTHLY_KPI_METRICS } from '../data/sampleReportData';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Radio, 
  Camera, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  FileText,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface TfaeReportViewProps {
  reportRef: React.RefObject<HTMLDivElement | null>;
  entries?: TfaeEntry[];
  isCapturing?: boolean;
}

export const TfaeReportView: React.FC<TfaeReportViewProps> = ({
  reportRef,
  entries = INITIAL_TFAE_ENTRIES,
  isCapturing = false,
}) => {
  const getBrandBadge = (brand: Brand) => {
    switch (brand) {
      case 'Infinix':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Tecno':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'itel':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getKpiBadge = (kpi: KpiType) => {
    switch (kpi) {
      case 'Scenario Conversion':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Market Feedback':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Requirement':
        return 'bg-teal-100 text-teal-800 border-teal-300';
    }
  };

  const getValueBadge = (val: ValueScore) => {
    switch (val) {
      case 'High':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'Mid':
        return 'bg-orange-100 text-orange-800 border-orange-300 font-semibold';
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getCategoryIcon = (category: TechCategory) => {
    switch (category) {
      case 'Camera IQ':
        return <Camera className="w-4 h-4 text-pink-600 inline mr-1.5" />;
      case 'Network / Signal (Fastlink/5G)':
        return <Radio className="w-4 h-4 text-indigo-600 inline mr-1.5" />;
      case 'Software Stability':
        return <Cpu className="w-4 h-4 text-emerald-600 inline mr-1.5" />;
      case 'Hardware Durability (QC)':
        return <ShieldCheck className="w-4 h-4 text-amber-600 inline mr-1.5" />;
    }
  };

  return (
    <div
      ref={reportRef}
      id="tfae-html-report-container"
      className={`w-full max-w-[820px] mx-auto bg-white text-slate-900 shadow-sm border border-slate-200 transition-all ${
        isCapturing ? 'p-10' : 'p-8 sm:p-10'
      }`}
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Executive Header */}
      <header className="border-b-2 border-slate-900 pb-6 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-slate-900 text-white rounded">
                R&D &amp; RM Executive Briefing
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Confidential Engineering Document
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 leading-tight">
              IRAQ REGIONAL TECHNICAL EVALUATION &amp; FIELD IQ REPORT
            </h1>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Field Operations: Erbil City Center, 60M/100M Corridors, Iskan Market, &amp; Sulaymaniyah Hub
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
            <div className="flex items-center justify-end gap-1.5 font-semibold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-slate-700" />
              <span>{MONTHLY_KPI_METRICS.month}</span>
            </div>
            <div>Lead: <strong>{MONTHLY_KPI_METRICS.engineer}</strong></div>
            <div>Hub: <strong>{MONTHLY_KPI_METRICS.region}</strong></div>
          </div>
        </div>

        {/* Target Brands Line */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 uppercase tracking-wide">Target Portfolio:</span>
            <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Infinix</span>
            <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">Tecno</span>
            <span className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">itel</span>
          </div>
          <div className="text-slate-500 italic">
            Focus: Software Stability • Camera IQ • Network/Signal • Hardware Durability
          </div>
        </div>
      </header>

      {/* KPI Performance Summary Matrix */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            Monthly Technical KPI Delivery Matrix
          </h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            100% Targets Met / Exceeded
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase">Market Feedbacks</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {MONTHLY_KPI_METRICS.feedbackDelivered}{' '}
              <span className="text-xs font-normal text-slate-500">/ {MONTHLY_KPI_METRICS.feedbackTarget} target</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">116% Delivery Rate</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase">Scenario Conversions</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {MONTHLY_KPI_METRICS.scenariosDelivered}{' '}
              <span className="text-xs font-normal text-slate-500">/ {MONTHLY_KPI_METRICS.scenariosTarget} target</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">120% Delivery Rate</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase">R&D Requirements</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {MONTHLY_KPI_METRICS.requirementsDelivered}{' '}
              <span className="text-xs font-normal text-slate-500">/ {MONTHLY_KPI_METRICS.requirementsTarget} target</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Completed</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase">Dealer Interviews</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {MONTHLY_KPI_METRICS.interviewsDelivered}{' '}
              <span className="text-xs font-normal text-slate-500">/ {MONTHLY_KPI_METRICS.interviewsTarget}/wk</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Target Exceeded</div>
          </div>
        </div>
      </section>

      {/* Regional Manager Value Proposition Banner */}
      <section className="mb-8 p-4 bg-slate-900 text-white rounded">
        <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          Regional Management Value Proposition
        </div>
        <p className="text-xs leading-relaxed text-slate-200">
          <strong>Key Takeaway for Commercial Operations:</strong> Resolving the Fastlink 5G handover drop along 60-Meter Road and tuning selfie skin tone under high-EV Kurdish sunlight directly safeguards <strong>38% market share dominance</strong> against competing mid-range devices in Erbil. Rapid firmware OTAs provide immediate sales enablement for key distributor partners in Iskan and Family Mall.
        </p>
      </section>

      {/* Detailed Technical Field Entries */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-800" />
            Classified Technical Field Observations &amp; R&D Action Items
          </h2>
          <span className="text-xs text-slate-500">Filtered &amp; Validated Data ({entries.length} Entries)</span>
        </div>

        {entries.map((entry, index) => (
          <article
            key={entry.id}
            className="border border-slate-200 rounded p-5 bg-white hover:border-slate-300 transition-colors"
          >
            {/* Header badges */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-slate-400">
                  #{String(index + 1).padStart(2, '0')}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded border font-bold ${getKpiBadge(entry.kpiType)}`}>
                  KPI: [{entry.kpiType}]
                </span>
                <span className={`px-2 py-0.5 text-xs rounded border font-semibold ${getBrandBadge(entry.brand)}`}>
                  {entry.brand}
                </span>
                <span className="text-xs font-semibold text-slate-700 flex items-center">
                  {getCategoryIcon(entry.category)}
                  {entry.category}
                </span>
              </div>
              <div>
                <span className={`px-2.5 py-0.5 text-xs rounded border ${getValueBadge(entry.valueScore)}`}>
                  Value Score: {entry.valueScore}
                </span>
              </div>
            </div>

            {/* Technical Title */}
            <h3 className="text-base font-bold text-slate-950 mb-3 tracking-tight">
              {entry.technicalTitle}
            </h3>

            {/* Table Matrix for Market Reality & Engineering Analysis */}
            <div className="space-y-2.5 text-xs">
              <div className="bg-amber-50/60 p-3 rounded border border-amber-200/80">
                <span className="font-bold text-amber-900 uppercase tracking-wide block mb-1">
                  Market Reality (Shop Owner / Field Voice):
                </span>
                <p className="text-slate-800 italic leading-relaxed">
                  "{entry.marketReality}"
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wide block mb-1">
                  Engineering Deep-Dive (Technical Root Cause):
                </span>
                <p className="text-slate-700 leading-relaxed font-mono text-[11.5px]">
                  {entry.engineeringDeepDive}
                </p>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded border border-emerald-200">
                <span className="font-bold text-emerald-900 uppercase tracking-wide block mb-1">
                  Actionable Step (R&D / Product Engineering Next Step):
                </span>
                <p className="text-emerald-950 leading-relaxed font-medium">
                  {entry.actionableStep}
                </p>
              </div>

              {/* Scenario Conversion Validation Check requirement */}
              {entry.missingValidation && (
                <div className="bg-purple-50 p-2.5 rounded border border-purple-200 text-purple-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-snug">
                    <strong className="font-bold uppercase tracking-wide">Validation Check (R&D Artifact Status): </strong>
                    {entry.missingValidation}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* Footer Sign-off & Sealing */}
      <footer className="mt-8 pt-6 border-t border-slate-300 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div>Authorized By: <strong>Senior Technical Field Application Engineer (TFAE)</strong></div>
          <div>Field Lab: Erbil IQ Validation Station &amp; Drive-Test Unit</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-slate-400">DOC-REF: TFAE-IRQ-ERB-2026-M09</div>
          <div className="text-slate-600 font-semibold">Strictly for Internal R&D &amp; Management Review</div>
        </div>
      </footer>
    </div>
  );
};
