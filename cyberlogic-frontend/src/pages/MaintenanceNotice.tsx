import { useEffect, useState } from "react";
import { Wrench, Zap, Database, Rocket, ShieldAlert, Clock, ArrowRight, ShieldCheck, Terminal as TerminalIcon } from "lucide-react";
import { Link } from "react-router";
import { fetchMaintenanceStatus } from "../utils/api";
import type { MaintenanceStatus } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Terminal from "../components/Terminal";
import { Badge } from "../components/ui";

export default function MaintenanceNotice() {
  const { user, isSuperAdmin } = useAuth();
  const [status, setStatus] = useState<MaintenanceStatus>({
    maintenance_mode: true,
    maintenance_title: "Scheduled System Maintenance",
    maintenance_reason: "We are currently performing scheduled system updates to improve performance, security, and platform stability.",
    maintenance_template: "scheduled_maintenance",
    maintenance_estimated_end: "",
  });
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await fetchMaintenanceStatus();
        if (data) setStatus(data);
      } catch (err) {
        console.error("Failed to fetch maintenance status:", err);
      }
    };
    loadStatus();
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
        return <Zap className="w-10 h-10 text-rose-400 animate-pulse" />;
      case "database_restoration":
        return <Database className="w-10 h-10 text-purple-400 animate-bounce" />;
      case "platform_upgrade":
        return <Rocket className="w-10 h-10 text-cyan-400 animate-float" />;
      case "scheduled_maintenance":
      default:
        return <Wrench className="w-10 h-10 text-amber-400" />;
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
    <div className="relative min-h-screen bg-surface-950 text-text-primary flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-pulse-glow delay-500 pointer-events-none" />

      {/* Floating Decorative Particles */}
      <div className="absolute top-24 right-[18%] w-2 h-2 bg-primary rounded-full animate-float pointer-events-none" />
      <div className="absolute top-44 left-[15%] w-1.5 h-1.5 bg-accent rounded-full animate-float delay-200 pointer-events-none" />
      <div className="absolute bottom-32 right-[22%] w-2.5 h-2.5 bg-primary-light rounded-full animate-float delay-300 pointer-events-none" />

      <div className="relative z-10 max-w-3xl w-full bg-surface-900/90 backdrop-blur-2xl border border-border/80 rounded-3xl p-6 sm:p-12 shadow-2xl space-y-8 text-center">
        
        {/* Logo Container with Cyberlogic Orbital Rings */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Primary Orbital Ring */}
            <div className="absolute inset-0 rounded-full animate-spin border-2 border-transparent border-t-primary border-r-primary/30 filter drop-shadow-[0_0_8px_var(--color-primary-glow)]" style={{ animationDuration: '3s' }} />
            {/* Secondary Orbital Ring */}
            <div className="absolute inset-[-10px] rounded-full animate-spin border border-transparent border-b-accent/60 border-l-accent/20" style={{ animationDuration: '5s', animationDirection: 'reverse' }} />
            
            {/* Club Mascot Logo with Breathing Animation */}
            <img
              src="/icons.svg"
              alt="Cyberlogic"
              className="w-20 h-20 drop-shadow-[0_0_24px_rgba(6,182,212,0.6)] animate-breathe"
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="primary"
              size="sm"
              uppercase={false}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase ${getBadgeStyle()}`}
            >
              {getTemplateIcon()}
              <span>Website Lockdown Active</span>
            </Badge>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-[family-name:var(--font-heading)] leading-tight tracking-tight text-text-primary">
            <span className="text-gradient">{status.maintenance_title || "System Maintenance"}</span>
          </h1>
          <p className="text-text-secondary leading-relaxed text-sm sm:text-base max-w-2xl mx-auto font-sans">
            {status.maintenance_reason}
          </p>
        </div>

        {/* Dynamic Return Countdown Timer */}
        {timeLeft && (
          <div className="bg-surface-950/80 border border-border/80 rounded-2xl p-6 space-y-3 shadow-inner">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-primary font-bold">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Estimated Return Countdown</span>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm mx-auto">
              <div className="bg-surface-900 border border-border rounded-xl p-3 sm:p-4 text-center shadow-md">
                <span className="block text-2xl sm:text-3xl font-black text-text-primary font-mono">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Hours</span>
              </div>
              <div className="bg-surface-900 border border-border rounded-xl p-3 sm:p-4 text-center shadow-md">
                <span className="block text-2xl sm:text-3xl font-black text-text-primary font-mono">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Mins</span>
              </div>
              <div className="bg-surface-900 border border-border rounded-xl p-3 sm:p-4 text-center shadow-md">
                <span className="block text-2xl sm:text-3xl font-black text-primary font-mono">{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Secs</span>
              </div>
            </div>
          </div>
        )}

        {/* Optional Terminal CLI View Toggle */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowTerminal(!showTerminal)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 border border-border text-xs font-semibold text-text-secondary hover:text-text-primary rounded-xl transition-all cursor-pointer"
          >
            <TerminalIcon className="w-4 h-4 text-primary" />
            <span>{showTerminal ? "Hide System Diagnostics Log" : "Inspect System Diagnostics CLI"}</span>
          </button>

          {showTerminal && (
            <div className="animate-fadeIn">
              <Terminal />
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300 text-left">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="leading-relaxed">
            Public and member portal access are temporarily paused while engineering carries out system maintenance. All active databases and user state remain safe and encrypted.
          </span>
        </div>

        {/* Super Admin Login Bar */}
        <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Super Admin Override Token Required
          </span>

          {user && isSuperAdmin ? (
            <Link
              to="/admin/database"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5"
            >
              <span>Enter Super Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold text-xs"
            >
              <span>Super Admin Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
