import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import {
  DEFAULT_POSTER_META,
  POSTER_DATA,
  POSTER_FIGURES,
  PosterCustomMeta,
} from '../../lib/posterContent';

export const PosterView: React.FC = () => {
  const [meta, setMeta] = useState<PosterCustomMeta>(DEFAULT_POSTER_META);
  const [downloading, setDownloading] = useState<'pptx' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = () => {
    const params = new URLSearchParams({
      projectCode: meta.projectCode,
      teamMembers: meta.teamMembers,
      schoolName: meta.schoolName,
    });
    return params.toString();
  };

  const handleDownload = async (format: 'pptx' | 'pdf') => {
    setDownloading(format);
    setError(null);
    try {
      const res = await fetch(`/api/poster/download/${format}?${buildQuery()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Download failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        format === 'pptx'
          ? 'NEURANUM_ISEF_Poster_48x36.pptx'
          : 'NEURANUM_ISEF_Poster_48x36.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export error');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header & Export Bar */}
      <div className="border border-[#1C2536] bg-[#0E131D] rounded p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1C2536] pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-100">
              ISEF Tri-Fold Display Board (48&Prime; × 36&Prime;)
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Final print-ready layout with large legible typography, 4 enlarged high-impact figures, verified NEURANUM v2.0.0 metrics, balanced surrogate validation notes, and APA references. Download as an editable <span className="font-mono text-cyan-300">.pptx</span> or vector <span className="font-mono text-cyan-300">.pdf</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={downloading !== null}
              onClick={() => handleDownload('pptx')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {downloading === 'pptx'
                ? 'Generating Editable PPTX...'
                : 'Download Editable PPTX (48×36 in)'}
            </button>

            <button
              type="button"
              disabled={downloading !== null}
              onClick={() => handleDownload('pdf')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded border border-cyan-500/50 bg-[#131A27] hover:bg-[#1C2536] text-cyan-300 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              {downloading === 'pdf'
                ? 'Rendering Vector PDF...'
                : 'Download Print PDF (48×36 in)'}
            </button>
          </div>
        </div>

        {/* Team Metadata Customization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1 text-xs">
            <span className="text-slate-400 block font-mono">Project Code</span>
            <input
              type="text"
              value={meta.projectCode}
              onChange={(e) => setMeta({ ...meta, projectCode: e.target.value })}
              className="w-full bg-[#080B11] border border-[#2C3A52] rounded px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-slate-400 block font-mono">Team Members</span>
            <input
              type="text"
              value={meta.teamMembers}
              onChange={(e) => setMeta({ ...meta, teamMembers: e.target.value })}
              className="w-full bg-[#080B11] border border-[#2C3A52] rounded px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-slate-400 block font-mono">Institution</span>
            <input
              type="text"
              value={meta.schoolName}
              onChange={(e) => setMeta({ ...meta, schoolName: e.target.value })}
              className="w-full bg-[#080B11] border border-[#2C3A52] rounded px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-[11px] text-slate-400 pt-1">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            4 enlarged 2×2 high-res graphs with axes &amp; units
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <Printer className="w-3.5 h-3.5" />
            True 48&Prime;×36&Prime; print typography (16–42 pt on board)
          </span>
        </div>

        {error && (
          <div className="border border-rose-500/40 bg-rose-950/30 text-rose-200 px-4 py-2 rounded text-xs">
            ✖ {error}
          </div>
        )}
      </div>

      {/* Interactive Tri-Fold Poster Canvas Preview */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[1440px] bg-[#E2E8F0] p-4 rounded border border-[#1C2536] text-slate-900 shadow-2xl space-y-3">
          {/* TOP BANNER */}
          <div className="bg-[#0F2942] border-2 border-[#0E7490] border-b-4 border-b-[#22D3EE] px-10 py-6 text-center space-y-2 rounded-sm">
            <h2 className="text-[31px] font-bold text-white leading-snug tracking-tight">
              {POSTER_DATA.title}
            </h2>
            <p className="text-lg font-medium text-[#67E8F9]">
              {POSTER_DATA.subtitle}
            </p>
            <div className="pt-1 text-[15px] font-mono font-semibold text-slate-200">
              Project Code: {meta.projectCode} &nbsp;|&nbsp; Team: {meta.teamMembers} &nbsp;|&nbsp; Institution: {meta.schoolName}
            </div>
          </div>

          {/* TRI-FOLD 3-PANEL GRID (25% Left | 50% Center | 25% Right) */}
          <div className="grid grid-cols-12 gap-3 items-stretch">
            {/* ==================== LEFT WING (3 cols) ==================== */}
            <div className="col-span-3 bg-white border border-slate-300 p-3 flex flex-col gap-3">
              <PosterCard title="1. Abstract" navyHeader className="flex-1">
                <p className="text-[15.5px] leading-relaxed text-slate-900">
                  {POSTER_DATA.abstract}
                </p>
              </PosterCard>

              <PosterCard title="2. Purpose &amp; Problem Statement" className="flex-1">
                <div className="space-y-2.5 text-[15px] leading-relaxed text-slate-900">
                  <p>
                    <strong className="text-[#0F2942]">General Problem:</strong>{' '}
                    {POSTER_DATA.generalProblem}
                  </p>
                  <p>
                    <strong className="text-[#0F2942]">Specialized Problem:</strong>{' '}
                    {POSTER_DATA.specializedProblem}
                  </p>
                  <table className="w-full text-[13.5px] border-collapse border border-slate-300 mt-1">
                    <thead className="bg-slate-200 text-[#0F2942]">
                      <tr>
                        {POSTER_DATA.sorourBrineTable.headers.map((h) => (
                          <th key={h} className="p-2 text-left border border-slate-300 font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {POSTER_DATA.sorourBrineTable.rows.map((r, i) => (
                        <tr key={i} className="odd:bg-white even:bg-slate-50">
                          {r.map((c, j) => (
                            <td key={j} className="p-2 border border-slate-300">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[13px] italic text-slate-600">
                    {POSTER_DATA.sorourBrineTable.caption}
                  </p>
                </div>
              </PosterCard>

              <PosterCard title="3. Background Research &amp; Gap" className="flex-1">
                <table className="w-full text-[13px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-[#0F2942]">
                    <tr>
                      {POSTER_DATA.backgroundTable.headers.map((h) => (
                        <th key={h} className="p-1.5 text-left border border-slate-300 font-bold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POSTER_DATA.backgroundTable.rows.map((r, i) => (
                      <tr key={i} className="odd:bg-white even:bg-slate-50">
                        <td className="p-1.5 border border-slate-300 font-bold text-[#0F2942]">
                          {r[0]}
                        </td>
                        <td className="p-1.5 border border-slate-300">{r[1]}</td>
                        <td className="p-1.5 border border-slate-300">{r[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-slate-900">
                  <strong className="text-[#0E7490]">Research Gap:</strong>{' '}
                  {POSTER_DATA.researchGap}
                </p>
              </PosterCard>

              <PosterCard title="4. Research Question &amp; Hypothesis">
                <div className="space-y-3 text-[16px] leading-relaxed text-slate-900">
                  <p>
                    <strong className="text-[#0F2942]">Question:</strong>{' '}
                    {POSTER_DATA.researchQuestion}
                  </p>
                  <p>
                    <strong className="text-[#0F2942]">Hypothesis:</strong>{' '}
                    {POSTER_DATA.hypothesis}
                  </p>
                </div>
              </PosterCard>

              <PosterCard title="5. Materials &amp; Software Tools">
                <table className="w-full text-[13.5px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-[#0F2942]">
                    <tr>
                      <th className="p-2 text-left border border-slate-300">Tool / Stack</th>
                      <th className="p-2 text-left border border-slate-300">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {POSTER_DATA.materialsTools.map((m, i) => (
                      <tr key={i} className="odd:bg-white even:bg-slate-50">
                        <td className="p-2 border border-slate-300 font-semibold text-[#0F2942]">
                          {m[0]}
                        </td>
                        <td className="p-2 border border-slate-300">{m[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PosterCard>

              <PosterCard title="6. Variables">
                <table className="w-full text-[13.5px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-[#0F2942]">
                    <tr>
                      {POSTER_DATA.variablesTable.headers.map((h) => (
                        <th key={h} className="p-2 text-left border border-slate-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POSTER_DATA.variablesTable.rows.map((r, i) => (
                      <tr key={i} className="odd:bg-white even:bg-slate-50">
                        <td className="p-2 border border-slate-300 font-semibold text-[#0F2942] align-top">
                          {r[0]}
                        </td>
                        <td className="p-2 border border-slate-300 font-mono text-[13px] leading-snug">
                          {r[1]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PosterCard>
            </div>

            {/* ==================== CENTER PANEL (6 cols) ==================== */}
            <div className="col-span-6 bg-white border border-slate-300 p-3 flex flex-col gap-3">
              <PosterCard title="7. Procedure" navyHeader>
                <div className="grid grid-cols-4 gap-2.5">
                  {POSTER_DATA.procedureSteps.map((step, i) => (
                    <div
                      key={i}
                      className="border border-[#0E7490] bg-white p-3 rounded-sm text-[14.5px] leading-snug text-slate-900"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </PosterCard>

              <PosterCard title="8. Data &amp; Benchmark Verification">
                <table className="w-full text-[14.5px] border-collapse border border-slate-300">
                  <thead className="bg-slate-200 text-[#0F2942]">
                    <tr>
                      {POSTER_DATA.verifiedDataTable.headers.map((h) => (
                        <th key={h} className="p-2 text-left border border-slate-300 font-bold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[14px]">
                    {POSTER_DATA.verifiedDataTable.rows.map((r, i) => (
                      <tr key={i} className="odd:bg-white even:bg-slate-50">
                        <td className="p-2 border border-slate-300 font-sans font-semibold text-[#0F2942]">
                          {r[0]}
                        </td>
                        <td className="p-2 border border-slate-300">{r[1]}</td>
                        <td className="p-2 border border-slate-300">{r[2]}</td>
                        <td className="p-2 border border-slate-300 font-bold text-emerald-700">
                          {r[3]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PosterCard>

              {/* 2×2 LARGE HIGH-IMPACT FIGURES */}
              <PosterCard
                title="9. Graphs — Multi-Physics Transport, Brines &amp; Scaling Risk"
                navyHeader
                className="flex-1 flex flex-col"
              >
                <div className="grid grid-cols-2 gap-3.5 flex-1">
                  {POSTER_FIGURES.map((fig) => (
                    <div
                      key={fig.filename}
                      className="border border-slate-300 bg-white p-3 flex flex-col justify-between gap-2"
                    >
                      <div className="text-[15.5px] font-bold text-[#0F2942] leading-tight">
                        {fig.title}
                      </div>
                      <div className="bg-white flex items-center justify-center py-1 flex-1">
                        <img
                          src={`/figures/${fig.filename}`}
                          alt={fig.title}
                          className="w-full h-auto object-contain max-h-[265px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[13px] font-mono font-semibold text-[#0369A1]">
                          Axes / Units: {fig.axesAndUnits}
                        </div>
                        <p className="text-[13.5px] text-slate-700 leading-snug">
                          {fig.caption}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </PosterCard>

              <PosterCard title="10. Data Analysis">
                <div className="grid grid-cols-2 gap-3">
                  {POSTER_DATA.dataAnalysisPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="border border-slate-300 bg-white p-3.5 text-[15px] leading-relaxed text-slate-900"
                    >
                      {pt}
                    </div>
                  ))}
                </div>
              </PosterCard>
            </div>

            {/* ==================== RIGHT WING (3 cols) ==================== */}
            <div className="col-span-3 bg-white border border-slate-300 p-3 flex flex-col gap-3">
              <PosterCard title="11. Results" className="flex-1">
                <ul className="list-disc pl-4 space-y-2.5 text-[15.5px] leading-relaxed text-slate-900">
                  {POSTER_DATA.resultsSummary.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </PosterCard>

              <PosterCard title="12. Surrogate Calibration &amp; Limitations" navyHeader className="flex-1">
                <div className="space-y-2.5">
                  <table className="w-full text-[13.5px] border-collapse border border-slate-300">
                    <thead className="bg-slate-200 text-[#0F2942]">
                      <tr>
                        {POSTER_DATA.pinnSummaryTable.headers.map((h) => (
                          <th key={h} className="p-2 text-left border border-slate-300 font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {POSTER_DATA.pinnSummaryTable.rows.map((r, i) => (
                        <tr key={i} className="bg-white">
                          <td className="p-2 border border-slate-300 font-semibold text-[#0F2942]">
                            {r[0]}
                          </td>
                          <td className="p-2 border border-slate-300 font-mono font-semibold text-slate-900">
                            {r[1]}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700">
                            {r[2]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[13.5px] italic text-slate-700 leading-snug">
                    {POSTER_DATA.pinnSummaryTable.note}
                  </p>
                </div>
              </PosterCard>

              <PosterCard title="13. Conclusions" navyHeader className="flex-1">
                <ul className="list-disc pl-4 space-y-2.5 text-[16px] leading-relaxed text-slate-900">
                  {POSTER_DATA.conclusions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </PosterCard>

              <PosterCard title="14. Applications &amp; Future Work" className="flex-1">
                <div className="space-y-3 text-[15px] leading-relaxed text-slate-900">
                  <div>
                    <strong className="text-[#0F2942] block mb-1">
                      Applications:
                    </strong>
                    <ul className="list-disc pl-4 space-y-1.5">
                      {POSTER_DATA.applications.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-[#0F2942] block mb-1">
                      Future Work:
                    </strong>
                    <div className="space-y-1.5">
                      {POSTER_DATA.futureWork.map((f, i) => (
                        <div key={i}>{f}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </PosterCard>

              <PosterCard title="15. Research Sources (APA)" navyHeader className="flex-1">
                <div className="space-y-2 text-[13.5px] leading-snug text-slate-900">
                  {POSTER_DATA.apaReferences.map((ref, i) => (
                    <p key={i} className="pl-3 -indent-3">
                      {ref}
                    </p>
                  ))}
                </div>
              </PosterCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PosterCard: React.FC<{
  title: string;
  children: React.ReactNode;
  navyHeader?: boolean;
  className?: string;
}> = ({ title, children, navyHeader, className = '' }) => (
  <section className={`border border-slate-300 bg-slate-50 flex flex-col ${className}`}>
    <div
      className={`px-3.5 py-2 text-[15px] font-bold uppercase tracking-wide text-white shrink-0 ${
        navyHeader ? 'bg-[#0F2942]' : 'bg-[#0E7490]'
      }`}
    >
      {title}
    </div>
    <div className="p-3.5 flex-1 flex flex-col">{children}</div>
  </section>
);
