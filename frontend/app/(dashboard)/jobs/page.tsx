"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Video,
  Building2,
  Upload
} from "lucide-react";
import { fetchApi } from "../../lib/api";

export default function ProcessingJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetchApi("/jobs/");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      // Ignore poll error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Auto-poll if any job is queued or processing
    const interval = setInterval(() => {
      fetchJobs();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Asynchronous Python CV Queue
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Processing Jobs</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time status of YOLOv8 object detection, ByteTrack tracking, and viewing zone dwell calculations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all text-xs flex items-center gap-2"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <Link
            href="/analysis/new"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 text-sm"
          >
            <Upload size={16} /> New Analysis
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500 text-sm">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading processing queue...
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Activity size={36} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Processing Jobs Queued</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Upload an MP4 camera recording or trigger a sample study to initiate the computer vision pipeline.
          </p>
          <Link
            href="/analysis/new"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all inline-flex items-center gap-2"
          >
            <Upload size={16} /> Start First Analysis
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Job ID</th>
                  <th className="py-4 px-6">Video / Campaign</th>
                  <th className="py-4 px-6">Site Location</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Frames</th>
                  <th className="py-4 px-6 text-center">Tracked IDs</th>
                  <th className="py-4 px-6 text-center">Exposures</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-5 px-6 font-mono text-xs font-bold text-slate-400">
                      #{job.id}
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-semibold text-white">{job.campaign_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{job.filename}</div>
                    </td>
                    <td className="py-5 px-6 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-slate-500" />
                        <span>{job.site_name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      {job.status === "completed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                      {job.status === "processing" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <div className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                          Processing...
                        </span>
                      )}
                      {job.status === "queued" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock size={13} /> Queued
                        </span>
                      )}
                      {job.status === "failed" && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle size={13} /> Failed
                          </span>
                          {job.error_message && (
                            <p className="text-[11px] text-red-400 mt-1 max-w-xs truncate" title={job.error_message}>
                              {job.error_message}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6 text-center font-mono text-slate-300">
                      {job.total_frames > 0 ? job.total_frames : "-"}
                    </td>
                    <td className="py-5 px-6 text-center font-mono font-bold text-purple-300">
                      {job.total_tracked_ids > 0 ? job.total_tracked_ids : "-"}
                    </td>
                    <td className="py-5 px-6 text-center font-mono font-bold text-emerald-400">
                      {job.total_exposures > 0 ? job.total_exposures : (job.status === "completed" ? "0" : "-")}
                    </td>
                    <td className="py-5 px-6 text-right">
                      {job.status === "completed" && job.video_id ? (
                        <Link
                          href={`/results/${job.video_id}`}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-blue-600/20"
                        >
                          View Results <ArrowRight size={13} />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">In Pipeline</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
