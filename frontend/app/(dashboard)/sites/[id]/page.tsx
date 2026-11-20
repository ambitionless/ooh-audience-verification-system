"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Calendar,
  Upload,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Users,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { fetchApi } from "../../../lib/api";

function SiteDetailsView() {
  const params = useParams();
  const siteId = params?.id;
  const router = useRouter();

  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;

    fetchApi(`/sites/${siteId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Site not found");
        return res.json();
      })
      .then((data) => {
        setSite(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [siteId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading site details...
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Site Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">Unable to load billboard location details.</p>
        <Link
          href="/sites"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm"
        >
          <ArrowLeft size={16} /> Back to Sites
        </Link>
      </div>
    );
  }

  // Aggregate metrics across this site's videos
  const completedVideos = site.videos.filter((v: any) => v.job && v.job.status === "completed");
  const totalTracked = completedVideos.reduce((acc: number, v: any) => acc + (v.job?.total_tracked_ids || 0), 0);
  const totalExposures = completedVideos.reduce((acc: number, v: any) => acc + (v.job?.total_exposures || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back button */}
      <Link
        href="/sites"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft size={14} /> Back to Billboard Sites
      </Link>

      {/* Hero Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Site #{site.id}
          </div>
          <h1 className="text-3xl font-black text-white">{site.name}</h1>
          <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
            <MapPin size={15} className="text-slate-500" />
            <span>{site.location || "Location not specified"}</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Workspace: {site.organization_name} &bull; Registered: {site.created_at ? new Date(site.created_at).toLocaleDateString() : "Active"}
          </p>
        </div>

        <Link
          href={`/analysis/new?site_id=${site.id}`}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 text-sm self-start"
        >
          <Upload size={16} /> New Analysis on this Site
        </Link>
      </div>

      {/* Aggregate Metrics for this site */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Studies</span>
            <CheckCircle2 size={20} />
          </div>
          <p className="text-3xl font-black text-white">{site.videos.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">{completedVideos.length} completed verifications</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tracked Persons</span>
            <Users size={20} />
          </div>
          <p className="text-3xl font-black text-purple-300">{totalTracked}</p>
          <p className="text-[11px] text-slate-500 mt-1">Unique ByteTrack subjects across site</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Exposure Events</span>
            <Eye size={20} />
          </div>
          <p className="text-3xl font-black text-emerald-400">{totalExposures}</p>
          <p className="text-[11px] text-slate-500 mt-1">Physical viewing cone dwell verified</p>
        </div>
      </div>

      {/* Video & Analysis History */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Campaign & Video Analysis History</h2>
        <p className="text-xs text-slate-400 mb-6">
          All CV verification jobs executed for this specific billboard location.
        </p>

        {site.videos.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No video analyses have been conducted for this site yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Campaign / File</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Total Frames</th>
                  <th className="py-3 px-4 text-center">Tracked Persons</th>
                  <th className="py-3 px-4 text-center">Exposures</th>
                  <th className="py-3 px-4 text-center">Dwell Limit</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {site.videos.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{v.campaign_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{v.filename}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                        v.job?.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : v.job?.status === "processing"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {v.job?.status || "queued"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-slate-300">
                      {v.job?.total_frames || "-"}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-purple-300 font-mono">
                      {v.job?.total_tracked_ids || "-"}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-emerald-400 font-mono">
                      {v.job?.total_exposures || "-"}
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-mono text-slate-400">
                      &ge; {v.job?.dwell_threshold || 2.0}s
                    </td>
                    <td className="py-4 px-4 text-right">
                      {v.job?.status === "completed" ? (
                        <Link
                          href={`/results/${v.id}`}
                          className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        >
                          View Results <ArrowRight size={12} />
                        </Link>
                      ) : (
                        <Link
                          href="/jobs"
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Job Queue
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SiteDetailsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading site details...</div>}>
      <SiteDetailsView />
    </Suspense>
  );
}
