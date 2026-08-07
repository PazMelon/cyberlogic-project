import { useEffect, useState } from "react";
import { Wrench, Zap, Database, Rocket, ShieldAlert, Clock, ArrowRight, ShieldCheck, Terminal as TerminalIcon, Lock, Activity, Server, Cpu, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { fetchMaintenanceStatus } from "../utils/api";
import type { MaintenanceStatus } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Terminal from "../components/Terminal";
import { Badge } from "../components/ui";

export default function MaintenanceNotice() {
  const { user, isSuperAdmin } = useAuth();
  const [status, setStatus] = useState<MaintenanceStatus>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cl_maintenance_status");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return {
      maintenance_mode: true,
      maintenance_title: "System Maintenance & Upgrade",
      maintenance_reason: "We are currently performing scheduled system updates to improve performance, security, and platform stability.",
      maintenance_template: "scheduled_maintenance",
      maintenance_estimated_end: "",
    };
  });
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [sirenColor, setSirenColor] = useState<"red" | "blue">("red");

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await fetchMaintenanceStatus();
        if (data) {
          setStatus(data);
          localStorage.setItem("cl_maintenance_status", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Failed to fetch maintenance status:", err);
      }
    };
    loadStatus();
  }, []);

  // Alternating siren pulse timer (red <-> blue)
  useEffect(() => {
    const interval = setInterval(() => {
      setSirenColor((prev) => (prev === "red" ? "blue" : "red"));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer calculation
  useEffect(() => {
    if (!status.maintenance_estimated_end) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(status.maintenance_estimated_end).getTime();
    if (isNaN(targetDate)) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status.maintenance_estimated_end]);

  const getTemplateIcon = () => {
    switch (status.maintenance_template) {
      case "emergency_maintenance":
        return <Zap className="w-4 h-4 text-rose-400 animate-pulse" />;
      case "database_restoration":
        return <Database className="w-4 h-4 text-purple-400 animate-bounce" />;
      case "platform_upgrade":
        return <Rocket className="w-4 h-4 text-cyan-400 animate-float" />;
      case "scheduled_maintenance":
      default:
        return <Wrench className="w-4 h-4 text-amber-400" />;
    }
  };

  const getBadgeStyle = () => {
    switch (status.maintenance_template) {
      case "emergency_maintenance":
        return "bg-rose-500/10 border-rose-500/30 text-rose-300";
      case "database_restoration":
        return "bg-purple-500/10 border-purple-500/30 text-purple-300";
      case "platform_upgrade":
        return "bg-cyan-500/10 border-cyan-500/30 text-cyan-300";
      default:
        return "bg-amber-500/10 border-amber-500/30 text-amber-300";
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 text-text-primary flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      
      {/* Cyber Grid Canvas */}
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none z-0" />

      {/* ================= SUBTLE ATMOSPHERIC SIREN LIGHT EFFECT (RIGHT EDGE) ================= */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none z-0 overflow-hidden">
        {/* Pulsating Red & Blue Atmospheric Radial Glow pinned to Right Edge */}
        <div
          className="absolute inset-0 rounded-full blur-[130px] transition-all duration-1000 opacity-70"
          style={{
            background:
              sirenColor === "red"
                ? "radial-gradient(circle at right center, rgba(239, 68, 68, 0.22) 0%, rgba(6, 182, 212, 0.12) 50%, transparent 75%)"
                : "radial-gradient(circle at right center, rgba(6, 182, 212, 0.22) 0%, rgba(239, 68, 68, 0.12) 50%, transparent 75%)",
          }}
        />

        {/* Subtle Conic Beam Sweeping on Right Edge */}
        <div
          className="absolute -right-24 top-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[90px] animate-spin opacity-50 pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(239, 68, 68, 0.25) 0deg, transparent 80deg, rgba(6, 182, 212, 0.25) 180deg, transparent 260deg)",
            animationDuration: "5s",
            animationTimingFunction: "linear",
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute top-28 right-[12%] w-2.5 h-2.5 bg-primary rounded-full animate-float pointer-events-none z-0" />
      <div className="absolute top-44 left-[10%] w-2 h-2 bg-accent rounded-full animate-float delay-200 pointer-events-none z-0" />

      {/* ================= TOP NAVBAR HEADER ================= */}
      <header className="relative z-20 max-w-7xl w-full mx-auto flex items-center justify-between py-4 px-6 bg-surface-900/80 backdrop-blur-xl border border-border/80 rounded-2xl shadow-lg">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full animate-spin border border-transparent border-t-primary border-r-primary/40" style={{ animationDuration: "4s" }} />
            <img src="/icons.svg" alt="Cyberlogic" className="w-6 h-6 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
          </div>
          <span className="text-lg font-extrabold tracking-wider text-text-primary uppercase font-[family-name:var(--font-heading)]">
            Cyberlogic
          </span>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-3">
          <div className={`hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getBadgeStyle()}`}>
            {getTemplateIcon()}
            <span>Website Lockdown</span>
          </div>

          {user && isSuperAdmin ? (
            <Link
              to="/admin/database"
              className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-xs font-bold shadow-md hover:shadow-primary/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Super Admin Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-surface-800 hover:bg-surface-700 border border-border text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>Super Admin Login</span>
            </Link>
          )}
        </div>
      </header>

      {/* ================= MAIN SPLIT HERO SECTION ================= */}
      <main className="relative z-10 max-w-7xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* LEFT COLUMN: BIG BOLD HEADLINE, DESCRIPTION & COUNTDOWN */}
        <div className="lg:col-span-6 text-left space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Maintenance Protocol Active</span>
          </div>

          {/* Big Bold Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-[family-name:var(--font-heading)] leading-[1.1] tracking-tight text-text-primary">
            Website is <br />
            <span className="text-gradient">Under Maintenance</span>
          </h1>

          {/* Explanation Text */}
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl font-sans">
            {status.maintenance_reason}
          </p>

          {/* Action Button Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowTerminal(!showTerminal)}
              className="px-6 py-3 rounded-xl bg-surface-800 hover:bg-surface-700 border border-border text-text-primary text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <TerminalIcon className="w-4 h-4 text-primary" />
              <span>{showTerminal ? "Hide System Diagnostics" : "Inspect System Diagnostics CLI"}</span>
            </button>

            {user && isSuperAdmin && (
              <Link
                to="/admin/database"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-primary/25 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Super Admin Database Control</span>
              </Link>
            )}
          </div>

          {/* Digital Countdown Timer Cards */}
          {timeLeft && (
            <div className="bg-surface-900/80 backdrop-blur-xl border border-border/80 rounded-2xl p-5 space-y-3 shadow-lg max-w-md">
              <div className="flex items-center justify-between text-xs font-bold text-primary uppercase tracking-wider border-b border-border/60 pb-2">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-pulse" />
                  Estimated Completion Countdown
                </span>
                <span className="text-[10px] text-text-muted font-mono">UTC+8</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-950 border border-border rounded-xl p-3 text-center">
                  <span className="block text-2xl sm:text-3xl font-black text-text-primary font-mono">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Hours</span>
                </div>
                <div className="bg-surface-950 border border-border rounded-xl p-3 text-center">
                  <span className="block text-2xl sm:text-3xl font-black text-text-primary font-mono">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Mins</span>
                </div>
                <div className="bg-surface-950 border border-border rounded-xl p-3 text-center">
                  <span className="block text-2xl sm:text-3xl font-black text-primary font-mono">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Secs</span>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Terminal Drawer */}
          {showTerminal && (
            <div className="pt-2 animate-fadeIn max-w-xl">
              <Terminal />
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: UNCLIPPED VECTOR SVG CYBER WORKSTATION & RIGHT SIREN BEACON */}
        <div className="lg:col-span-6 relative flex items-center justify-center p-2">
          
          <div className="relative w-full max-w-xl aspect-square flex items-center justify-center overflow-visible">
            
            {/* PURE VECTOR SVG SCENE */}
            <svg viewBox="0 0 600 600" className="w-full h-full overflow-visible drop-shadow-[0_0_35px_rgba(6,182,212,0.3)]">
              <defs>
                <linearGradient id="monitorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--cl-bg-surface, #0f172a)" />
                  <stop offset="100%" stopColor="var(--cl-bg-surface-dark, #020617)" />
                </linearGradient>
                
                <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.18)" />
                  <stop offset="100%" stopColor="rgba(168, 85, 247, 0.1)" />
                </linearGradient>

                <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>

                <linearGradient id="beamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--cl-primary, #06b6d4)" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="var(--cl-primary, #06b6d4)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Floor Holographic Base Grid */}
              <ellipse cx="300" cy="480" rx="240" ry="50" fill="none" stroke="var(--cl-primary, #06b6d4)" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.4" />
              <ellipse cx="300" cy="480" rx="180" ry="38" fill="none" stroke="var(--cl-accent, #a855f7)" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" />

              {/* WORKSTATION MONITOR STAND */}
              <path d="M 280 410 L 320 410 L 330 465 L 270 465 Z" fill="url(#monitorGrad)" stroke="var(--cl-border, #334155)" strokeWidth="2" />
              <rect x="250" y="463" width="100" height="10" rx="5" fill="var(--cl-border, #334155)" />

              {/* WORKSTATION MONITOR FRAME */}
              <rect x="110" y="140" width="380" height="270" rx="18" fill="url(#monitorGrad)" stroke="var(--cl-border, #334155)" strokeWidth="3" />
              <rect x="124" y="154" width="352" height="242" rx="12" fill="url(#screenGrad)" stroke="var(--cl-primary, #06b6d4)" strokeWidth="1.5" strokeOpacity="0.5" />

              {/* MONITOR SCREEN CONTENT */}
              {/* Window Header */}
              <rect x="134" y="164" width="332" height="24" rx="4" fill="rgba(255, 255, 255, 0.06)" />
              <circle cx="148" cy="176" r="4" fill="#ef4444" />
              <circle cx="162" cy="176" r="4" fill="#f59e0b" />
              <circle cx="176" cy="176" r="4" fill="#10b981" />
              <rect x="195" y="171" width="120" height="10" rx="3" fill="rgba(255,255,255,0.12)" />

              {/* Code Line Blocks */}
              <rect x="144" y="202" width="140" height="9" rx="2" fill="var(--cl-primary, #06b6d4)" opacity="0.85" />
              <rect x="144" y="218" width="95" height="7" rx="2" fill="var(--cl-accent, #a855f7)" opacity="0.75" />
              <rect x="144" y="232" width="160" height="7" rx="2" fill="rgba(255,255,255,0.35)" />
              <rect x="144" y="246" width="110" height="7" rx="2" fill="rgba(255,255,255,0.35)" />

              {/* Data Dashboard Panels on Screen */}
              <rect x="320" y="202" width="135" height="75" rx="6" fill="rgba(15, 23, 42, 0.7)" stroke="var(--cl-primary, #06b6d4)" strokeWidth="1" strokeOpacity="0.6" />
              <circle cx="350" cy="240" r="18" fill="none" stroke="var(--cl-primary, #06b6d4)" strokeWidth="4" strokeDasharray="80 30" />
              <rect x="378" y="220" width="55" height="6" rx="2" fill="var(--cl-primary, #06b6d4)" />
              <rect x="378" y="233" width="45" height="6" rx="2" fill="var(--cl-accent, #a855f7)" />
              <rect x="378" y="246" width="50" height="6" rx="2" fill="#10b981" />

              {/* Terminal Output Box on Screen Bottom */}
              <rect x="144" y="290" width="312" height="95" rx="8" fill="rgba(2, 6, 23, 0.85)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <text x="156" y="310" fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="bold">&gt; LOCKDOWN_PROTOCOL: ENGAGED</text>
              <text x="156" y="328" fill="var(--cl-primary, #06b6d4)" fontSize="10" fontFamily="monospace">&gt; Siren Beacon: Pulsing Red &amp; Blue (Right Edge)</text>
              <text x="156" y="346" fill="#f59e0b" fontSize="10" fontFamily="monospace">&gt; System Status: 100% Secure &amp; Encrypted</text>
              <text x="156" y="364" fill="var(--cl-accent, #a855f7)" fontSize="10" fontFamily="monospace">&gt; Awaiting SuperAdmin Override Signal_</text>

              {/* SCREEN VERTICAL SCANNING BEAM */}
              <rect x="124" y="154" width="352" height="35" fill="url(#beamGrad)" className="animate-pulse" />

              {/* CONTINUOUS ROTATING VECTOR GEARS */}
              <g transform="translate(510, 130)">
                <g className="animate-spin" style={{ animationDuration: "8s", transformOrigin: "center" }}>
                  <circle cx="0" cy="0" r="28" fill="none" stroke="var(--cl-primary, #06b6d4)" strokeWidth="3.5" strokeDasharray="10 5" />
                  <circle cx="0" cy="0" r="14" fill="none" stroke="var(--cl-accent, #a855f7)" strokeWidth="2.5" />
                </g>
              </g>

              <g transform="translate(80, 220)">
                <g className="animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse", transformOrigin: "center" }}>
                  <circle cx="0" cy="0" r="22" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 4" />
                  <circle cx="0" cy="0" r="10" fill="none" stroke="var(--cl-primary, #06b6d4)" strokeWidth="2" />
                </g>
              </g>

              {/* PULSATING SIREN LIGHT DOME ON MONITOR TOP (RED & BLUE ALTERNATING) */}
              <g transform="translate(300, 115)">
                <rect x="-18" y="15" width="36" height="10" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <path
                  d="M -14 15 C -14 0, 14 0, 14 15 Z"
                  fill={sirenColor === "red" ? "#ef4444" : "#06b6d4"}
                  className="transition-colors duration-700"
                />
                <circle
                  cx="0"
                  cy="8"
                  r="14"
                  fill={sirenColor === "red" ? "#ef4444" : "#06b6d4"}
                  opacity="0.6"
                  className="animate-ping"
                />
              </g>

              {/* VECTOR HAZARD BARRICADE (Left Foreground) */}
              <g transform="translate(40, 395)">
                <rect x="20" y="25" width="10" height="60" fill="#334155" rx="2" />
                <rect x="120" y="25" width="10" height="60" fill="#334155" rx="2" />
                <rect x="5" y="80" width="35" height="8" fill="#1e293b" rx="3" />
                <rect x="110" y="80" width="35" height="8" fill="#1e293b" rx="3" />

                <rect x="0" y="32" width="150" height="26" rx="4" fill="#ea580c" stroke="#f97316" strokeWidth="1.5" />
                <path
                  d="M 18 32 L 36 32 L 18 58 Z M 54 32 L 72 32 L 45 58 L 27 58 Z M 90 32 L 108 32 L 81 58 L 63 58 Z M 126 32 L 144 32 L 117 58 L 99 58 Z"
                  fill="#ffffff"
                  opacity="0.9"
                />
                
                {/* Flashing Red/Blue Warning Lights on Barricade */}
                <circle cx="25" cy="20" r="7" fill="#ef4444" className="animate-pulse" />
                <circle cx="125" cy="20" r="7" fill="#06b6d4" className="animate-pulse" />
              </g>

              {/* VECTOR NEON HAZARD CONES */}
              <g transform="translate(430, 400)">
                <path d="M 30 0 L 52 60 L 8 60 Z" fill="url(#coneGrad)" />
                <ellipse cx="30" cy="60" rx="24" ry="7" fill="#c2410c" />
                <rect x="2" y="58" width="56" height="7" rx="3" fill="#ea580c" />
                <path d="M 24 22 L 36 22 L 40 34 L 20 34 Z" fill="#ffffff" opacity="0.9" />
                <path d="M 18 42 L 42 42 L 46 52 L 14 52 Z" fill="#ffffff" opacity="0.9" />
                <circle cx="30" cy="0" r="5" fill="#ef4444" className="animate-ping" />
              </g>

              <g transform="translate(340, 435)">
                <path d="M 18 0 L 32 40 L 4 40 Z" fill="url(#coneGrad)" />
                <rect x="0" y="38" width="36" height="5" rx="2" fill="#ea580c" />
                <path d="M 14 14 L 22 14 L 25 24 L 11 24 Z" fill="#ffffff" opacity="0.9" />
                <circle cx="18" cy="0" r="4" fill="#06b6d4" className="animate-pulse" />
              </g>

            </svg>

          </div>

        </div>

      </main>

      {/* ================= FOOTER BAR ================= */}
      <footer className="relative z-20 max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted pt-4 border-t border-border/60">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Cyberlogic Club • St. Rita's College of Balingasag</span>
        </div>
        <span>© {new Date().getFullYear()} Cyberlogic. All database records &amp; assets secured.</span>
      </footer>

    </div>
  );
}
