import { useState, useEffect } from "react";
import { Menu, Hash, Users, X, UserPlus, Plus, LogOut } from "lucide-react";
import type { ChatChannel } from "./ChannelSidebar";
import { useDialog } from "../../utils/useDialog";

export interface ChatHeaderProps {
  activeChannelData?: ChatChannel;
  onOpenMobileMenu: () => void;
  showMembersList?: boolean;
  onToggleMembersList?: () => void;
  
  // Creation mode props
  creationMode?: "dm" | "group" | null;
  onCancelCreation?: () => void;
  allUsers?: any[];
  currentUser?: any;
  onSelectRecipient?: (userId: number) => void;
  selectedGroupMembers?: number[];
  onAddGroupMember?: (userId: number) => void;
  onRemoveGroupMember?: (userId: number) => void;
  groupName?: string;
  onChangeGroupName?: (name: string) => void;
  onCreateGroup?: () => void;

  // Active private channel member additions & leaving props
  onAddMembersToActiveChannel?: (userIds: number[]) => void;
  onLeaveActiveChannel?: () => void;
}

export default function ChatHeader({
  activeChannelData,
  onOpenMobileMenu,
  showMembersList,
  onToggleMembersList,
  creationMode = null,
  onCancelCreation,
  allUsers = [],
  currentUser,
  onSelectRecipient,
  selectedGroupMembers = [],
  onAddGroupMember,
  onRemoveGroupMember,
  groupName = "",
  onChangeGroupName,
  onCreateGroup,
  onAddMembersToActiveChannel,
  onLeaveActiveChannel,
}: ChatHeaderProps) {
  const { showConfirm } = useDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [debouncedAddSearchQuery, setDebouncedAddSearchQuery] = useState("");

  // Debounce query search to avoid UI/filter lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAddSearchQuery(addSearchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [addSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter users that are not already in the group
  const existingMemberIds = activeChannelData?.members?.map((m: any) => m.id) || [];
  const filteredAddUsers = allUsers.filter((u) => {
    if (u.id === currentUser?.id) return false;
    if (existingMemberIds.includes(u.id)) return false;

    const query = debouncedAddSearchQuery.toLowerCase();
    const fullName = (u.name || "").toLowerCase();
    return fullName.includes(query);
  });

  // Reset query search on creationMode toggle
  useEffect(() => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
  }, [creationMode]);

  const filteredUsers = allUsers.filter((u) => {
    if (u.id === currentUser?.id) return false;
    
    // In Group Mode, exclude users who are already added
    if (creationMode === "group" && selectedGroupMembers.includes(u.id)) return false;

    const query = debouncedSearchQuery.toLowerCase();
    const fullName = (u.name || "").toLowerCase();
    const username = (u.username || "").toLowerCase();
    const email = (u.email || "").toLowerCase();

    return fullName.includes(query) || username.includes(query) || email.includes(query);
  });

  return (
    <div className={`flex items-center justify-between px-4 sm:px-5 border-b border-border bg-surface-900/30 flex-shrink-0 relative ${
      creationMode ? "min-h-[57px] py-1.5 h-auto" : "h-[57px]"
    }`}>
      {creationMode ? (
        <div className="flex-1 flex flex-wrap items-center justify-between gap-2.5 min-w-0">
          {creationMode === "dm" ? (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-primary flex-shrink-0 flex items-center gap-1 select-none">
                <UserPlus className="w-3.5 h-3.5" /> To:
              </span>
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type member name or username..."
                  className="w-full text-sm px-4 py-2 rounded-xl bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                />
                {debouncedSearchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-surface-900 border border-border rounded-xl shadow-2xl z-50 p-1 space-y-0.5 animate-fadeIn">
                    {filteredUsers.length === 0 ? (
                      <div className="p-2 text-xs text-text-muted italic select-none">No matching members found.</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            if (onSelectRecipient) onSelectRecipient(u.id);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer text-left"
                        >
                          <img 
                            src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.name}`} 
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0 bg-surface-750" 
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-text-primary block truncate">{u.name}</span>
                            <span className="text-[10px] text-text-muted truncate block">@{u.username || u.email}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0 py-1">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-primary flex items-center gap-1 select-none">
                  <Plus className="w-3.5 h-3.5" /> Group:
                </span>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => onChangeGroupName && onChangeGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="w-36 sm:w-48 text-sm px-3.5 py-1.5 rounded-xl bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                />
              </div>

              {/* Selected member chips (Messenger-style) */}
              <div className="flex items-center gap-1 flex-wrap max-w-xs overflow-x-auto py-0.5">
                {selectedGroupMembers.map((memberId) => {
                  const u = allUsers.find(user => user.id === memberId);
                  if (!u) return null;
                  const displayName = u.name ? u.name.split(' ')[0] : 'User';
                  return (
                    <span key={memberId} className="flex items-center gap-1 bg-primary/20 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full select-none">
                      {displayName}
                      <button 
                        type="button" 
                        onClick={() => onRemoveGroupMember && onRemoveGroupMember(memberId)} 
                        className="hover:text-text-primary cursor-pointer ml-0.5 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>

              <div className="relative flex-1 min-w-[140px] max-w-[220px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Add members..."
                  className="w-full text-sm px-3.5 py-1.5 rounded-xl bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                />
                {debouncedSearchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-surface-900 border border-border rounded-lg shadow-2xl z-50 p-1 space-y-0.5 animate-fadeIn">
                    {filteredUsers.length === 0 ? (
                      <div className="p-2 text-xs text-text-muted italic select-none">No matching members found.</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            if (onAddGroupMember) onAddGroupMember(u.id);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer text-left"
                        >
                          <img 
                            src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.name}`} 
                            className="w-4 h-4 rounded-full object-cover flex-shrink-0 bg-surface-750" 
                          />
                          <span className="font-semibold text-text-primary block truncate flex-1">{u.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                disabled={!groupName.trim() || selectedGroupMembers.length === 0}
                onClick={onCreateGroup}
                className="bg-primary hover:bg-primary-light disabled:opacity-50 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              >
                Create
              </button>
            </div>
          )}

          <button 
            type="button"
            onClick={onCancelCreation} 
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 min-w-0 flex-1">
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
      )}

      <div className="flex items-center gap-2 flex-shrink-0 ml-2 relative">
        {activeChannelData && (activeChannelData.type === "dm" || (activeChannelData.type === "group" && activeChannelData.allowed_roles === null)) && !creationMode && (
          <>
            <button
              type="button"
              onClick={() => setIsAddingMember((prev) => !prev)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isAddingMember
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
              title="Add members to this conversation"
            >
              <UserPlus className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={async () => {
                const confirmed = await showConfirm({
                  title: "Leave Conversation",
                  message: "Are you sure you want to leave this conversation? If all members leave, it will be deleted.",
                  type: "warning",
                  confirmText: "Leave",
                });
                if (confirmed) {
                  if (onLeaveActiveChannel) onLeaveActiveChannel();
                }
              }}
              className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors cursor-pointer"
              title="Leave conversation"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        )}

        {isAddingMember && (
          <div className="absolute top-[48px] right-0 bg-surface-900 border border-border rounded-xl shadow-2xl z-[100] p-3 w-64 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">Add Member</span>
              <button 
                onClick={() => {
                  setIsAddingMember(false);
                  setAddSearchQuery("");
                }} 
                className="text-text-muted hover:text-text-primary text-xs font-bold"
              >
                ×
              </button>
            </div>
            <input
              type="text"
              placeholder="Search member..."
              value={addSearchQuery}
              onChange={(e) => setAddSearchQuery(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-surface-950 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
            />
            {debouncedAddSearchQuery.trim() && (
              <div className="max-h-40 overflow-y-auto space-y-0.5 pt-1">
                {filteredAddUsers.length === 0 ? (
                  <div className="text-[10px] text-text-muted italic p-1">No matching members.</div>
                ) : (
                  filteredAddUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        if (onAddMembersToActiveChannel) {
                          onAddMembersToActiveChannel([u.id]);
                        }
                        setIsAddingMember(false);
                        setAddSearchQuery("");
                      }}
                      className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 text-[11px] text-text-primary hover:text-primary transition-colors cursor-pointer text-left"
                    >
                      <img 
                        src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.name}`} 
                        className="w-4 h-4 rounded-full object-cover bg-surface-750" 
                      />
                      <span className="truncate flex-1">{u.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {onToggleMembersList && !creationMode && (
          <button
            type="button"
            onClick={onToggleMembersList}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              showMembersList
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-text-muted hover:text-text-primary hover:bg-white/5"
            }`}
            title={showMembersList ? "Hide online members" : "Show online members"}
          >
            <Users className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
