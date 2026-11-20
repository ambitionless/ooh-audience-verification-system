"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { fetchApi } from "../../lib/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/analytics/overview")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load audience analytics");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Calculating real database metrics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <AlertCircle size={32} className="text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Analytics Unavailable</h2>
        <p className="text-slate-400 text-sm">Could not connect to PostgreSQL analytics backend.</p>
      </div>
    );
  }

  const { summary, dwell_distribution, analyses } = data;
  const conversionRate = summary.total_tracked_persons > 0
    ? ((summary.total_measurable_exposures / summary.total_tracked_persons) * 100).toFixed(1)
    : "0.0";

  const totalBucketValues = Object.values(dwell_distribution || {}).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. SUMMARY HIERARCHY */}
      <div className="pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Audience Analytics Module
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Audience Verification Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">
          Aggregated measurement intelligence derived strictly from verified PostgreSQL study logs. Zero synthetic estimations.
        </p>
      </div>

      {/* 2. CORE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tracked Persons</span>
            <Users size={20} />
          </div>
          <p className="text-4xl font-black text-purple-300 font-mono">{summary.total_tracked_persons}</p>
          <p className="text-[11px] text-slate-500 mt-2">Unique ByteTrack object trajectories</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Measurable Exposures</span>
            <Eye size={20} />
          </div>
          <p className="text-4xl font-black text-emerald-400 font-mono">{summary.total_measurable_exposures}</p>
          <p className="text-[11px] text-slate-500 mt-2">Dwell &ge; threshold verified inside ROI</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Average Dwell</span>
            <Clock size={20} />
          </div>
          <p className="text-4xl font-black text-amber-300 font-mono">{summary.overall_average_dwell_seconds}s</p>
          <p className="text-[11px] text-slate-500 mt-2">Continuous viewing cone exposure</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Exposure Rate</span>
            <TrendingUp size={20} />
          </div>
          <p className="text-4xl font-black text-blue-400 font-mono">{conversionRate}%</p>
          <p className="text-[11px] text-slate-500 mt-2">Tracked individuals qualifying for exposure</p>
        </div>
      </div>

      {/* 3. TRENDS: REAL DWELL DISTRIBUTION */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" /> Exposure Dwell Duration Distribution
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical breakdown of confirmed exposure events grouped by continuous dwell intervals.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(dwell_distribution || {}).map(([bucket, count]: [string, any]) => {
            const percent = totalBucketValues > 0 ? ((count / totalBucketValues) * 100).toFixed(0) : 0;
            return (
              <div key={bucket} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">{bucket}</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">{count} events</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block text-right font-mono">{percent}% of events</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. EVIDENCE: ANALYSIS LOG & HISTORY */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Database Verification Evidence Records</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified study runs archived in PostgreSQL.
          </p>
        </div>

        {analyses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Study / Campaign</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4 text-center">Tracked Persons</th>
                  <th className="py-3 px-4 text-center">Measurable Exposures</th>
                  <th className="py-3 px-4 text-center">Avg Dwell</th>
                  <th className="py-3 px-4 text-center">Threshold</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                {analyses.map((a: any) => (
                  <tr key={a.job_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{a.campaign_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{a.filename}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <div>{a.site_name}</div>
                      <div className="text-[11px] text-slate-500">{a.site_location || "Outdoor"}</div>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-purple-300 font-mono">
                      {a.tracked_persons}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-emerald-400 font-mono">
                      {a.exposure_events}
                    </td>
                    <td className="py-4 px-4 text-center text-amber-300 font-mono">
                      {a.avg_dwell_seconds}s
                    </td>
                    <td className="py-4 px-4 text-center text-slate-400 font-mono">
                      &ge; {a.dwell_threshold}s
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/results/${a.video_id}`}
                        className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all"
                      >
                        Details <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6">No historical records available in the database.</p>
        )}
      </div>

      {/* 5. METHODOLOGY & AUDIT PRINCIPLES */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
        <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400" /> Measurement Standard & Integrity
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed mb-3">
          Our audience analytics strictly reflect physical presence and dwell time inside calibrated line-of-sight viewing cones. Unlike legacy proxy models based on vehicular counters or cell tower pings, each data point originates from frame-by-frame computer vision verification with verified entry and dwell timestamps.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">Verified Database Records Only</span>
          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">Zero Synthetic PII</span>
          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">Auditable Timestamps</span>
        </div>
      </div>
    </div>
  );
}
