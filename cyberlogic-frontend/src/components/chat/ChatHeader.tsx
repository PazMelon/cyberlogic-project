import { Menu, Hash, Users, Info } from "lucide-react";
import type { ChatChannel } from "./ChannelSidebar";

export interface ChatHeaderProps {
  activeChannelData?: ChatChannel;
  showMembers: boolean;
  setShowMembers: (show: boolean) => void;
  onOpenMobileMenu: () => void;
}

export default function ChatHeader({
  activeChannelData,
  showMembers,
  setShowMembers,
  onOpenMobileMenu,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-surface-900/30 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="sm:hidden p-2 -ml-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors mr-1 cursor-pointer"
          aria-label="Open channels list"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Hash className="w-5 h-5 text-text-muted flex-shrink-0" />
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {activeChannelData?.name || "Loading..."}
        </h3>
        <span className="hidden md:inline text-xs text-text-muted">—</span>
        <span className="hidden md:inline text-xs text-text-muted truncate">
          {activeChannelData?.description}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setShowMembers(!showMembers)}
          className={`p-2 rounded-lg transition-colors ${
            showMembers ? "text-primary bg-primary/10" : "text-text-muted hover:text-text-primary hover:bg-white/5"
          }`}
          aria-label="Toggle members"
        >
          <Users className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          aria-label="Channel info"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
