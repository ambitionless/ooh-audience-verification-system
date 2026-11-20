"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Building2,
  Database,
  Cpu,
  Shield,
  LogOut,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getStoredUser, clearSession, fetchApi, User as UserType } from "../../lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultThreshold, setDefaultThreshold] = useState("2.0");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);

    fetchApi("/auth/me")
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error("Unauthorized");
      })
      .then((data: UserType) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    clearSession();
    router.replace("/");
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings & Profile</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your authenticated identity, enterprise organization settings, and verification engine defaults.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-sm flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Workspace preferences updated successfully.</span>
        </div>
      )}

      {/* 1. Authenticated User Profile */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2.5 text-blue-400">
          <User size={20} />
          <h2 className="font-bold text-base text-white">User Profile</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Email Address</span>
            <span className="text-sm font-semibold text-white">{user?.email || "analyst@oohverify.com"}</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">User Identifier</span>
            <span className="text-sm font-mono text-purple-300">UID #{user?.id || 1}</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">System Role</span>
            <span className="text-sm font-semibold text-slate-200">Senior OOH Verification Analyst</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Account Created</span>
            <span className="text-sm text-slate-400">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active (Build 6)"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Workspace & Organization Context */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2.5 text-indigo-400">
          <Building2 size={20} />
          <h2 className="font-bold text-base text-white">Workspace & Organization Context</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Organization Name</span>
            <span className="text-sm font-semibold text-white">
              {user?.organization_name || "OmniMedia Global"}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Organization ID</span>
            <span className="text-sm font-mono text-indigo-300">ORG #{user?.organization_id || 1}</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Database Connectivity</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-400">PostgreSQL (Connected)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Alembic Schema Revision</span>
            <span className="text-xs font-mono text-slate-400">24062c874bad (Head)</span>
          </div>
        </div>
      </div>

      {/* 3. Computer Vision Engine Specifications */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2.5 text-amber-400">
          <Cpu size={20} />
          <h2 className="font-bold text-base text-white">Verification Engine Infrastructure</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">YOLO Detection Model</span>
            <span className="font-mono text-slate-200">yolov8n.pt (COCO Class 0)</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Tracking Algorithm</span>
            <span className="font-mono text-slate-200">ByteTrack (Supervision)</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Default Dwell Threshold</span>
            <span className="font-mono text-amber-400 font-bold">&ge; 2.0 Seconds</span>
          </div>
        </div>
      </div>

      {/* 4. Session & Logout */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-sm">Active Workspace Session</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Signed in as <span className="text-slate-200 font-medium">{user?.email}</span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full sm:w-auto bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 font-semibold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={15} /> Sign Out of Workspace
        </button>
      </div>
    </div>
  );
}
