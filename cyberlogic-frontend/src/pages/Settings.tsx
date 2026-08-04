import { useState } from "react";
import { User as UserIcon, Lock, Bell, Palette, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSEO } from "../utils/useSEO";
import ProfileSettings from "../components/settings/ProfileSettings";
import SecuritySettings from "../components/settings/SecuritySettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import DangerZoneSettings from "../components/settings/DangerZoneSettings";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "profile" | "security" | "notifications" | "appearance" | "danger">("all");

  useSEO({
    title: "Account Settings",
    description: "Update your profile details, password, notification triggers, and portal UI appearance.",
  });

  const avatarSrc = user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.name || "User"}`;

  const tabs = [
    { id: "all", label: "All Settings", icon: CheckCircle2, color: "text-text-primary" },
    { id: "profile", label: "Profile & Socials", icon: UserIcon, color: "text-primary" },
    { id: "security", label: "Security & Passwords", icon: Lock, color: "text-accent" },
    { id: "notifications", label: "Notifications", icon: Bell, color: "text-emerald-400" },
    { id: "appearance", label: "Theme & Interface", icon: Palette, color: "text-amber-400" },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, color: "text-rose-400" },
  ];

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-16 text-left max-w-7xl mx-auto">
      {/* Radiant User Hero Profile Banner Header */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-border/80 relative overflow-hidden shadow-2xl bg-gradient-to-r from-surface-900 via-surface-900/90 to-surface-800/80">
        {/* Glow Accent Circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <img
                src={avatarSrc}
                alt={user?.name || "User"}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-surface-800 border-2 border-primary/40 shadow-xl group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-surface-950 border border-primary/40 flex items-center justify-center text-primary shadow-lg">
                <Shield className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight">
                  {user?.name || "Account Settings"}
                </h1>
                {user?.role && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-primary/20 border border-primary/40 text-primary">
                    {user.role}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap text-xs text-text-muted">
                {user?.username && (
                  <span className="font-mono text-accent">@{user.username}</span>
                )}
                {user?.email && (
                  <span>• {user.email}</span>
                )}
                {user?.school_id && (
                  <span className="px-2 py-0.5 rounded-md bg-surface-800 border border-border/60 text-text-secondary font-mono text-[11px]">
                    ID: {user.school_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass px-4 py-2.5 rounded-2xl border border-border/60 text-right hidden sm:block">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Account Standing</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Member
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection Filter Bar */}
        <div className="mt-8 pt-6 border-t border-border/50 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== "all") {
                    const el = document.getElementById(tab.id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                    : "bg-surface-800/80 hover:bg-surface-700 border border-border/60 text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form Panels Workspace */}
      <div className="space-y-8">
        {(activeTab === "all" || activeTab === "profile") && (
          <div id="profile" className="scroll-mt-24">
            <ProfileSettings />
          </div>
        )}

        {(activeTab === "all" || activeTab === "security") && (
          <div id="security" className="scroll-mt-24">
            <SecuritySettings />
          </div>
        )}

        {(activeTab === "all" || activeTab === "notifications") && (
          <div id="notifications" className="scroll-mt-24">
            <NotificationSettings />
          </div>
        )}

        {(activeTab === "all" || activeTab === "appearance") && (
          <div id="appearance" className="scroll-mt-24">
            <AppearanceSettings />
          </div>
        )}

        {(activeTab === "all" || activeTab === "danger") && (
          <div id="danger" className="scroll-mt-24">
            <DangerZoneSettings />
          </div>
        )}
      </div>
    </div>
  );
}
