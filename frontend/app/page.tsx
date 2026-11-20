import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Video, Building2, Layers, CheckCircle2, Lock, Clock, Eye } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="px-8 lg:px-16 py-6 flex items-center justify-between border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-lg tracking-wider text-white shadow-lg shadow-blue-500/20">
            O
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            OOH VERIFY
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
          <a href="#methodology" className="hover:text-white transition-colors">Methodology</a>
          <a href="#audience" className="hover:text-white transition-colors">Who It's For</a>
          <a href="#privacy" className="hover:text-white transition-colors">Responsible AI</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/analysis/new"
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
          >
            Start Analysis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-8 lg:px-16 pt-24 pb-32 overflow-hidden text-center">
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-[800px] h-[400px] bg-gradient-to-r from-blue-600 to-indigo-600 blur-[140px] rounded-full"></div>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <ShieldCheck size={14} /> Objective Computer Vision Verification
        </div>
        <h1 className="text-5xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto mb-8 leading-[1.1]">
          Turn OOH Video Into <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200">Measurable Audience Exposure.</span>
        </h1>
        <p className="text-lg lg:text-xl text-slate-400 mb-12 max-w-3xl mx-auto font-normal leading-relaxed">
          Traditional Out-of-Home measurement relies on generic traffic proxies. We provide rigorous computer vision analysis: isolating pedestrians via YOLOv8, tracking them with ByteTrack, and calculating viewing-zone dwell time to verify authentic exposure events.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/analysis/new"
            className="w-full sm:w-auto text-base font-bold bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
          >
            Start Analysis <ArrowRight size={18} />
          </Link>
          <a
            href="#pipeline"
            className="w-full sm:w-auto text-base font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-8 py-4 rounded-xl transition-all"
          >
            Explore Pipeline
          </a>
        </div>
      </section>

      {/* The Definition & Core Value */}
      <section id="methodology" className="py-16 px-8 lg:px-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
            Core Measurement Principle
          </span>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
            “Person enters configured viewing zone and remains for at least the configured dwell threshold = measurable exposure event.”
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Zero speculation. Auditable proof stored in PostgreSQL with individual track IDs and entry timestamps.
          </p>
        </div>
      </section>

      {/* 6-Step Pipeline */}
      <section id="pipeline" className="py-24 px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">Complete Verification Pipeline</h2>
            <p className="text-slate-400 text-base">
              A transparent 6-stage computer vision workflow from raw camera footage to auditable exposure reports.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <div className="text-blue-400 font-mono text-xs font-bold mb-3">STAGE 01 &bull; INGESTION</div>
              <h4 className="font-bold text-base mb-2 text-white">Upload OOH Video</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingest MP4 video feeds captured from camera angles facing the billboard or digital display location.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <div className="text-blue-400 font-mono text-xs font-bold mb-3">STAGE 02 &bull; DETECTION</div>
              <h4 className="font-bold text-base mb-2 text-white">YOLOv8 Detection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ultralytics YOLOv8 isolates individual pedestrians (COCO Class 0) frame-by-frame with bounding box coordinates.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <div className="text-blue-400 font-mono text-xs font-bold mb-3">STAGE 03 &bull; TRACKING</div>
              <h4 className="font-bold text-base mb-2 text-white">ByteTrack MOT</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assigns persistent numerical tracking IDs across video frames, eliminating double-counting of walking individuals.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <div className="text-blue-400 font-mono text-xs font-bold mb-3">STAGE 04 &bull; VIEWING ZONE</div>
              <h4 className="font-bold text-base mb-2 text-white">ROI Dwell Measurement</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluates whether tracked individuals intersect the calibrated billboard Opportunity-to-See polygon.
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <div className="text-blue-400 font-mono text-xs font-bold mb-3">STAGE 05 &bull; EXPOSURE</div>
              <h4 className="font-bold text-base mb-2 text-white">Exposure Calculation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Certifies an exposure event once an individual’s dwell duration equals or exceeds the configured dwell threshold (e.g. &ge; 2.0s).
              </p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <div className="text-blue-400 font-mono text-xs font-bold mb-3">STAGE 06 &bull; INTELLIGENCE</div>
              <h4 className="font-bold text-base mb-2 text-white">Analyze & Report</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Persists structured events to PostgreSQL and generates auditable analytics and exportable compliance certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience: Advertisers, Agencies, Media Owners */}
      <section id="audience" className="py-24 px-8 lg:px-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">Built for the OOH Advertising Ecosystem</h2>
            <p className="text-slate-400 text-base">
              Providing objective measurement transparency across all campaign stakeholders.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <Building2 className="text-blue-400 mb-4" size={28} />
              <h3 className="text-lg font-bold mb-2 text-white">Advertisers & Brands</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Verify actual campaign delivery. Gain auditable proof that your billboard inventory achieved genuine audience exposure rather than relying on unverified estimates.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <Layers className="text-blue-400 mb-4" size={28} />
              <h3 className="text-lg font-bold mb-2 text-white">Media Agencies</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Deliver verifiable proof-of-performance to clients. Compare footfall dwell duration and physical reach across prime urban billboard placements.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <Video className="text-blue-400 mb-4" size={28} />
              <h3 className="text-lg font-bold mb-2 text-white">Media Owners & Operators</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Demonstrate the premium value of digital and static locations with objective computer vision metrics and certified dwell duration data.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            * Note: Brand names (e.g. Coca-Cola, Nike, Samsung) referenced in sample data are illustrative test fixtures only and do not represent brand endorsements.
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section id="privacy" className="py-24 px-8 lg:px-16">
        <div className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 p-8 lg:p-12 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 text-blue-400">
            <Lock size={24} />
            <h3 className="text-2xl font-bold text-white">Responsible Measurement & Zero PII</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Our technology evaluates physical opportunity-to-see by measuring polygon presence and dwell duration.
            <strong className="text-white block mt-2">
              We do not measure identity, demographics, eye contact, visual attention, or facial recognition.
            </strong>
          </p>
          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="font-bold text-white block mb-0.5">Zero Facial Recognition</span>
              <span className="text-slate-400">No facial crops or biometrics are ever computed or stored.</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="font-bold text-white block mb-0.5">Anonymous Numerical IDs</span>
              <span className="text-slate-400">ByteTrack track IDs exist only as transient integer counters.</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="font-bold text-white block mb-0.5">Auditable PostgreSQL Logs</span>
              <span className="text-slate-400">Permanent data records contain only timestamps and dwell durations.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 lg:px-16 py-12 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <span className="font-bold text-slate-300">OOH Verify</span> &copy; 2026. All rights reserved.
        </div>
        <div className="flex gap-6 text-xs">
          <Link href="/analysis/new" className="hover:text-slate-300 transition-colors">Start Analysis</Link>
          <a href="#pipeline" className="hover:text-slate-300 transition-colors">Pipeline</a>
          <a href="#methodology" className="hover:text-slate-300 transition-colors">Methodology</a>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">Build 6 Release</span>
        </div>
      </footer>
    </div>
  );
}
