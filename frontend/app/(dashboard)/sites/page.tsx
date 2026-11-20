"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Video,
  Eye,
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Upload,
  Calendar
} from "lucide-react";
import { fetchApi } from "../../lib/api";

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSites = () => {
    setLoading(true);
    fetchApi("/sites/")
      .then((res) => res.json())
      .then((data) => {
        setSites(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const res = await fetchApi("/sites/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), location: location.trim() }),
      });

      if (!res.ok) throw new Error("Failed to create site");

      setName("");
      setLocation("");
      setShowCreateModal(false);
      loadSites();
    } catch (err: any) {
      alert(err.message || "Could not create site.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Billboard Sites & Locations</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your physical OOH signage assets, viewing zones, and historical verification studies.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 text-sm self-start"
        >
          <Plus size={16} /> Add New Site
        </button>
      </div>

      {/* Modal for creating a new site */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Register Billboard Site</h3>
            <p className="text-xs text-slate-400 mb-6">
              Add a new physical display or digital billboard location to your workspace.
            </p>
            <form onSubmit={handleCreateSite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Piccadilly Circus South Screen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Geographic Location / Address
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. London, W1D 7DH, United Kingdom"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-600"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-blue-600/30"
                >
                  {creating ? "Creating..." : "Save Site"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sites Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading sites...
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Building2 size={36} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Sites Registered</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Get started by registering your first physical billboard or screen asset location.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            Create First Site
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                    <Building2 size={20} />
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                    Site ID: #{site.id}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {site.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-6">
                  <MapPin size={13} className="text-slate-500 shrink-0" />
                  <span className="truncate">{site.location || "Location not specified"}</span>
                </p>

                {/* Metrics pill */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/60 mb-6 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Videos & Jobs</span>
                    <span className="font-mono font-bold text-slate-200 text-sm">
                      {site.video_count || 0} analyses
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Exposures</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {site.latest_result?.measurable_exposures || 0} events
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80">
                <Link
                  href={`/sites/${site.id}`}
                  className="flex-1 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg text-center transition-colors"
                >
                  Site Details & History
                </Link>
                <Link
                  href={`/analysis/new?site_id=${site.id}`}
                  title="Run New Analysis on this site"
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors shrink-0"
                >
                  <Upload size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
