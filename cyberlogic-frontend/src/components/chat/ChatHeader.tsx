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
  const [showSelectedDropdown, setShowSelectedDropdown] = useState(false);

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
    setShowSelectedDropdown(false);
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
            <div className="flex-1 flex items-center gap-3 min-w-0">
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
              <button 
                type="button"
                onClick={onCancelCreation} 
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3 w-full py-2 lg:flex lg:flex-row lg:items-center lg:py-0">
              {/* Group Name Section */}
              <div className="flex items-center gap-2 bg-surface-950/40 border border-border/50 px-3 py-1.5 rounded-2xl w-full lg:w-auto lg:flex-initial h-10 order-1 sm:order-1 lg:order-1">
                <span className="text-xs font-bold text-primary flex items-center gap-1 select-none flex-shrink-0 whitespace-nowrap">
                  <Plus className="w-3.5 h-3.5" /> Group:
                </span>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => onChangeGroupName && onChangeGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="w-full text-sm bg-transparent text-text-primary focus:outline-none transition-colors h-7 flex-1 lg:w-48 lg:flex-none"
                />
              </div>

              {/* Members Selection Section */}
              <div className="flex items-center gap-2 bg-surface-950/40 border border-border/50 px-3 py-1.5 rounded-2xl w-full min-w-0 h-10 relative order-2 sm:order-3 lg:order-2">
                {/* Selected members count trigger */}
                {selectedGroupMembers.length > 0 && (
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSelectedDropdown((prev) => !prev)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-all cursor-pointer select-none whitespace-nowrap flex-shrink-0 h-7"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{selectedGroupMembers.length} selected</span>
                      <span className="text-[10px] opacity-60">▼</span>
                    </button>

                    {showSelectedDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setShowSelectedDropdown(false)} 
                        />
                        <div className="absolute top-full left-0 mt-2 w-52 max-h-48 overflow-y-auto bg-surface-900 border border-border rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-fadeIn">
                          <div className="px-2 py-1 text-[9px] font-bold text-text-muted uppercase tracking-wider border-b border-border/40 mb-1 select-none">
                            Selected Members
                          </div>
                          {selectedGroupMembers.map((memberId) => {
                            const u = allUsers.find(user => user.id === memberId);
                            if (!u) return null;
                            return (
                              <div 
                                key={memberId} 
                                className="flex items-center justify-between p-1 rounded-lg text-xs hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <img 
                                    src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.name}`} 
                                    className="w-4.5 h-4.5 rounded-full object-cover flex-shrink-0 bg-surface-750" 
                                  />
                                  <span className="font-semibold text-text-primary truncate flex-1">{u.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onRemoveGroupMember && onRemoveGroupMember(memberId)}
                                  className="w-5 h-5 rounded-md flex items-center justify-center bg-error/10 hover:bg-error/25 text-error hover:text-white transition-colors cursor-pointer text-xs font-bold ml-1.5"
                                  title="Remove member"
                                >
                                  —
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Add members..."
                    className="w-full text-sm bg-transparent text-text-primary focus:outline-none transition-colors h-7"
                  />
                  {debouncedSearchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-surface-900 border border-border rounded-lg shadow-2xl z-50 p-1 space-y-0.5 animate-fadeIn">
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
              </div>

              {/* Create Button */}
              <button
                disabled={!groupName.trim() || selectedGroupMembers.length === 0}
                onClick={onCreateGroup}
                className="bg-primary hover:bg-primary-light disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer flex-shrink-0 h-10 order-3 sm:order-2 lg:order-3 w-full lg:w-auto"
              >
                Create Group Chat
              </button>

              {/* Cancel Button */}
              <button 
                type="button"
                onClick={onCancelCreation} 
                className="px-3 py-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 border border-border transition-colors cursor-pointer text-xs font-semibold flex-shrink-0 h-10 order-4 sm:order-4 lg:order-4 w-full lg:w-auto"
                title="Cancel"
              >
                Cancel
              </button>
            </div>
          )}
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
          {activeChannelData?.type === "dm" || activeChannelData?.grouping === "Direct Messages" ? (
            activeChannelData?.icon && activeChannelData.icon.startsWith("http") ? (
              <img src={activeChannelData.icon} className="w-5 h-5 rounded-full object-cover flex-shrink-0" alt="" />
            ) : (
              <img 
                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${activeChannelData?.name}`} 
                className="w-5 h-5 rounded-full object-cover flex-shrink-0" 
                alt=""
              />
            )
          ) : activeChannelData?.type === "group" && (activeChannelData.grouping === "Group Chats" || !activeChannelData.allowed_roles || activeChannelData.allowed_roles.length === 0) ? (
            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 select-none">
              {activeChannelData?.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Hash className="w-5 h-5 text-text-muted flex-shrink-0" />
          )}
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
