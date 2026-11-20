"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Upload,
  Activity,
  BarChart3,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { getToken, getStoredUser, clearSession, fetchApi, User } from "../lib/api";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Sites & Campaigns", href: "/sites", icon: Building2 },
  { label: "New Analysis", href: "/analysis/new", icon: Upload },
  { label: "Processing Jobs", href: "/jobs", icon: Activity },
  { label: "Audience Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings & Profile", href: "/settings", icon: Settings },
];

function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3 font-medium text-slate-400 text-sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isActive
                ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                : "hover:bg-slate-800/70 hover:text-white"
            }`}
          >
            <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

const DEFAULT_USER: User = {
  id: 1,
  email: "analyst@oohverify.internal",
  organization_id: 1,
  organization_name: "OmniMedia Global",
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [dbStatus, setDbStatus] = useState<"connected" | "checking" | "offline">("connected");

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();

    if (stored) {
      setUser(stored);
    }

    if (token) {
      // If token exists, optionally sync updated user details from backend
      fetchApi("/auth/me")
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data: User | null) => {
          if (data) {
            setUser(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    router.replace("/");
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 pb-4 border-b border-slate-800/80">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30">
                O
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight block text-white">OOH VERIFY</span>
                <span className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold block">Audience Verification</span>
              </div>
            </Link>
          </div>

          {/* Org & Workspace badge */}
          <div className="px-5 py-3 mx-3 my-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs">
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Workspace Context</p>
            <p className="font-semibold text-slate-200 truncate">{user?.organization_name || "Enterprise Workspace"}</p>
          </div>

          {/* Navigation with Suspense */}
          <Suspense fallback={<div className="px-3 py-2 text-xs text-slate-500">Loading menu...</div>}>
            <NavLinks />
          </Suspense>
        </div>

        {/* Footer with user info & logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className={`h-2 w-2 rounded-full ${dbStatus === "connected" ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-[11px]">PostgreSQL Active</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 font-bold shrink-0 text-xs">
                {user?.email ? user.email[0].toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-500 truncate">Analyst</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-8 lg:p-10 overflow-y-auto bg-slate-950">
        <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading content...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Loading...</div>}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}
