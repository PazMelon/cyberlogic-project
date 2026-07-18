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
  Activity,
  MessageSquare,
  Shield,
  Code,
  Flame,
  Trophy,
  Users,
  Bot,
  Plus,
  UserPlus
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
  members?: any[];
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
  unreadStatus?: Record<string, boolean>;
  onStartDmClick?: () => void;
  onStartGroupClick?: () => void;
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
    case "MessageSquare":
      return <MessageSquare className={className} />;
    case "Shield":
      return <Shield className={className} />;
    case "Code":
      return <Code className={className} />;
    case "Flame":
      return <Flame className={className} />;
    case "Trophy":
      return <Trophy className={className} />;
    case "Users":
      return <Users className={className} />;
    case "Bot":
      return <Bot className={className} />;
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
  unreadStatus = {},
  onStartDmClick,
  onStartGroupClick,
}: ChannelSidebarProps) {
  if (onlineUsers.length > 9999) {
    console.log(onlineUsers);
  }

  const groupedChannels: Record<string, ChatChannel[]> = {};
  groupedChannels["Messages"] = [];

  channels.forEach((ch) => {
    let groupName = ch.grouping || "General Discussions";
    // Group both DM and Private Groups under "Messages"
    if (groupName === "Direct Messages" || groupName === "Group Chats") {
      groupName = "Messages";
    }
    if (!groupedChannels[groupName]) {
      groupedChannels[groupName] = [];
    }
    groupedChannels[groupName].push(ch);
  });

  const groupOrder = ["Welcome & Info", "System", "General Discussions", "Academic & Help", "Messages"];
  const sortedGroupNames = Object.keys(groupedChannels).sort((a, b) => {
    if (a === "Messages") return 1;
    if (b === "Messages") return -1;
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
      const groupChannels = [...groupedChannels[groupName]].sort((a, b) => {
        if (groupName === "Messages") {
          const timeA = a.latest_message_id || 0;
          const timeB = b.latest_message_id || 0;
          return timeB - timeA;
        }
        const orderA = a.sort_order !== undefined && a.sort_order !== null ? a.sort_order : 9999;
        const orderB = b.sort_order !== undefined && b.sort_order !== null ? b.sort_order : 9999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.name.localeCompare(b.name);
      });
      const isMessagesHeader = groupName === "Messages";

      return (
        <div key={groupName} className="space-y-0.5">
          <div
            onClick={() => toggleGroupCollapse(groupName)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors cursor-pointer text-left select-none"
          >
            <span className="truncate flex-1">{groupName}</span>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {isMessagesHeader && (
                <>
                  <button
                    type="button"
                    onClick={() => onStartDmClick && onStartDmClick()}
                    className="p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer"
                    title="Start DM"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartGroupClick && onStartGroupClick()}
                    className="p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer"
                    title="Create Group Chat"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {isCollapsed ? (
                <button type="button" onClick={() => toggleGroupCollapse(groupName)} className="cursor-pointer">
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              ) : (
                <button type="button" onClick={() => toggleGroupCollapse(groupName)} className="cursor-pointer">
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              )}
            </div>
          </div>

          {!isCollapsed &&
            (groupChannels.length === 0 ? (
              <div className="px-3 py-1.5 text-xs text-text-muted italic select-none">
                No active conversations.
              </div>
            ) : (
              groupChannels.map((ch) => {
                const isUnread = !!unreadStatus[ch.slug];

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setActiveChannel(ch.slug);
                      if (onChannelSelect) onChannelSelect();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      activeChannel === ch.slug
                        ? "bg-primary/10 text-primary font-semibold"
                        : isUnread
                        ? "text-text-primary font-semibold bg-white/5"
                        : "text-text-muted hover:text-text-primary hover:bg-white/5"
                    }`}
                  >
                    {ch.type === "dm" || ch.grouping === "Direct Messages" ? (
                      ch.icon && ch.icon.startsWith("http") ? (
                        <img src={ch.icon} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <img 
                          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${ch.name}`} 
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0" 
                        />
                      )
                    ) : ch.type === "group" && (ch.grouping === "Group Chats" || !ch.allowed_roles || ch.allowed_roles.length === 0) ? (
                      // Group Chat letters avatar
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 select-none">
                        {ch.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <ChannelIcon iconName={ch.icon} className="w-4 h-4 flex-shrink-0 opacity-60" />
                    )}
                    <span className="truncate flex-1 text-left">{ch.name}</span>
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary pulsate-unread flex-shrink-0" />
                    )}
                  </button>
                );
              })
            ))
          }
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

