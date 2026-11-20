"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Eye,
  Clock,
  Video as VideoIcon,
  Building2,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ShieldCheck,
  Download
} from "lucide-react";
import { API_BASE_URL, fetchApi } from "../../../lib/api";

function ResultsContent() {
  const params = useParams();
  const videoId = params?.video_id;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    fetchApi(`/results/${videoId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load analysis results from database.");
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
  }, [videoId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Retrieving verified database records...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <AlertCircle size={32} className="text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Results Record Not Found</h2>
        <p className="text-slate-400 text-sm">Unable to retrieve computer vision metrics for video ID #{videoId}.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm"
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const videoUrl = data.output_video_url ? `${API_BASE_URL}${data.output_video_url}` : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Back and Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft size={14} /> Back to Processing Jobs
        </Link>

        <Link
          href={`/reports?video_id=${data.video_id}`}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
        >
          <FileText size={14} /> Open Audit Report
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <CheckCircle2 size={13} /> Verified Analysis Result
            </div>
            <h1 className="text-3xl font-black text-white">{data.campaign_name}</h1>
            <p className="text-slate-400 text-xs font-mono mt-1">
              File: <span className="text-slate-200">{data.filename}</span> &bull; Site: <span className="text-slate-200">{data.site_name}</span> &bull; Job ID: #{data.job_id}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Execution Status</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {data.job_status.toUpperCase()}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Frames: {data.total_frames}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Verified Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unique Tracked Persons</span>
            <Users size={20} />
          </div>
          <p className="text-4xl font-black text-purple-300 font-mono">{data.unique_tracked_persons}</p>
          <p className="text-[11px] text-slate-500 mt-2">
            Distinct individuals tracked through video via ByteTrack
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Measurable Exposure Events</span>
            <Eye size={20} />
          </div>
          <p className="text-4xl font-black text-emerald-400 font-mono">{data.measurable_exposure_events}</p>
          <p className="text-[11px] text-slate-500 mt-2">
            Persisted in viewing zone for &ge; {data.dwell_threshold}s
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Dwell Time</span>
            <Clock size={20} />
          </div>
          <p className="text-4xl font-black text-amber-300 font-mono">{data.average_dwell_time_seconds}s</p>
          <p className="text-[11px] text-slate-500 mt-2">
            Mean residence duration within viewing cone
          </p>
        </div>
      </div>

      {/* Video Visualizer & Detection Stream */}
      {videoUrl && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <VideoIcon size={18} className="text-blue-400" /> Processed Detection Stream
            </h2>
            <span className="text-xs font-mono text-slate-400">
              YOLOv8 Bounding Boxes + ByteTrack IDs + Viewing Zone Overlay
            </span>
          </div>

          <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            >
              Your browser does not support HTML5 video playback.
            </video>
          </div>
        </div>
      )}

      {/* Timeline of Exposure Events */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Audience Exposure Timeline</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporal distribution of verified viewer exposure events across the video duration.
          </p>
        </div>

        {data.exposure_events.length > 0 ? (
          <div className="relative pt-6 pb-2">
            <div className="h-2 w-full bg-slate-950 rounded-full relative overflow-hidden border border-slate-800">
              {data.exposure_events.map((ev: any, idx: number) => {
                const maxTime = Math.max(...data.exposure_events.map((e: any) => e.entry_time), 30);
                const leftPercent = Math.min((ev.entry_time / maxTime) * 100, 98);
                return (
                  <div
                    key={idx}
                    title={`Tracking ID #${ev.tracking_id} entered at ${ev.entry_time}s (dwell: ${ev.dwell_seconds}s)`}
                    style={{ left: `${leftPercent}%` }}
                    className="absolute top-0 bottom-0 w-2.5 bg-emerald-500 rounded-full shadow-md shadow-emerald-500/50 cursor-pointer transform -translate-x-1/2 hover:scale-125 transition-transform"
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-3">
              <span>0.0s (Start)</span>
              <span>Timeline Duration</span>
              <span>
                {Math.max(...data.exposure_events.map((e: any) => e.entry_time), 30).toFixed(1)}s
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4">No exposure events recorded during this run.</p>
        )}
      </div>

      {/* Evidence Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Exposure Event Evidence Log</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auditable PostgreSQL records with individual tracking ID, entry timestamps, and dwell durations.
          </p>
        </div>

        {data.exposure_events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Event #</th>
                  <th className="py-3 px-4">ByteTrack ID</th>
                  <th className="py-3 px-4 text-center">Entry Time</th>
                  <th className="py-3 px-4 text-center">Verified Dwell Duration</th>
                  <th className="py-3 px-4 text-center">Threshold Met</th>
                  <th className="py-3 px-4 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {data.exposure_events.map((ev: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500">
                      EVT-{(idx + 1).toString().padStart(3, "0")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-300">
                      #{ev.tracking_id}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300">
                      {ev.entry_time}s
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-300 font-bold">
                      {ev.dwell_seconds}s
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      &ge; {data.dwell_threshold}s
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px] font-sans">
                        <CheckCircle2 size={12} /> Certified Exposure
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4">No individual exposure events logged.</p>
        )}
      </div>

      {/* Methodology & Definitions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
            <Layers size={18} className="text-blue-400" /> Methodology & Exposure Logic
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400 list-disc pl-4 leading-relaxed">
            <li>
              <strong>YOLOv8 Detection</strong>: Isolated detections are restricted to COCO Class 0 (Person) using a high-confidence threshold.
            </li>
            <li>
              <strong>ByteTrack Multi-Object Tracking</strong>: Assigns persistent numerical track IDs across consecutive video frames to prevent duplicate counts.
            </li>
            <li>
              <strong>Viewing Zone ROI</strong>: A calibrated polygon coordinates projection defines the physical Opportunity-to-See boundary.
            </li>
            <li>
              <strong>Measurable Exposure Event</strong>: Triggered when a tracked individual's bounding box intersects the Viewing Zone polygon and continuously resides inside for at least the configured minimum dwell threshold.
            </li>
          </ul>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-400" /> Technical Limitations & Disclaimers
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400 list-disc pl-4 leading-relaxed">
            <li>
              <strong>No Demographics or Biometrics</strong>: The platform does not estimate age, gender, race, emotion, or identity.
            </li>
            <li>
              <strong>Physical Presence, Not Eye Contact</strong>: Verification measures presence and dwell time inside the viewing cone, not individual gaze direction or cognitive attention.
            </li>
            <li>
              <strong>Zero Facial Recognition</strong>: No facial recognition models or facial crops are ever processed or stored.
            </li>
            <li>
              <strong>Environmental Factors</strong>: Ambient obstructions (heavy precipitation, umbrella cover, tall vehicles) may attenuate detections.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading verified analysis results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
