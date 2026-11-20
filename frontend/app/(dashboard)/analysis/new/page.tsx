"use client";

import { Suspense } from "react";
import { useEffect, useState, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Building2,
  Video,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sliders,
  Sparkles,
  Play
} from "lucide-react";
import { API_BASE_URL, fetchApi } from "../../../lib/api";

const ROI_PRESETS = [
  {
    name: "Center Viewing Cone (Default)",
    description: "Standard billboard line-of-sight directly in front of the screen",
    points: [[0.3, 0.3], [0.7, 0.3], [0.7, 0.7], [0.3, 0.7]],
  },
  {
    name: "Wide Urban Concourse",
    description: "Expansive pedestrian plaza with multiple approach angles",
    points: [[0.15, 0.25], [0.85, 0.25], [0.85, 0.75], [0.15, 0.75]],
  },
  {
    name: "Sidewalk Corridor",
    description: "Linear pedestrian flow along high street or transit route",
    points: [[0.2, 0.4], [0.8, 0.4], [0.75, 0.85], [0.25, 0.85]],
  },
];

function NewAnalysisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSiteId = searchParams?.get("site_id");

  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(preselectedSiteId || "");
  const [campaignName, setCampaignName] = useState("Piccadilly Summer Verification");
  const [videoSource, setVideoSource] = useState<"sample" | "upload">("sample");
  const [file, setFile] = useState<File | null>(null);
  const [dwellThreshold, setDwellThreshold] = useState<number>(2.0);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  const [loadingSites, setLoadingSites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdJob, setCreatedJob] = useState<any | null>(null);

  useEffect(() => {
    fetchApi("/sites/")
      .then((r) => r.json())
      .then((data) => {
        setSites(Array.isArray(data) ? data : []);
        if (data && data.length > 0) {
          if (!preselectedSiteId) {
            setSelectedSiteId(String(data[0].id));
          }
        }
        setLoadingSites(false);
      })
      .catch(() => {
        setLoadingSites(false);
      });
  }, [preselectedSiteId]);

  const currentRoiPoints = ROI_PRESETS[selectedPresetIndex].points;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSiteId) {
      setError("Please select or register a billboard site.");
      return;
    }

    if (videoSource === "upload" && !file) {
      setError("Please select an MP4 video file to upload.");
      return;
    }

    setSubmitting(true);

    try {
      if (videoSource === "sample") {
        // Run analysis on verified test video
        const res = await fetchApi("/videos/analyze-sample/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site_id: parseInt(selectedSiteId),
            campaign_name: campaignName.trim(),
            dwell_threshold: dwellThreshold,
            roi_config: JSON.stringify({
              points: currentRoiPoints,
              campaign_name: campaignName.trim(),
            }),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to start analysis");

        setCreatedJob(data);
      } else {
        // Upload custom MP4 file
        const formData = new FormData();
        formData.append("site_id", selectedSiteId);
        formData.append("campaign_name", campaignName.trim());
        formData.append("dwell_threshold", String(dwellThreshold));
        formData.append(
          "roi_config",
          JSON.stringify({
            points: currentRoiPoints,
            campaign_name: campaignName.trim(),
          })
        );
        formData.append("file", file!);

        const res = await fetch(`${API_BASE_URL}/videos/upload/`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Video upload failed");

        setCreatedJob(data);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred starting the analysis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">New Audience Verification Study</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure site camera feeds, calibrate the viewing zone ROI polygon, and set minimum dwell exposure thresholds.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Modal / Banner when job queued */}
      {createdJob && (
        <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 size={24} />
            <h2 className="text-xl font-bold text-white">Processing Job Initiated</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your video has been registered and enqueued for computer vision processing. The worker is running YOLOv8 person detection, ByteTrack multi-object tracking, and viewing-zone dwell evaluation.
          </p>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 space-y-1">
            <p>Job ID: <span className="text-white font-bold">#{createdJob.job_id}</span></p>
            <p>Video ID: <span className="text-white font-bold">#{createdJob.video_id}</span></p>
            <p>Status: <span className="text-blue-400 uppercase font-bold">{createdJob.status || "queued"}</span></p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/jobs"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm"
            >
              Monitor Job in Processing Queue <ArrowRight size={16} />
            </Link>
            <Link
              href={`/results/${createdJob.video_id}`}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl transition-all text-sm flex items-center justify-center"
            >
              Go to Results Page
            </Link>
          </div>
        </div>
      )}

      {!createdJob && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Site & Campaign */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="flex items-center gap-2.5 text-blue-400">
              <span className="h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                1
              </span>
              <h2 className="font-bold text-base text-white">Billboard Site & Campaign Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Billboard Site
                </label>
                {loadingSites ? (
                  <div className="text-xs text-slate-500 py-3">Loading sites...</div>
                ) : (
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location || "Default Location"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Campaign / Study Title
                </label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Piccadilly Summer Exposure Study"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Video Feed Selection */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <span className="h-6 w-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                2
              </span>
              <h2 className="font-bold text-base text-white">Video Source Ingestion</h2>
            </div>

            {/* Toggle tabs */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 max-w-md">
              <button
                type="button"
                onClick={() => setVideoSource("sample")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  videoSource === "sample"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Verified Test Video (ooh_test.mp4)
              </button>
              <button
                type="button"
                onClick={() => setVideoSource("upload")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  videoSource === "upload"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Upload Custom MP4 File
              </button>
            </div>

            {videoSource === "sample" ? (
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start gap-3">
                <Video size={20} className="text-blue-400 mt-1 shrink-0" />
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-white mb-1">
                    Verified Benchmark Video: data/videos/ooh_test.mp4 (835 frames, 61.4 MB)
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Uses the verified urban concourse camera feed. Instant server-side processing without re-uploading large video files.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Choose MP4 Recording
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Step 3: ROI / Viewing Zone Configuration */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="flex items-center gap-2.5 text-purple-400">
              <span className="h-6 w-6 rounded-full bg-purple-600/20 text-purple-400 text-xs font-bold flex items-center justify-center border border-purple-500/30">
                3
              </span>
              <h2 className="font-bold text-base text-white">Viewing Zone (ROI Polygon) Calibration</h2>
            </div>

            <p className="text-xs text-slate-400">
              Define the physical polygon geometry within the camera viewport representing the Opportunity-to-See (OTS) viewing cone.
            </p>

            {/* Presets */}
            <div className="grid sm:grid-cols-3 gap-4">
              {ROI_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => setSelectedPresetIndex(idx)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    selectedPresetIndex === idx
                      ? "bg-purple-950/30 border-purple-500/80 text-white shadow-md shadow-purple-900/20"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-xs text-white mb-1">{preset.name}</p>
                  <p className="text-[11px] text-slate-400 leading-snug">{preset.description}</p>
                </button>
              ))}
            </div>

            {/* Visualizer Canvas */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-mono text-slate-400">Viewing Zone Preview (Normalized [0, 1])</span>
                <span className="text-yellow-400 font-mono text-[11px]">Yellow Polygon: Active Viewing Zone</span>
              </div>

              <div className="relative aspect-video w-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="25" y1="0" x2="25" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="75" y1="0" x2="75" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />

                  {/* Polygon fill & stroke */}
                  <polygon
                    points={currentRoiPoints.map((p) => `${p[0] * 100},${p[1] * 100}`).join(" ")}
                    fill="rgba(234, 179, 8, 0.18)"
                    stroke="#eab308"
                    strokeWidth="1.5"
                  />
                  {/* Vertices */}
                  {currentRoiPoints.map((p, i) => (
                    <circle key={i} cx={p[0] * 100} cy={p[1] * 100} r="2" fill="#eab308" />
                  ))}
                </svg>

                <div className="absolute bottom-3 left-4 text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded">
                  Points: {JSON.stringify(currentRoiPoints)}
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Dwell Time Threshold */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="flex items-center gap-2.5 text-amber-400">
              <span className="h-6 w-6 rounded-full bg-amber-600/20 text-amber-400 text-xs font-bold flex items-center justify-center border border-amber-500/30">
                4
              </span>
              <h2 className="font-bold text-base text-white">Minimum Dwell Exposure Threshold</h2>
            </div>

            <p className="text-xs text-slate-400">
              An individual must continuously reside inside the viewing zone for at least this threshold duration to count as an authentic exposure event.
            </p>

            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Exposure Threshold (Seconds)</span>
                  <span className="font-mono text-lg font-black text-amber-400">{dwellThreshold.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={dwellThreshold}
                  onChange={(e) => setDwellThreshold(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0.5s (Transient Glances)</span>
                  <span>2.0s (Standard Industry Benchmark)</span>
                  <span>10.0s (Prolonged Attention)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5: Review & Submit */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-0.5">Configuration Ready</p>
              <p className="text-sm text-slate-300">
                Site: <span className="text-white font-semibold">{sites.find((s) => String(s.id) === selectedSiteId)?.name || "Selected Site"}</span> &bull; Dwell: <span className="text-amber-400 font-semibold">{dwellThreshold}s</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enqueuing CV Pipeline...</span>
                </>
              ) : (
                <>
                  <Play size={16} /> Start Analysis
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NewAnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading analysis workflow...</div>}>
      <NewAnalysisForm />
    </Suspense>
  );
}
