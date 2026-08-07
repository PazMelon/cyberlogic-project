import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Kanban,
  Calendar,
  Lightbulb,
  Brain,
  Rocket,
  Lock,
  Globe,
  Search,
  Check,
  RefreshCw,
  Settings,
  ShieldCheck,
  Layers,
  Info,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchDirectory, type CyberboardBoard, type DirectoryMember, type BoardCategory } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";

export type BoardType = "activity" | "ideas" | "brainstorming" | "roadmap";

interface CollaboratorOption {
  id: number;
  name: string;
  avatar?: string | null;
}

interface CreateBoardModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<CyberboardBoard> & { title: string }) => Promise<void>;
}

const BOARD_TYPES: {
  id: BoardType;
  label: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}[] = [
  {
    id: "activity",
    label: "Activity Board",
    badge: "Scheduled Events",
    description: "Plan events and club activities with start & end dates",
    icon: Calendar,
    accentColor: "#06b6d4",
  },
  {
    id: "ideas",
    label: "Idea Box Board",
    badge: "Ideas Only (No Date)",
    description: "Collect member suggestions, feature requests & feedback",
    icon: Lightbulb,
    accentColor: "#f59e0b",
  },
  {
    id: "brainstorming",
    label: "Brainstorming",
    badge: "Collab Ideation",
    description: "Collaborative workshops, team concepts & open discussions",
    icon: Brain,
    accentColor: "#8b5cf6",
  },
  {
    id: "roadmap",
    label: "Project Roadmap",
    badge: "Milestones & Target Dates",
    description: "Track initiative milestones, deliverables & release goals",
    icon: Rocket,
    accentColor: "#10b981",
  },
];

const COVER_GRADIENTS = [
  { name: "Cyan Cyber", color: "#06b6d4" },
  { name: "Emerald Tech", color: "#10b981" },
  { name: "Amber Glow", color: "#f59e0b" },
  { name: "Purple Neon", color: "#8b5cf6" },
  { name: "Rose Pulse", color: "#ec4899" },
  { name: "Royal Blue", color: "#3b82f6" },
];

const AVAILABLE_ROLES = [
  { id: "officer", label: "Officers & Leads" },
  { id: "member", label: "General Members" },
  { id: "admin", label: "Admins & Superadmins" },
];

export default function CreateBoardModal({ onClose, onSubmit }: CreateBoardModalProps) {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "privacy" | "columns" | "phases">("general");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [boardType, setBoardType] = useState<BoardType>("activity");
  const [category, setCategory] = useState<BoardCategory>("club_related");
  const [coverColor, setCoverColor] = useState("#06b6d4");

  // Privacy & Exclusive Access
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [allowedMembers, setAllowedMembers] = useState<number[]>([]);

  // Permissions (Column Creation & Gantt Drag & Drop Edit Policy)
  const [columnPolicy, setColumnPolicy] = useState<"host_admin_only" | "specific_roles" | "specific_users" | "everyone">("everyone");
  const [allowedCreatorRoles, setAllowedCreatorRoles] = useState<string[]>(["officer", "admin"]);
  const [allowedCreatorUsers, setAllowedCreatorUsers] = useState<number[]>([]);

  const [ganttPolicy, setGanttPolicy] = useState<"host_admin_only" | "specific_roles" | "specific_users" | "everyone">("everyone");
  const [allowedGanttEditorRoles, setAllowedGanttEditorRoles] = useState<string[]>(["officer", "admin"]);
  const [allowedGanttEditorUsers, setAllowedGanttEditorUsers] = useState<number[]>([]);

  // Phases & Methodology
  const [methodology, setMethodology] = useState<"waterfall" | "agile" | "custom">("waterfall");
  const [phaseSettings, setPhaseSettings] = useState<Array<{ name: string; color: string }>>([
    { name: "Requirements & Planning", color: "#3b82f6" },
    { name: "Architecture & Design", color: "#8b5cf6" },
    { name: "Development & Implementation", color: "#06b6d4" },
    { name: "Testing & QA", color: "#f59e0b" },
    { name: "Deployment & Release", color: "#10b981" },
  ]);

  const [directoryMembers, setDirectoryMembers] = useState<CollaboratorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.error("Failed to load directory members:", err);
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
    const q = searchQuery.toLowerCase();
    return directoryMembers.filter((m) => m.name.toLowerCase().includes(q));
  }, [directoryMembers, searchQuery]);

  // If board is Private / Exclusive, restrict selectable members for Column/Gantt permissions to Owner & Permitted Members
  const accessibleMembers = useMemo(() => {
    if (visibility !== "private") return filteredMembers;
    const ownerId = user?.id;
    return filteredMembers.filter(
      (m) => (ownerId && m.id === ownerId) || allowedMembers.includes(m.id)
    );
  }, [filteredMembers, visibility, allowedMembers, user?.id]);

  // Clean up any selected creator or Gantt editor users if they are no longer permitted on private board
  useEffect(() => {
    if (visibility === "private") {
      const validIds = new Set([
        ...(user?.id ? [user.id] : []),
        ...allowedMembers,
      ]);
      setAllowedCreatorUsers((prev) => prev.filter((id) => validIds.has(id)));
      setAllowedGanttEditorUsers((prev) => prev.filter((id) => validIds.has(id)));
    }
  }, [visibility, allowedMembers, user?.id]);

  const sortedExclusiveMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aSel = allowedMembers.includes(a.id);
      const bSel = allowedMembers.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredMembers, allowedMembers]);

  const sortedCreatorUsers = useMemo(() => {
    return [...accessibleMembers].sort((a, b) => {
      const aSel = allowedCreatorUsers.includes(a.id);
      const bSel = allowedCreatorUsers.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [accessibleMembers, allowedCreatorUsers]);

  const sortedGanttEditorUsers = useMemo(() => {
    return [...accessibleMembers].sort((a, b) => {
      const aSel = allowedGanttEditorUsers.includes(a.id);
      const bSel = allowedGanttEditorUsers.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [accessibleMembers, allowedGanttEditorUsers]);

  const toggleMemberSelection = (userId: number) => {
    setAllowedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleCreatorRoleSelection = (roleId: string) => {
    setAllowedCreatorRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const toggleCreatorUserSelection = (userId: number) => {
    setAllowedCreatorUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleGanttRoleSelection = (roleId: string) => {
    setAllowedGanttEditorRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const toggleGanttUserSelection = (userId: number) => {
    setAllowedGanttEditorUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    if (category === "system" && !isAdmin) {
      setError("Only admins and superadmins can create System boards.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        type: boardType,
        category,
        cover_color: coverColor,
        visibility,
        allowed_members: visibility === "private" ? allowedMembers : [],
        column_creation_policy: columnPolicy,
        allowed_column_creator_roles: columnPolicy === "specific_roles" ? allowedCreatorRoles : [],
        allowed_column_creator_users: columnPolicy === "specific_users" ? allowedCreatorUsers : [],
        gantt_edit_policy: ganttPolicy,
        allowed_gantt_editor_roles: ganttPolicy === "specific_roles" ? allowedGanttEditorRoles : [],
        allowed_gantt_editor_users: ganttPolicy === "specific_users" ? allowedGanttEditorUsers : [],
        methodology,
        phase_settings: phaseSettings,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create board.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: General Details */}
      {activeTab === "general" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
              Board Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              required
              placeholder={
                boardType === "ideas"
                  ? "e.g. Feature & Website Ideas"
                  : boardType === "brainstorming"
                  ? "e.g. Hackathon Brainstorming"
                  : boardType === "roadmap"
                  ? "e.g. Q3/Q4 Project Roadmap"
                  : "e.g. Cybersecurity Week 2026"
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
              Description & Objective
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Describe the purpose, scope, or target goals of this board..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                Board Format
              </label>
              <select
                value={boardType}
                onChange={(e) => {
                  const newType = e.target.value as BoardType;
                  setBoardType(newType);
                  const preset = BOARD_TYPES.find((b) => b.id === newType);
                  if (preset) setCoverColor(preset.accentColor);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all cursor-pointer"
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
                onChange={(e) => setCategory(e.target.value as BoardCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all cursor-pointer"
              >
                <option value="club_related">🎓 Club Related</option>
                <option value="projects_tech">💻 Projects & Tech</option>
                <option value="events_social">🚀 Events & Socials</option>
                <option value="others">💡 Others</option>
                {isAdmin && <option value="system">🛡️ System (Admin Only)</option>}
              </select>
            </div>
          </div>

          {/* Board Format Visual Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
              Choose Board Style Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BOARD_TYPES.map((bt) => {
                const IconComponent = bt.icon;
                const isSelected = boardType === bt.id;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => {
                      setBoardType(bt.id);
                      setCoverColor(bt.accentColor);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-md shadow-primary/5"
                        : "bg-surface-800/60 border-border/70 hover:border-border hover:bg-surface-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div
                        className={`p-1.5 rounded-lg border flex items-center justify-center ${
                          isSelected
                            ? "bg-primary/20 border-primary/30 text-primary"
                            : "bg-surface-900 border-border text-text-muted"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-surface-900 text-text-muted border-border"
                        }`}
                      >
                        {bt.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{bt.label}</h4>
                      <p className="text-[11px] text-text-muted leading-tight mt-0.5 line-clamp-2">
                        {bt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cover Color Picker */}
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Cover Color Accent
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {COVER_GRADIENTS.map((g) => (
                <button
                  key={g.color}
                  type="button"
                  onClick={() => setCoverColor(g.color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                    coverColor === g.color
                      ? "border-white scale-110 shadow-md ring-2 ring-primary/40"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: g.color }}
                  title={g.name}
                />
              ))}
              <div className="flex items-center gap-2 ml-1">
                <input
                  type="color"
                  value={coverColor}
                  onChange={(e) => setCoverColor(e.target.value)}
                  className="w-8 h-8 rounded-xl bg-surface-800 border border-border cursor-pointer p-0.5"
                  title="Custom Color Picker"
                />
                <span className="text-xs font-mono font-bold text-text-muted">{coverColor}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Privacy & Access */}
      {activeTab === "privacy" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Board Visibility & Access Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setVisibility("public")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  visibility === "public"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs">Public Board</span>
                  </div>
                  {visibility === "public" && <Check className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-[11px] text-text-muted">
                  Open to all registered club members.
                </p>
              </label>

              <label
                onClick={() => setVisibility("private")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  visibility === "private"
                    ? "bg-rose-500/10 border-rose-500 text-rose-300"
                    : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-xs">Private / Exclusive</span>
                  </div>
                  {visibility === "private" && <Check className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-[11px] text-text-muted">
                  Restricted exclusively to explicitly invited members & admins.
                </p>
              </label>
            </div>
          </div>

          {/* Exclusive Allowed Members Picker */}
          {visibility === "private" && (
            <div className="p-3.5 rounded-xl bg-surface-800/50 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                  Permitted Exclusive Members ({allowedMembers.length})
                </label>
                <span className="text-[10px] text-text-muted">Search directory to invite</span>
              </div>

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

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {isLoadingDirectory ? (
                  <p className="text-xs text-text-muted italic py-3 text-center">Loading members directory...</p>
                ) : sortedExclusiveMembers.length === 0 ? (
                  <p className="text-xs text-text-muted italic py-3 text-center">No members found.</p>
                ) : (
                  sortedExclusiveMembers.map((member) => {
                    const isSelected = allowedMembers.includes(member.id);
                    return (
                      <div
                        key={`priv-${member.id}`}
                        onClick={() => toggleMemberSelection(member.id)}
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

      {/* Tab 3: Column Controls & Gantt Permissions */}
      {activeTab === "columns" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Column Creation Policy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                Column Creation Policy
              </label>
              <span className="text-[10px] text-text-muted">Controls who can add new columns</span>
            </div>

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

            {columnPolicy === "specific_roles" && (
              <div className="p-3 rounded-xl bg-surface-800/50 border border-border/50 space-y-2">
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                  Select Roles Permitted to Create Columns
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {AVAILABLE_ROLES.map((role) => {
                    const isChecked = allowedCreatorRoles.includes(role.id);
                    return (
                      <label
                        key={`col-role-${role.id}`}
                        onClick={() => toggleCreatorRoleSelection(role.id)}
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

            {columnPolicy === "specific_users" && (
              <div className="p-3.5 rounded-xl bg-surface-800/50 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                    Select Permitted Column Creators ({allowedCreatorUsers.length})
                  </label>
                  <span className="text-[10px] text-text-muted">Search directory to permit users</span>
                </div>

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

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {sortedCreatorUsers.map((member) => {
                    const isSelected = allowedCreatorUsers.includes(member.id);
                    return (
                      <div
                        key={`col-usr-${member.id}`}
                        onClick={() => toggleCreatorUserSelection(member.id)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                            : "bg-surface-800/70 border-border/50 text-text-secondary hover:bg-surface-800"
                        }`}
                      >
                        <span className="truncate">{member.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Gantt Chart Drag-and-Drop & Editing Policy (Only visible for Project Roadmap boards) */}
          {boardType === "roadmap" && (
            <>
              <div className="pt-3 border-t border-border/60" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                    Gantt Chart Drag-and-Drop & Editing Policy
                  </label>
                  <span className="text-[10px] text-text-muted">Controls who can reorder tasks, shift dates & edit phases</span>
                </div>

                <div className="space-y-2">
                  <label
                    onClick={() => setGanttPolicy("everyone")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      ganttPolicy === "everyone"
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="font-bold">🌐 Everyone (All Board Members)</div>
                      <div className="text-[11px] font-normal text-text-muted">
                        Any member with board access can drag & drop, resize timeline dates, and edit phases.
                      </div>
                    </div>
                    {ganttPolicy === "everyone" && <Check className="w-4 h-4 text-primary" />}
                  </label>

                  <label
                    onClick={() => setGanttPolicy("host_admin_only")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      ganttPolicy === "host_admin_only"
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="font-bold">🛡️ Host & Admins Only</div>
                      <div className="text-[11px] font-normal text-text-muted">
                        Only board creator and site administrators can drag & drop or edit Gantt items.
                      </div>
                    </div>
                    {ganttPolicy === "host_admin_only" && <Check className="w-4 h-4 text-primary" />}
                  </label>

                  <label
                    onClick={() => setGanttPolicy("specific_roles")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      ganttPolicy === "specific_roles"
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="font-bold">🎓 Specific Roles Only</div>
                      <div className="text-[11px] font-normal text-text-muted">
                        Restrict Gantt drag-and-drop & editing to selected roles (e.g. Officers, Admins).
                      </div>
                    </div>
                    {ganttPolicy === "specific_roles" && <Check className="w-4 h-4 text-primary" />}
                  </label>

                  <label
                    onClick={() => setGanttPolicy("specific_users")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      ganttPolicy === "specific_users"
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-surface-800/60 border-border hover:bg-surface-800 text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="font-bold">👤 Specific Individuals (Users) Only</div>
                      <div className="text-[11px] font-normal text-text-muted">
                        Pick specific individual members permitted to edit & drag items in Gantt view.
                      </div>
                    </div>
                    {ganttPolicy === "specific_users" && <Check className="w-4 h-4 text-primary" />}
                  </label>
                </div>

                {ganttPolicy === "specific_roles" && (
                  <div className="p-3 rounded-xl bg-surface-800/50 border border-border/50 space-y-2">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                      Select Roles Permitted to Edit & Drag Gantt
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {AVAILABLE_ROLES.map((role) => {
                        const isChecked = allowedGanttEditorRoles.includes(role.id);
                        return (
                          <label
                            key={`gantt-role-${role.id}`}
                            onClick={() => toggleGanttRoleSelection(role.id)}
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

                {ganttPolicy === "specific_users" && (
                  <div className="p-3.5 rounded-xl bg-surface-800/50 border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                        Select Permitted Gantt Editors ({allowedGanttEditorUsers.length})
                      </label>
                      <span className="text-[10px] text-text-muted">Search directory to permit users</span>
                    </div>

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
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {sortedGanttEditorUsers.map((member) => {
                        const isSelected = allowedGanttEditorUsers.includes(member.id);
                        return (
                          <div
                            key={`gantt-usr-${member.id}`}
                            onClick={() => toggleGanttUserSelection(member.id)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                                : "bg-surface-800/70 border-border/50 text-text-secondary hover:bg-surface-800"
                            }`}
                          >
                            <span className="truncate">{member.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 4: Phases & Methodology */}
      {activeTab === "phases" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
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

          <div className="p-3.5 rounded-xl bg-surface-800/60 border border-border/60 space-y-2">
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
                className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-650 text-text-primary text-[11px] font-semibold border border-border transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Waterfall SDLC (5 Phases)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethodology("agile");
                  setPhaseSettings([
                    { name: "Sprint 1", color: "#06b6d4" },
                    { name: "Sprint 2", color: "#3b82f6" },
                    { name: "Sprint 3", color: "#8b5cf6" },
                    { name: "Release v1.0", color: "#10b981" },
                    { name: "Backlog", color: "#64748b" },
                  ]);
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-650 text-text-primary text-[11px] font-semibold border border-border transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Agile Sprints (3 Sprints + Release)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Mobile BottomSheet for smaller screens
  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title="Create New Board"
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
              form="create-board-mobile-form"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 py-3 px-5 rounded-xl bg-primary text-surface-950 text-sm font-extrabold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/25 active:scale-98"
            >
              <Check className="w-4 h-4 text-surface-950" />
              <span>{isSubmitting ? "Creating..." : "Create Board"}</span>
            </button>
          </div>
        }
      >
        <form id="create-board-mobile-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-surface-950/60 rounded-xl border border-border/60 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "general"
                  ? "bg-surface-800 text-text-primary shadow-sm border border-border/80"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-primary" />
              <span>General</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "privacy"
                  ? "bg-surface-800 text-text-primary shadow-sm border border-border/80"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-accent" />
              <span>Privacy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("columns")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "columns"
                  ? "bg-surface-800 text-text-primary shadow-sm border border-border/80"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Columns</span>
            </button>

            {boardType === "roadmap" && (
              <button
                type="button"
                onClick={() => setActiveTab("phases")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "phases"
                    ? "bg-surface-800 text-text-primary shadow-sm border border-border/80"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Phases & Sprints</span>
              </button>
            )}
          </div>

          <div className="py-1">{formContent}</div>
        </form>
      </BottomSheet>
    );
  }

  // Render Desktop Dual-Panel Modal Layout (Identical to BoardSettingsModal)
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-3xl max-w-5xl w-full h-[700px] max-h-[92vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar Panel */}
        <div className="w-full md:w-72 bg-surface-900/90 border-b md:border-b-0 md:border-r border-border/80 p-6 flex flex-col justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Kanban className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-text-primary">Create Board</h2>
              <span className="text-text-muted hover:text-text-primary cursor-pointer p-0.5" title="Configure board details">
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              Setup board details, privacy rules, column permissions, and dynamic phase/sprint settings.
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
                  <span>Column & Gantt Controls</span>
                </div>
              </button>

              {boardType === "roadmap" && (
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
                {activeTab === "columns" && "Column & Gantt Permissions"}
                {activeTab === "phases" && "Phases & Sprints Manager"}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {activeTab === "general" && "Basic board details, type format, category, and visual cover color"}
                {activeTab === "privacy" && "Manage board visibility and permitted exclusive collaborators"}
                {activeTab === "columns" && "Define who is allowed to create columns and drag/edit items in Gantt"}
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

          {/* Docked Action Footer */}
          <div className="p-4 px-6 border-t border-border/60 bg-surface-900/90 backdrop-blur-md flex items-center justify-end gap-3 flex-shrink-0 w-full">
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
                <span>Creating Board...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Board</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
