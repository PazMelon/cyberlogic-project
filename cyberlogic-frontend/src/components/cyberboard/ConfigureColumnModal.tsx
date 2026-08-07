import React, { useState, useEffect, useMemo } from "react";
import {
  Settings,
  X,
  Lock,
  ShieldCheck,
  Users,
  Check,
  UserPlus,
  Search,
  Sparkles,
  Palette,
  Layers,
  Sliders,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import { fetchDirectory, type CyberboardColumn, type DirectoryMember } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";

interface CollaboratorOption {
  id: number;
  name: string;
  avatar?: string | null;
}

interface ConfigureColumnModalProps {
  column: CyberboardColumn;
  collaboratorsList: CollaboratorOption[];
  boardVisibility?: string;
  onClose: () => void;
  onSubmit: (columnId: number, data: {
    title?: string;
    color?: string;
    status_type?: string | null;
    allowed_roles?: string[] | null;
    allowed_users?: number[] | null;
  }) => Promise<void>;
}

const PRESET_COLORS = [
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#10b981", name: "Emerald" },
  { hex: "#f59e0b", name: "Amber" },
  { hex: "#ef4444", name: "Red" },
  { hex: "#ec4899", name: "Pink" },
  { hex: "#8b5cf6", name: "Purple" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#14b8a6", name: "Teal" },
];

const STATUS_TYPES = [
  {
    id: "not_started",
    label: "Not Started / To Do",
    description: "Initial backlog or pending work items",
    bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    dot: "bg-yellow-400",
    icon: Clock,
  },
  {
    id: "in_progress",
    label: "In Progress / Active",
    description: "Tasks currently being worked on",
    bg: "bg-lime-500/10 border-lime-500/30 text-lime-400",
    dot: "bg-lime-400",
    icon: Sliders,
  },
  {
    id: "under_review",
    label: "Under Review / QA",
    description: "Pending verification or quality assurance",
    bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    dot: "bg-cyan-400",
    icon: Eye,
  },
  {
    id: "completed",
    label: "Completed / Done",
    description: "Finished and verified task items",
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
  {
    id: "blocked",
    label: "Blocked / On Hold",
    description: "Stalled tasks needing clearance",
    bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    dot: "bg-amber-400",
    icon: AlertCircle,
  },
];

export default function ConfigureColumnModal({
  column,
  collaboratorsList,
  boardVisibility = "public",
  onClose,
  onSubmit,
}: ConfigureColumnModalProps) {
  const [title, setTitle] = useState(column.title || "");
  const [color, setColor] = useState(column.color || "#06b6d4");
  const [statusType, setStatusType] = useState<string>(column.status_type || "not_started");
  const [activeTab, setActiveTab] = useState<"general" | "access">("general");

  const initialPreset = () => {
    const roles = column.allowed_roles || [];
    const users = column.allowed_users || [];
    if (roles.length === 0 && users.length === 0) return "everyone";
    if (roles.includes("host") && roles.length === 1 && users.length === 0) return "host_admin";
    if (roles.includes("officer") && roles.length === 1 && users.length === 0) return "officer_admin";
    return "custom";
  };

  const [permissionMode, setPermissionMode] = useState<string>(initialPreset());
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(column.allowed_users || []);
  const [submitting, setSubmitting] = useState(false);

  const [allMembers, setAllMembers] = useState<CollaboratorOption[]>(collaboratorsList);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const directory = await fetchDirectory();
        if (isMounted && directory && directory.length > 0) {
          const directoryOptions: CollaboratorOption[] = directory.map((m: DirectoryMember) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
          }));
          const mergedMap = new Map<number, CollaboratorOption>();

          if (boardVisibility === "private") {
            const allowedIds = new Set(collaboratorsList.map((c) => c.id));
            directoryOptions.forEach((m) => {
              if (allowedIds.has(m.id)) mergedMap.set(m.id, m);
            });
            collaboratorsList.forEach((m) => {
              if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
            });
          } else {
            directoryOptions.forEach((m) => mergedMap.set(m.id, m));
            collaboratorsList.forEach((m) => {
              if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
            });
          }

          setAllMembers(Array.from(mergedMap.values()));
        }
      } catch (err) {
        console.error("Failed to fetch directory members for column configuration:", err);
      } finally {
        if (isMounted) setIsLoadingMembers(false);
      }
    };
    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [collaboratorsList, boardVisibility]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return allMembers;
    const query = searchQuery.toLowerCase().trim();
    return allMembers.filter((m) => m.name.toLowerCase().includes(query));
  }, [allMembers, searchQuery]);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredMembers.map((m) => m.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let allowed_roles: string[] | null = null;
      let allowed_users: number[] | null = null;

      if (permissionMode === "host_admin") {
        allowed_roles = ["host"];
      } else if (permissionMode === "officer_admin") {
        allowed_roles = ["officer"];
      } else if (permissionMode === "custom") {
        allowed_roles = ["host"];
        allowed_users = selectedUserIds.length > 0 ? selectedUserIds : null;
      }

      await onSubmit(column.id, {
        title: title.trim(),
        color,
        status_type: statusType,
        allowed_roles,
        allowed_users,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update column permissions:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formBody = (
    <form id="configure-column-form" onSubmit={handleSubmit} className="space-y-5">

      {/* Tab Selector */}
      <div className="flex items-center gap-1 p-1 bg-surface-950/60 rounded-xl border border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "general"
              ? "bg-surface-800 text-text-primary shadow-sm border border-border/80"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <span>General & Status</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("access")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "access"
              ? "bg-surface-800 text-text-primary shadow-sm border border-border/80"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span>Access Control</span>
          {permissionMode !== "everyone" && (
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          )}
        </button>
      </div>

      {/* TAB 1: General & Status */}
      {activeTab === "general" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Column Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. In Review, Done, Sprint Backlog..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Color Tag Palette */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-primary" />
              Accent Color
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setColor(preset.hex)}
                  title={preset.name}
                  className={`w-8 h-8 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-white/10 ${
                    color.toLowerCase() === preset.hex.toLowerCase()
                      ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface-900 shadow-md"
                      : "opacity-80 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {color.toLowerCase() === preset.hex.toLowerCase() && (
                    <Check className="w-4 h-4 text-slate-950 font-bold" />
                  )}
                </button>
              ))}

              {/* Custom Color Input */}
              <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 p-0.5 rounded-xl bg-surface-800 border border-border cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-20 px-2 py-1 rounded-lg bg-surface-800 border border-border text-xs text-text-primary font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Gantt Roadmap View Status Category Mapping */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              Gantt Chart Status Category
            </label>
            <p className="text-[11px] text-text-muted">
              Select how tasks in this column map to Gantt Roadmap timelines and Excel exports:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATUS_TYPES.map((st) => {
                const IconComponent = st.icon;
                const isSelected = statusType === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusType(st.id)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? `${st.bg} border-2 font-bold shadow-sm`
                        : "bg-surface-800/40 border-border/60 text-text-secondary hover:text-text-primary hover:bg-surface-800"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{st.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] opacity-80 line-clamp-1 mt-0.5">
                        {st.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Access & Permissions */}
      {activeTab === "access" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Exclusive Private Board Column Disclaimer */}
          {boardVisibility === "private" && (
            <div className="p-3 rounded-2xl bg-warning/10 border border-warning/20 flex items-center gap-2.5 text-warning text-xs font-semibold">
              <Lock className="w-4 h-4 text-warning flex-shrink-0" />
              <span>Exclusive Private Board Column Settings — Permissions apply to invited members only.</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              Drag & Drop Access Control
            </label>
            <p className="text-[11px] text-text-muted">
              Choose who has permission to move or drop cards into this column:
            </p>

            <div className="space-y-2">
              {/* Option 1: Everyone / Private Members */}
              <button
                type="button"
                onClick={() => setPermissionMode("everyone")}
                className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  permissionMode === "everyone"
                    ? "bg-primary/10 border-primary/40 text-text-primary ring-1 ring-primary/30"
                    : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
                }`}
              >
                <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      {boardVisibility === "private" ? "All Private Board Members" : "Everyone (All Members)"}
                    </span>
                    {permissionMode === "everyone" && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {boardVisibility === "private"
                      ? "Any approved member of this private board can move cards into this column."
                      : "Any member can freely suggest or move cards into this column."}
                  </p>
                </div>
              </button>

              {/* Option 2: Board Host Only */}
              <button
                type="button"
                onClick={() => setPermissionMode("host_admin")}
                className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  permissionMode === "host_admin"
                    ? "bg-primary/10 border-primary/40 text-text-primary ring-1 ring-primary/30"
                    : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
                }`}
              >
                <Lock className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      {boardVisibility === "private" ? "Board Host Only (Strict Lock)" : "Board Host & Admins Only"}
                    </span>
                    {permissionMode === "host_admin" && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {boardVisibility === "private"
                      ? "Only the creator of this private board can move cards into this stage."
                      : "Ideal for 'Under Review' or 'Approved' columns. Standard members cannot drop cards here."}
                  </p>
                </div>
              </button>

              {/* Option 3: Officers & Admins Only (Public Boards Only) */}
              {boardVisibility !== "private" && (
                <button
                  type="button"
                  onClick={() => setPermissionMode("officer_admin")}
                  className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    permissionMode === "officer_admin"
                      ? "bg-primary/10 border-primary/40 text-text-primary ring-1 ring-primary/30"
                      : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">
                        Officers & Admins Only
                      </span>
                      {permissionMode === "officer_admin" && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Restricts drop access to club officers, board host, and administrators.
                    </p>
                  </div>
                </button>
              )}

              {/* Option 4: Specific Individual Members */}
              <button
                type="button"
                onClick={() => setPermissionMode("custom")}
                className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  permissionMode === "custom"
                    ? "bg-primary/10 border-primary/40 text-text-primary ring-1 ring-primary/30"
                    : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
                }`}
              >
                <UserPlus className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      {boardVisibility === "private" ? "Specific Private Board Members" : "Specific Individual Members"}
                    </span>
                    {permissionMode === "custom" && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {boardVisibility === "private"
                      ? "Pick specific members from the private board allowed to move cards into this column."
                      : "Pick specific individual members who are granted permission to drag into this column."}
                  </p>
                </div>
              </button>
            </div>

            {/* Custom Individual Member Selector */}
            {permissionMode === "custom" && (
              <div className="p-4 rounded-2xl bg-surface-950/70 border border-border/80 space-y-3 animate-in fade-in duration-200 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">
                    Select Permitted Members
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[10px] font-semibold text-primary hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-text-muted text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-[10px] font-semibold text-text-muted hover:text-text-primary"
                    >
                      Clear
                    </button>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 ml-1">
                      {selectedUserIds.length} selected
                    </span>
                  </div>
                </div>

                {/* Member Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all members by name..."
                    className="w-full pl-8 pr-8 py-2 rounded-xl bg-surface-800 border border-border/80 text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Directory List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {isLoadingMembers && allMembers.length === 0 ? (
                    <div className="py-4 text-center text-xs text-text-muted font-medium">
                      Loading member directory...
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="py-4 text-center text-xs text-text-muted font-medium">
                      No members found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const isSelected = selectedUserIds.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => toggleUserSelection(member.id)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? "bg-primary/15 border-primary/40 text-text-primary font-semibold shadow-xs"
                              : "bg-surface-800/50 border-border/40 text-text-muted hover:text-text-primary hover:bg-surface-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                member.avatar ||
                                "https://api.dicebear.com/9.x/avataaars/svg?seed=user"
                              }
                              alt={member.name}
                              className="w-6 h-6 rounded-full border border-border object-cover flex-shrink-0"
                            />
                            <span className="truncate">{member.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action CTAs */}
      {!isMobile && (
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <div className="text-[11px] text-text-muted">
            Changes apply instantly upon save
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold hover:bg-surface-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{submitting ? "Saving Changes..." : "Save Column Settings"}</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title="Column Settings"
        initialSnap="3/4"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-border text-text-muted hover:text-text-primary text-sm font-semibold hover:bg-surface-800 transition-all cursor-pointer text-center active:scale-98"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="configure-column-form"
              disabled={submitting || !title.trim()}
              className="flex-1 py-3 px-5 rounded-xl bg-primary text-surface-950 text-sm font-extrabold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/25 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? "Saving..." : "Save Column"}</span>
            </button>
          </div>
        }
      >
        {formBody}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Accent Line */}
        <div
          className="h-1.5 w-full transition-all duration-300"
          style={{ backgroundColor: color }}
        />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-surface-900/90">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs transition-colors"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                color: color,
              }}
            >
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Column Settings
              </h2>
              <p className="text-xs text-text-muted">
                Configure column styling, Gantt status, and access permissions
              </p>
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto scrollbar-thin">
          {formBody}
        </div>
      </div>
    </div>
  );
}
