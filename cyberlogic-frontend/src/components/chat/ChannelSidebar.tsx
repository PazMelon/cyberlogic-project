import { useState } from "react";
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
  X,
  UserPlus
} from "lucide-react";
import { SkeletonLine } from "../Skeleton";
import { useAuth } from "../../context/AuthContext";

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
  allUsers?: any[];
  isConnected: boolean;
  onChannelSelect?: () => void;
  collapsedGroups: Record<string, boolean>;
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  className?: string;
  unreadStatus?: Record<string, boolean>;
  startDm?: (recipientId: number) => void;
  createGroupChat?: (name: string, userIds: number[]) => void;
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
  allUsers = [],
  isConnected,
  onChannelSelect,
  collapsedGroups,
  setCollapsedGroups,
  className,
  unreadStatus = {},
  startDm,
  createGroupChat,
}: ChannelSidebarProps) {
  const { user: currentUser } = useAuth();
  
  // Modal states
  const [showDmModal, setShowDmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | "">("");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupUserIds, setSelectedGroupUserIds] = useState<number[]>([]);

  if (onlineUsers.length > 9999) {
    console.log(onlineUsers);
  }

  const groupedChannels: Record<string, ChatChannel[]> = {};
  groupedChannels["Messages"] = [];

  channels.forEach((ch) => {
    let groupName = ch.grouping || "General";
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
                    onClick={() => setShowDmModal(true)}
                    className="p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer"
                    title="Start DM"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGroupModal(true)}
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
                    {ch.type === "dm" ? (
                      ch.icon && ch.icon.startsWith("http") ? (
                        <img src={ch.icon} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <img 
                          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${ch.name}`} 
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0" 
                        />
                      )
                    ) : ch.type === "group" && ch.allowed_roles === null ? (
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

      {/* Start DM Modal */}
      {showDmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm p-5 border border-border bg-surface-900 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => {
                setShowDmModal(false);
                setSelectedRecipientId("");
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-text-primary mb-1 font-[family-name:var(--font-heading)]">Start Direct Message</h3>
            <p className="text-xs text-text-muted mb-4">Select a club member to start a private chat.</p>

            <div className="space-y-3">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-text-muted">Select Member</label>
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 rounded-lg bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                <option value="">-- Choose a user --</option>
                {allUsers
                  ?.filter((u) => u.id !== currentUser?.id)
                  ?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.username || u.email})
                    </option>
                  ))}
              </select>

              <button
                disabled={!selectedRecipientId}
                onClick={() => {
                  if (startDm && selectedRecipientId) {
                    startDm(Number(selectedRecipientId));
                    setShowDmModal(false);
                    setSelectedRecipientId("");
                  }
                }}
                className="w-full bg-primary hover:bg-primary-light disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer mt-2"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Chat Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm p-5 border border-border bg-surface-900 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => {
                setShowGroupModal(false);
                setNewGroupName("");
                setSelectedGroupUserIds([]);
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-text-primary mb-1 font-[family-name:var(--font-heading)]">Create Group Chat</h3>
            <p className="text-xs text-text-muted mb-4">Choose a group name and select members to add.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Study Group"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1.5">Select Members</label>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-surface-950/50 p-2 rounded-lg border border-border/60">
                  {allUsers
                    ?.filter((u) => u.id !== currentUser?.id)
                    ?.map((u) => {
                      const isSelected = selectedGroupUserIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 text-xs text-text-muted cursor-pointer hover:text-text-primary transition-colors py-0.5 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedGroupUserIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== u.id)
                                  : [...prev, u.id]
                              );
                            }}
                            className="rounded border-border text-primary focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="truncate">{u.first_name} {u.last_name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <button
                disabled={!newGroupName.trim() || selectedGroupUserIds.length === 0}
                onClick={() => {
                  if (createGroupChat && newGroupName.trim() && selectedGroupUserIds.length > 0) {
                    createGroupChat(newGroupName.trim(), selectedGroupUserIds);
                    setShowGroupModal(false);
                    setNewGroupName("");
                    setSelectedGroupUserIds([]);
                  }
                }}
                className="w-full bg-primary hover:bg-primary-light disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

