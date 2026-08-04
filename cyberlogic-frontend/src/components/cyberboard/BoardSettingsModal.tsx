import React, { useState, useEffect, useMemo } from "react";
import { Settings, X, Lock, Globe, ShieldCheck, Users, Search, Trash2, Check } from "lucide-react";
import { fetchDirectory, type CyberboardBoard, type DirectoryMember, type BoardCategory } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";

interface CollaboratorOption {
  id: number;
  name: string;
  avatar?: string | null;
}

interface BoardSettingsModalProps {
  board: CyberboardBoard;
  currentUserId?: number;
  isAdmin?: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<CyberboardBoard>) => Promise<void>;
  onDeleteBoard?: (boardId: number) => void;
}

const PRESET_COLORS = [
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#10b981", // Emerald
];

const AVAILABLE_ROLES = [
  { id: "officer", label: "Officers & Leads" },
  { id: "member", label: "General Members" },
  { id: "admin", label: "Admins & Superadmins" },
];

export default function BoardSettingsModal({
  board,
  currentUserId: _currentUserId,
  isAdmin,
  onClose,
  onSave,
  onDeleteBoard,
}: BoardSettingsModalProps) {
  const [title, setTitle] = useState(board.title || "");
  const [description, setDescription] = useState(board.description || "");
  const [type, setType] = useState<"activity" | "ideas" | "brainstorming" | "roadmap">(board.type || "activity");
  const [category, setCategory] = useState<BoardCategory>(board.category || "club_related");
  const [coverColor, setCoverColor] = useState(board.cover_color || "#06b6d4");

  const [visibility, setVisibility] = useState<"public" | "private">(board.visibility || "public");
  const [allowedMembers, setAllowedMembers] = useState<number[]>(board.allowed_members || []);

  const [columnPolicy, setColumnPolicy] = useState<"host_admin_only" | "specific_roles" | "specific_users" | "everyone">(
    board.column_creation_policy || "everyone"
  );
  const [allowedCreatorRoles, setAllowedCreatorRoles] = useState<string[]>(
    board.allowed_column_creator_roles || ["officer", "admin"]
  );
  const [allowedCreatorUsers, setAllowedCreatorUsers] = useState<number[]>(
    board.allowed_column_creator_users || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directoryMembers, setDirectoryMembers] = useState<CollaboratorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "privacy" | "columns">("general");

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Directory for member picker
  useEffect(() => {
    let isMounted = true;
    const loadMembers = async () => {
      setIsLoadingDirectory(true);
      try {
        const directory = await fetchDirectory();
        if (isMounted && directory && directory.length > 0) {
          const directoryOptions: CollaboratorOption[] = directory.map((m: DirectoryMember) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
          }));
          setDirectoryMembers(directoryOptions);
        }
      } catch (err) {
        console.error("Failed to fetch directory members for board privacy:", err);
      } finally {
        if (isMounted) setIsLoadingDirectory(false);
      }
    };
    loadMembers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return directoryMembers;
    const query = searchQuery.toLowerCase().trim();
    return directoryMembers.filter((m) => m.name.toLowerCase().includes(query));
  }, [directoryMembers, searchQuery]);

  const toggleMemberSelection = (userId: number) => {
    setAllowedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleCreatorUserSelection = (userId: number) => {
    setAllowedCreatorUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleRoleSelection = (roleId: string) => {
    setAllowedCreatorRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        cover_color: coverColor,
        visibility,
        allowed_members: visibility === "private" ? allowedMembers : [],
        column_creation_policy: columnPolicy,
        allowed_column_creator_roles: columnPolicy === "specific_roles" ? allowedCreatorRoles : [],
        allowed_column_creator_users: columnPolicy === "specific_users" ? allowedCreatorUsers : [],
      });
      onClose();
    } catch (err) {
      console.error("Failed to update board settings:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Settings Tab Selector */}
      <div className="flex items-center gap-1 p-1 bg-surface-800/80 rounded-xl border border-border/50 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "general"
              ? "bg-surface-700 text-primary shadow-xs"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("privacy")}
          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "privacy"
              ? "bg-surface-700 text-primary shadow-xs"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy & Access</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("columns")}
          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "columns"
              ? "bg-surface-700 text-primary shadow-xs"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Column Controls</span>
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === "general" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
              Board Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all"
              placeholder="e.g. Q3 Hackathon Planning"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
              Description & Objective
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all resize-none"
              placeholder="Describe the purpose of this board..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                Board Format
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all"
              >
                <option value="activity">📅 Activity Board</option>
                <option value="ideas">💡 Idea Box</option>
                <option value="brainstorming">🧠 Brainstorming</option>
                <option value="roadmap">🚀 Product Roadmap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                Board Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all"
              >
                <option value="club_related">🎓 Club Related</option>
                <option value="projects_tech">💻 Projects & Tech</option>
                <option value="events_social">🚀 Events & Socials</option>
                <option value="others">💡 Others</option>
                {isAdmin && <option value="system">🛡️ System (Admin Only)</option>}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Cover Accent Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCoverColor(c)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                    coverColor === c ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-900 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Privacy & Exclusivity */}
      {activeTab === "privacy" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
              Board Privacy Setting
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Public Option */}
              <div
                onClick={() => setVisibility("public")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  visibility === "public"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                }`}
              >
                <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>Public Board</span>
                    {visibility === "public" && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-text-muted leading-snug">
                    Visible to all community members on Cyberlogic.
                  </p>
                </div>
              </div>

              {/* Private Option */}
              <div
                onClick={() => setVisibility("private")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  visibility === "private"
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                    : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                }`}
              >
                <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>Private Board (Exclusive)</span>
                    {visibility === "private" && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-text-muted leading-snug">
                    Exclusively restricted to host, admins & invited members.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Member Picker for Private Boards */}
          {visibility === "private" && (
            <div className="p-4 rounded-xl bg-surface-800/40 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Allowed Exclusive Members ({allowedMembers.length})</span>
                </label>
                <span className="text-[10px] text-text-muted">Search directory to grant access</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search member name..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-800 border border-border text-xs text-text-primary focus:border-amber-400 focus:outline-none transition-all"
                />
              </div>

              {/* Member Selection List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {isLoadingDirectory ? (
                  <p className="text-xs text-text-muted italic py-3 text-center">Loading members directory...</p>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-xs text-text-muted italic py-3 text-center">No members found.</p>
                ) : (
                  filteredMembers.map((member) => {
                    const isSelected = allowedMembers.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => toggleMemberSelection(member.id)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold"
                            : "bg-surface-800/70 border-border/50 text-text-secondary hover:bg-surface-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={member.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=member"}
                            alt={member.name}
                            className="w-5 h-5 rounded-full border border-border object-cover"
                          />
                          <span className="truncate">{member.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Column Creation Controls */}
      {activeTab === "columns" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
              Who is allowed to add/create new columns?
            </label>

            <div className="space-y-2">
              <label
                onClick={() => setColumnPolicy("everyone")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  columnPolicy === "everyone"
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                }`}
              >
                <div>
                  <div className="font-bold">Everyone (All Board Members)</div>
                  <div className="text-[11px] font-normal text-text-muted">
                    Any authorized member of this board can create columns.
                  </div>
                </div>
                {columnPolicy === "everyone" && <Check className="w-4 h-4 text-primary" />}
              </label>

              <label
                onClick={() => setColumnPolicy("host_admin_only")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  columnPolicy === "host_admin_only"
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                }`}
              >
                <div>
                  <div className="font-bold">Host & Admins Only</div>
                  <div className="text-[11px] font-normal text-text-muted">
                    Only board creator and site administrators can add columns.
                  </div>
                </div>
                {columnPolicy === "host_admin_only" && <Check className="w-4 h-4 text-primary" />}
              </label>

              <label
                onClick={() => setColumnPolicy("specific_roles")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  columnPolicy === "specific_roles"
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                }`}
              >
                <div>
                  <div className="font-bold">Specific Roles Only</div>
                  <div className="text-[11px] font-normal text-text-muted">
                    Restrict column creation to selected role permissions.
                  </div>
                </div>
                {columnPolicy === "specific_roles" && <Check className="w-4 h-4 text-primary" />}
              </label>

              <label
                onClick={() => setColumnPolicy("specific_users")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  columnPolicy === "specific_users"
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                }`}
              >
                <div>
                  <div className="font-bold">Specific Individuals (Users) Only</div>
                  <div className="text-[11px] font-normal text-text-muted">
                    Pick specific individual members permitted to add columns.
                  </div>
                </div>
                {columnPolicy === "specific_users" && <Check className="w-4 h-4 text-primary" />}
              </label>
            </div>
          </div>

          {/* Specific Roles Checkboxes */}
          {columnPolicy === "specific_roles" && (
            <div className="p-3.5 rounded-xl bg-surface-800/50 border border-border/50 space-y-2.5">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                Select Permitted Roles
              </label>
              <div className="space-y-1.5">
                {AVAILABLE_ROLES.map((role) => {
                  const isChecked = allowedCreatorRoles.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      onClick={() => toggleRoleSelection(role.id)}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                          : "bg-surface-800/80 border-border/50 text-text-secondary"
                      }`}
                    >
                      <span>{role.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-primary" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specific Users Member Picker */}
          {columnPolicy === "specific_users" && (
            <div className="p-3.5 rounded-xl bg-surface-800/50 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                  Select Permitted Individuals ({allowedCreatorUsers.length})
                </label>
                <span className="text-[10px] text-text-muted">Search directory to permit users</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search member name..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all"
                />
              </div>

              {/* Member Selection List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {isLoadingDirectory ? (
                  <p className="text-xs text-text-muted italic py-3 text-center">Loading members directory...</p>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-xs text-text-muted italic py-3 text-center">No members found.</p>
                ) : (
                  filteredMembers.map((member) => {
                    const isSelected = allowedCreatorUsers.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => toggleCreatorUserSelection(member.id)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                            : "bg-surface-800/70 border-border/50 text-text-secondary hover:bg-surface-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={member.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=member"}
                            alt={member.name}
                            className="w-5 h-5 rounded-full border border-border object-cover"
                          />
                          <span className="truncate">{member.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
        {onDeleteBoard ? (
          <button
            type="button"
            onClick={() => onDeleteBoard(board.id)}
            className="px-3.5 py-2 rounded-xl text-error bg-error/10 hover:bg-error/20 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Board</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Board Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title="Board Settings"
        initialSnap="3/4"
      >
        {formContent}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Board Settings</h2>
              <p className="text-xs text-text-muted">Configure privacy, format, and permissions</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">{formContent}</div>
      </div>
    </div>
  );
}
