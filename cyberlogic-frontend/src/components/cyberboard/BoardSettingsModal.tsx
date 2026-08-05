import React, { useState, useEffect, useMemo } from "react";
import { Settings, X, Lock, Globe, ShieldCheck, Users, Search, Trash2, Check, Layers, Plus, RefreshCw, Info, SlidersHorizontal, GripVertical } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"general" | "privacy" | "columns" | "phases">("general");

  const [methodology, setMethodology] = useState<"waterfall" | "agile" | "custom">(
    board.methodology || "waterfall"
  );
  const [phaseSettings, setPhaseSettings] = useState<Array<{ name: string; color: string }>>(
    board.phase_settings || [
      { name: "Requirements & Planning", color: "#3b82f6" },
      { name: "Architecture & Design", color: "#8b5cf6" },
      { name: "Development & Implementation", color: "#06b6d4" },
      { name: "Testing & QA", color: "#f59e0b" },
      { name: "Deployment & Release", color: "#10b981" },
    ]
  );
  const [draggedPhaseIndex, setDraggedPhaseIndex] = useState<number | null>(null);

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
        methodology,
        phase_settings: phaseSettings,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update board settings:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="space-y-6">

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

      {/* Tab 4: Dynamic Phases & Sprints Management */}
      {activeTab === "phases" && (
        <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-150 min-h-0">
          {/* Methodology Selector */}
          <div className="space-y-1.5 flex-shrink-0">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              Project Methodology & Roadmap Type
            </label>
            <select
              value={methodology}
              onChange={(e) => setMethodology(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all cursor-pointer"
            >
              <option value="waterfall">Waterfall SDLC (Sequential Phases)</option>
              <option value="agile">Agile / Scrum (Iterative Sprints & Backlog)</option>
              <option value="custom">Custom / Hybrid Milestones</option>
            </select>
          </div>

          {/* Preset Loader Buttons */}
          <div className="p-3 rounded-xl bg-surface-800/60 border border-border/60 space-y-2 flex-shrink-0">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              Quick Load Preset Templates
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setMethodology("waterfall");
                  setPhaseSettings([
                    { name: "Requirements & Planning", color: "#3b82f6" },
                    { name: "Architecture & Design", color: "#8b5cf6" },
                    { name: "Development & Implementation", color: "#06b6d4" },
                    { name: "Testing & QA", color: "#f59e0b" },
                    { name: "Deployment & Release", color: "#10b981" },
                  ]);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-650 text-text-primary text-[11px] font-semibold border border-border transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>Waterfall SDLC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethodology("agile");
                  setPhaseSettings([
                    { name: "Sprint 1", color: "#06b6d4" },
                    { name: "Sprint 2", color: "#3b82f6" },
                    { name: "Sprint 3", color: "#8b5cf6" },
                    { name: "Sprint 4", color: "#f59e0b" },
                    { name: "Release v1.0", color: "#10b981" },
                    { name: "Backlog", color: "#64748b" },
                  ]);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-650 text-text-primary text-[11px] font-semibold border border-border transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-purple-400" />
                <span>Agile Sprints</span>
              </button>
            </div>
          </div>

          {/* Phase Settings Manager List (Flex Fill Occupy Available Height) */}
          <div className="flex-1 flex flex-col space-y-2 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                Board Phases / Sprints ({phaseSettings.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  setPhaseSettings((prev) => [
                    ...prev,
                    {
                      name: `Sprint ${prev.length + 1}`,
                      color: PRESET_COLORS[prev.length % PRESET_COLORS.length],
                    },
                  ]);
                }}
                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Phase / Sprint</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin min-h-[220px]">
              {phaseSettings.map((phaseItem, index) => {
                const isDragging = draggedPhaseIndex === index;
                return (
                  <div
                    key={`phase-edit-${index}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", index.toString());
                      setDraggedPhaseIndex(index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedPhaseIndex === null || draggedPhaseIndex === index) return;
                      setPhaseSettings((prev) => {
                        const updated = [...prev];
                        const [moved] = updated.splice(draggedPhaseIndex, 1);
                        updated.splice(index, 0, moved);
                        return updated;
                      });
                      setDraggedPhaseIndex(null);
                    }}
                    onDragEnd={() => setDraggedPhaseIndex(null)}
                    className={`p-2.5 rounded-xl bg-surface-800/80 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isDragging
                        ? "opacity-40 border-primary border-dashed scale-[0.99]"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    {/* Drag Handle & Phase Name Input */}
                    <div className="flex items-center gap-2 flex-1 w-full min-w-0">
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-primary rounded transition-colors flex-shrink-0"
                        title="Click and drag to reorder phase"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <input
                        type="text"
                        value={phaseItem.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setPhaseSettings((prev) =>
                            prev.map((p, idx) => (idx === index ? { ...p, name: newName } : p))
                          );
                        }}
                        placeholder="Phase / Sprint Name"
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-surface-900 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
                      />
                    </div>

                    {/* Color Picker Swatches & Delete Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-border/40 flex-shrink-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setPhaseSettings((prev) =>
                                prev.map((p, idx) => (idx === index ? { ...p, color } : p))
                              );
                            }}
                            className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                              phaseItem.color === color ? "scale-125 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPhaseSettings((prev) => prev.filter((_, idx) => idx !== index));
                        }}
                        className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer flex-shrink-0 ml-auto sm:ml-0"
                        title="Delete Phase / Sprint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title="Board Settings"
        initialSnap="3/4"
        footer={
          <div className="flex items-center justify-between gap-2">
            {onDeleteBoard ? (
              <button
                type="button"
                onClick={() => onDeleteBoard(board.id)}
                className="px-3 py-2 rounded-xl text-error bg-error/10 hover:bg-error/20 font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="board-settings-mobile-form"
                disabled={!title.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <form id="board-settings-mobile-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile Tab Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "general"
                  ? "bg-primary text-surface-950 font-bold"
                  : "bg-surface-800 text-text-muted hover:text-text-primary"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>General</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "privacy"
                  ? "bg-primary text-surface-950 font-bold"
                  : "bg-surface-800 text-text-muted hover:text-text-primary"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("columns")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "columns"
                  ? "bg-primary text-surface-950 font-bold"
                  : "bg-surface-800 text-text-muted hover:text-text-primary"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>

            {type === "roadmap" && (
              <button
                type="button"
                onClick={() => setActiveTab("phases")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "phases"
                    ? "bg-primary text-surface-950 font-bold"
                    : "bg-surface-800 text-text-muted hover:text-text-primary"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Phases & Sprints</span>
              </button>
            )}
          </div>

          {/* Tab Content Fields */}
          <div className="py-1">
            {formContent}
          </div>
        </form>
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-3xl max-w-5xl w-full h-[700px] max-h-[92vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar Panel */}
        <div className="w-full md:w-72 bg-surface-900/90 border-b md:border-b-0 md:border-r border-border/80 p-6 flex flex-col justify-between flex-shrink-0">
          <div>
            {/* Header / Description */}
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-text-primary">Board Settings</h2>
              <span className="text-text-muted hover:text-text-primary cursor-pointer p-0.5" title="Customize board configuration">
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              Customize board details, access rules, column permissions, and dynamic phase/sprint settings.
            </p>

            {/* Vertical Sidebar Navigation */}
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs font-semibold ${
                  activeTab === "general"
                    ? "bg-surface-800 text-primary border border-border/60 shadow-xs font-bold"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4" />
                  <span>General Details</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs font-semibold ${
                  activeTab === "privacy"
                    ? "bg-surface-800 text-primary border border-border/60 shadow-xs font-bold"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4" />
                  <span>Privacy & Access</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("columns")}
                className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs font-semibold ${
                  activeTab === "columns"
                    ? "bg-surface-800 text-primary border border-border/60 shadow-xs font-bold"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Column Controls</span>
                </div>
              </button>

              {type === "roadmap" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("phases")}
                  className={`w-full px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs font-semibold ${
                    activeTab === "phases"
                      ? "bg-surface-800 text-primary border border-border/60 shadow-xs font-bold"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" />
                    <span>Phases & Sprints</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-primary/10 text-primary uppercase border border-primary/20">
                    Dynamic
                  </span>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <form onSubmit={handleSubmit} className="flex-1 bg-surface-950/40 flex flex-col justify-between relative overflow-hidden h-full">
          {/* Section Header */}
          <div className="p-6 pb-4 border-b border-border/60 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                {activeTab === "general" && "General Configuration"}
                {activeTab === "privacy" && "Privacy & Access Control"}
                {activeTab === "columns" && "Column Creator Permissions"}
                {activeTab === "phases" && "Phases & Sprints Manager"}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {activeTab === "general" && "Basic board details, type, and visual theme color"}
                {activeTab === "privacy" && "Manage board visibility and permitted collaborators"}
                {activeTab === "columns" && "Define who is allowed to create new columns on this board"}
                {activeTab === "phases" && "Configure SDLC stages, Scrum Sprints, or custom milestones"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800/80 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content Body (Scrollable Area) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {formContent}
          </div>

          {/* Docked Action Footer (Edge-to-Edge Flush) */}
          <div className="p-4 px-6 border-t border-border/60 bg-surface-900/90 backdrop-blur-md flex items-center justify-between gap-3 flex-shrink-0 w-full">
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
                className="px-6 py-2.5 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
