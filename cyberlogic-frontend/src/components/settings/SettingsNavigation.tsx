import { User, Lock, Bell, Palette, AlertTriangle } from "lucide-react";

export default function SettingsNavigation() {
  return (
    <div className="space-y-1">
      <a
        href="#profile"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-primary transition-all"
      >
        <User className="w-4 h-4 text-primary" /> Profile Details
      </a>
      <a
        href="#security"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-accent transition-all"
      >
        <Lock className="w-4 h-4 text-accent" /> Security Credentials
      </a>
      <a
        href="#notifications"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-success transition-all"
      >
        <Bell className="w-4 h-4 text-success" /> Notifications
      </a>
      <a
        href="#appearance"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-warning transition-all"
      >
        <Palette className="w-4 h-4 text-warning" /> Theme & Appearance
      </a>
      <a
        href="#danger"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-error transition-all"
      >
        <AlertTriangle className="w-4 h-4 text-error" /> Danger Zone
      </a>
    </div>
  );
}
