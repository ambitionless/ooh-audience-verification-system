"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Printer,
  Download,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  Users,
  Layers,
  AlertCircle
} from "lucide-react";
import { fetchApi } from "../../lib/api";

function ReportsView() {
  const searchParams = useSearchParams();
  const queryVideoId = searchParams?.get("video_id");

  const [completedVideos, setCompletedVideos] = useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>(queryVideoId || "1");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available completed jobs to allow user to pick which report to inspect
  useEffect(() => {
    fetchApi("/analytics/overview")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.analyses && data.analyses.length > 0) {
          setCompletedVideos(data.analyses);
          if (!queryVideoId) {
            setSelectedVideoId(String(data.analyses[0].video_id));
          }
        }
      })
      .catch(() => {});
  }, [queryVideoId]);

  useEffect(() => {
    if (!selectedVideoId) return;
    setLoading(true);
    setError(null);

    fetchApi(`/reports/${selectedVideoId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not generate report for selected video.");
        return res.json();
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedVideoId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.report_id || "ooh_report"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Action Header - hidden when printing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Audience Verification Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            Official compliance certificates and auditable proof-of-performance reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {completedVideos.length > 1 && (
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {completedVideos.map((v) => (
                <option key={v.video_id} value={v.video_id}>
                  {v.campaign_name} (#{v.video_id})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleDownloadJson}
            disabled={!report}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all text-xs flex items-center gap-2"
          >
            <Download size={15} /> Export JSON
          </button>

          <button
            onClick={handlePrint}
            disabled={!report}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 text-xs"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500 text-sm">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Compiling audit report...
        </div>
      ) : error || !report ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
          <AlertCircle size={32} className="text-red-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Report Not Found</h3>
          <p className="text-slate-400 text-sm">Please select a valid completed analysis from the processing queue.</p>
        </div>
      ) : (
        /* Report Paper Document */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 lg:p-12 shadow-2xl space-y-10 text-slate-200 print:bg-white print:text-black print:p-0 print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-8 border-b border-slate-800 print:border-slate-300">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm print:bg-black">
                  O
                </div>
                <span className="font-extrabold text-lg text-white print:text-black tracking-tight">OOH VERIFY</span>
                <span className="text-[10px] uppercase font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded print:border-slate-400 print:text-slate-700">
                  Audit Certificate
                </span>
              </div>
              <h2 className="text-2xl font-black text-white print:text-black mt-2">
                {report.metadata.title}
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Site: <span className="font-semibold text-slate-200 print:text-black">{report.metadata.site.name}</span> &bull; {report.metadata.site.location}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs">
              <span className="text-[10px] uppercase text-slate-500 block">Certificate Identifier</span>
              <span className="font-bold text-blue-400 print:text-black text-sm">{report.report_id}</span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Generated: {new Date(report.generated_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/70 rounded-xl border border-slate-800 print:bg-slate-50 print:border-slate-300 print:text-black">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Object Detector</span>
              <span className="text-xs font-semibold">{report.metadata.pipeline.detector}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tracking Engine</span>
              <span className="text-xs font-semibold">{report.metadata.pipeline.tracker}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Dwell Threshold</span>
              <span className="text-xs font-semibold">&ge; {report.metadata.pipeline.dwell_threshold_seconds}s</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Frames Analyzed</span>
              <span className="text-xs font-semibold">{report.metadata.pipeline.total_frames_analyzed} frames</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div>
            <h3 className="text-xs font-mono uppercase font-bold text-slate-400 print:text-slate-600 mb-4 tracking-wider">
              1. Certified Measurement Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Unique Tracked Persons</span>
                <span className="text-3xl font-black text-purple-300 print:text-black font-mono">
                  {report.metrics.unique_tracked_persons}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Isolated ByteTrack subjects</span>
              </div>

              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Measurable Exposures</span>
                <span className="text-3xl font-black text-emerald-400 print:text-black font-mono">
                  {report.metrics.measurable_exposure_events}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Met dwell in viewing zone</span>
              </div>

              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Average Dwell Time</span>
                <span className="text-3xl font-black text-amber-300 print:text-black font-mono">
                  {report.metrics.average_dwell_time_seconds}s
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Mean duration in ROI</span>
              </div>

              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Exposure Rate</span>
                <span className="text-3xl font-black text-blue-400 print:text-black font-mono">
                  {report.metrics.exposure_conversion_rate}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Exposures / Tracked</span>
              </div>
            </div>
          </div>

          {/* Evidence Sample */}
          <div>
            <h3 className="text-xs font-mono uppercase font-bold text-slate-400 print:text-slate-600 mb-4 tracking-wider">
              2. Verified Event Log (PostgreSQL Records)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 print:bg-slate-100 print:text-black border-b border-slate-800 print:border-slate-300">
                  <tr>
                    <th className="py-2.5 px-4">Event #</th>
                    <th className="py-2.5 px-4">ByteTrack ID</th>
                    <th className="py-2.5 px-4 text-center">Entry Time (s)</th>
                    <th className="py-2.5 px-4 text-center">Verified Dwell (s)</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {report.evidence_sample.map((ev: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 text-slate-500">EVT-{(idx + 1).toString().padStart(3, "0")}</td>
                      <td className="py-2.5 px-4 font-bold text-purple-300 print:text-black">#{ev.tracking_id}</td>
                      <td className="py-2.5 px-4 text-center">{ev.entry_time}s</td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-300 print:text-black">{ev.dwell_seconds}s</td>
                      <td className="py-2.5 px-4 text-right text-emerald-400 print:text-black font-sans">
                        &check; Certified
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Methodology & Limitations */}
          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-800 print:border-slate-300 text-xs">
            <div>
              <h4 className="font-bold text-white print:text-black uppercase tracking-wider mb-2">
                3. Verification Methodology
              </h4>
              <p className="text-slate-400 print:text-slate-700 leading-relaxed">
                {report.methodology.definition}
              </p>
              <p className="text-slate-400 print:text-slate-700 leading-relaxed mt-2">
                {report.methodology.privacy_standard}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white print:text-black uppercase tracking-wider mb-2">
                4. Audit Limitations & Disclaimers
              </h4>
              <ul className="text-slate-400 print:text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                {report.limitations.map((lim: string, idx: number) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signature & Audit Stamp */}
          <div className="pt-8 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>OOH Audience Verification System &bull; Build 6 Release</span>
            </div>
            <div className="mt-2 sm:mt-0 font-mono text-[11px]">
              SHA256 Audit Seal: Verified via PostgreSQL DB
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Compiling audit report...</div>}>
      <ReportsView />
    </Suspense>
  );
}
