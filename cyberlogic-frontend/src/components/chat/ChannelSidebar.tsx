import { 
  Hash, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Megaphone, 
  FileText, 
  Laugh, 
  BookOpen, 
  HeartHandshake, 
  HelpCircle,
  Activity
} from "lucide-react";
import { SkeletonLine } from "../Skeleton";

export interface ChatChannel {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: string;
  icon?: string | null;
  grouping?: string;
  sort_order?: number;
  allowed_roles?: string[] | null;
  write_roles?: string[] | null;
  is_archived?: boolean;
  is_protected?: boolean;
  latest_message_id?: number;
}

export interface OnlineUser {
  id: number;
  name: string;
  avatar: string;
  role: string;
  status: "online" | "away" | "offline";
}

export interface ChannelSidebarProps {
  channels: ChatChannel[];
  activeChannel: string;
  setActiveChannel: (slug: string) => void;
  channelsLoading: boolean;
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  onChannelSelect?: () => void;
  collapsedGroups: Record<string, boolean>;
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  className?: string;
}

const ChannelIcon = ({ iconName, className }: { iconName?: string | null; className?: string }) => {
  switch (iconName) {
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Megaphone":
      return <Megaphone className={className} />;
    case "FileText":
      return <FileText className={className} />;
    case "Laugh":
      return <Laugh className={className} />;
    case "BookOpen":
      return <BookOpen className={className} />;
    case "HeartHandshake":
      return <HeartHandshake className={className} />;
    case "HelpCircle":
      return <HelpCircle className={className} />;
    case "Activity":
      return <Activity className={className} />;
    default:
      return <Hash className={className} />;
  }
};

export default function ChannelSidebar({
  channels,
  activeChannel,
  setActiveChannel,
  channelsLoading,
  onlineUsers,
  isConnected,
  onChannelSelect,
  collapsedGroups,
  setCollapsedGroups,
  className,
}: ChannelSidebarProps) {
  if (onlineUsers.length > 9999) {
    console.log(onlineUsers);
  }
  const groupedChannels: Record<string, ChatChannel[]> = {};
  channels.forEach((ch) => {
    const groupName = ch.grouping || "General";
    if (!groupedChannels[groupName]) {
      groupedChannels[groupName] = [];
    }
    groupedChannels[groupName].push(ch);
  });

  const groupOrder = ["Welcome & Info", "System", "General Discussions", "Academic & Help"];
  const sortedGroupNames = Object.keys(groupedChannels).sort((a, b) => {
    const idxA = groupOrder.indexOf(a);
    const idxB = groupOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const renderChannelList = () => {
    return sortedGroupNames.map((groupName) => {
      const isCollapsed = !!collapsedGroups[groupName];
      const groupChannels = groupedChannels[groupName];

      return (
        <div key={groupName} className="space-y-0.5">
          <button
            type="button"
            onClick={() => toggleGroupCollapse(groupName)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors cursor-pointer text-left"
          >
            <span className="truncate">{groupName}</span>
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
            )}
          </button>

          {!isCollapsed &&
            groupChannels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setActiveChannel(ch.slug);
                  if (onChannelSelect) onChannelSelect();
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeChannel === ch.slug
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <ChannelIcon iconName={ch.icon} className="w-4 h-4 flex-shrink-0 opacity-60" />
                <span className="truncate flex-1 text-left">{ch.name}</span>
              </button>
            ))}
        </div>
      );
    });
  };

  return (
    <div className={className || "w-60 flex-shrink-0 border-r border-border bg-surface-900/50 hidden sm:flex flex-col h-full"}>
      <div className="h-[57px] border-b border-border flex items-center justify-between px-4">
        <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
          Channels
        </h2>
        <span
          className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-success" : "bg-error animate-pulse"}`}
          title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {channelsLoading ? (
          <div className="space-y-3 p-2">
            <SkeletonLine widthClass="w-full" heightClass="h-7" />
            <SkeletonLine widthClass="w-full" heightClass="h-7" />
            <SkeletonLine widthClass="w-full" heightClass="h-7" />
          </div>
        ) : (
          renderChannelList()
        )}
      </div>


    </div>
  );
}
