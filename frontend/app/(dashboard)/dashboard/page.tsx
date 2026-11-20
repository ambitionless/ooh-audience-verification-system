"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Users,
  Eye,
  Clock,
  ArrowRight,
  Upload,
  BarChart3,
  FileText,
  Activity,
  AlertCircle
} from "lucide-react";
import { fetchApi } from "../../lib/api";

export default function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/analytics/overview")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Real PostgreSQL & Computer Vision Records
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Workspace Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time physical audience measurement verified via YOLOv8, ByteTrack, and viewing zone dwell analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/analysis/new"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 text-sm"
          >
            <Upload size={16} /> New Analysis
          </Link>
          <Link
            href="/jobs"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            <Activity size={16} /> View Jobs
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>Unable to reach PostgreSQL backend. Ensure API is running at http://localhost:8000.</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Sites</span>
            <Building2 size={20} />
          </div>
          <p className="text-3xl font-black text-white">
            {loading ? "..." : stats?.summary?.total_sites ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Registered physical billboards</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Jobs</span>
            <CheckCircle2 size={20} />
          </div>
          <p className="text-3xl font-black text-white">
            {loading ? "..." : stats?.summary?.completed_jobs ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Verified video executions</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unique Tracked</span>
            <Users size={20} />
          </div>
          <p className="text-3xl font-black text-purple-300">
            {loading ? "..." : stats?.summary?.total_tracked_persons ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Isolated ByteTrack IDs</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Exposure Events</span>
            <Eye size={20} />
          </div>
          <p className="text-3xl font-black text-emerald-400">
            {loading ? "..." : stats?.summary?.total_measurable_exposures ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Viewing zone & dwell verified</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg. Dwell Time</span>
            <Clock size={20} />
          </div>
          <p className="text-3xl font-black text-amber-300">
            {loading ? "..." : `${stats?.summary?.overall_average_dwell_seconds ?? 0}s`}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Time inside viewing cone</p>
        </div>
      </div>

      {/* Verified Analyses Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Verified Video Analyses</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditable records loaded directly from the PostgreSQL database.
            </p>
          </div>
          <Link
            href="/analytics"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            Audience Analytics <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading database records...
          </div>
        ) : stats?.analyses?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Campaign / Video</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4 text-center">Tracked Persons</th>
                  <th className="py-3 px-4 text-center">Exposure Events</th>
                  <th className="py-3 px-4 text-center">Avg Dwell</th>
                  <th className="py-3 px-4 text-center">Threshold</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {stats.analyses.map((item: any) => (
                  <tr key={item.job_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{item.campaign_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.filename}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <div>{item.site_name}</div>
                      <div className="text-xs text-slate-500">{item.site_location || "Outdoor Sign"}</div>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-purple-300 font-mono">
                      {item.tracked_persons}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-emerald-400 font-mono">
                      {item.exposure_events}
                    </td>
                    <td className="py-4 px-4 text-center text-amber-300 font-mono">
                      {item.avg_dwell_seconds}s
                    </td>
                    <td className="py-4 px-4 text-center text-slate-400 font-mono text-xs">
                      &ge; {item.dwell_threshold}s
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/results/${item.video_id}`}
                        className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      >
                        Results <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            No completed analyses found. Launch your first analysis from the "New Analysis" page.
          </div>
        )}
      </div>

      {/* Methodology & Verification Summary Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-blue-400" /> Objective Measurement Logic
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            A measurable exposure event is certified when an individual detected by YOLOv8 (person class) and tracked by ByteTrack intersects with the configured Viewing Zone ROI polygon and continuously dwells for at least the specified threshold seconds.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">YOLOv8 Detection</span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">ByteTrack MOT</span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">Polygon ROI</span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">Dwell Counter</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
            <Clock size={18} className="text-indigo-400" /> Responsible Privacy Standard
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Physical reach is measured with zero personal data. We do not store or claim identity, demographics, eye contact, facial biometrics, or visual attention. All tracking states are temporary ID integers stored only during stream evaluation.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-indigo-300">
            <span className="px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-900/50">Zero PII</span>
            <span className="px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-900/50">Anonymous IDs</span>
            <span className="px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-900/50">GDPR Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
