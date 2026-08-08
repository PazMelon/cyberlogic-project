import React from "react";

interface ProviderBadgeProps {
  provider?: string;
}

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({ provider }) => {
  switch (provider) {
    case "google_drive":
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
          📁 Google Drive
        </span>
      );
    case "dropbox":
      return (
        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 flex items-center gap-1">
          📦 Dropbox
        </span>
      );
    case "onedrive":
      return (
        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold border border-sky-500/20 flex items-center gap-1">
          ☁️ OneDrive
        </span>
      );
    case "figma":
      return (
        <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-bold border border-pink-500/20 flex items-center gap-1">
          🎨 Figma
        </span>
      );
    case "github":
      return (
        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20 flex items-center gap-1">
          🐙 GitHub
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 flex items-center gap-1">
          🔗 Web Link
        </span>
      );
  }
};

export default ProviderBadge;
