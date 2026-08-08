import React, { useState, useEffect, useMemo } from "react";
import { Settings, X, Trash2, Check, Layers, SlidersHorizontal, ShieldCheck, Lock, Info } from "lucide-react";
import { fetchDirectory, type CyberboardBoard, type DirectoryMember, type BoardCategory, type CyberboardCard } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";
import BoardPrivacyPanel from "./subcomponents/BoardPrivacyPanel";
import BoardPermissionsPanel from "./subcomponents/BoardPermissionsPanel";
import BoardPhaseEditor from "./subcomponents/BoardPhaseEditor";
import { PRESET_COLORS } from "./shared/cyberboardConstants";
import type { CollaboratorOption } from "./shared/cyberboardTypes";
import { useIsMobile } from "./shared/useIsMobile";

interface BoardSettingsModalProps {
  board: CyberboardBoard;
  currentUserId?: number;
  isAdmin?: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<CyberboardBoard>) => Promise<void>;
  onDeleteBoard?: (boardId: number) => void;
}

export default function BoardSettingsModal({
  board,
  currentUserId,
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

  const [ganttPolicy, setGanttPolicy] = useState<"host_admin_only" | "specific_roles" | "specific_users" | "everyone">(
    board.gantt_edit_policy || "everyone"
  );
  const [allowedGanttEditorRoles, setAllowedGanttEditorRoles] = useState<string[]>(
    board.allowed_gantt_editor_roles || ["officer", "admin"]
  );
  const [allowedGanttEditorUsers, setAllowedGanttEditorUsers] = useState<number[]>(
    board.allowed_gantt_editor_users || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phaseErrorMessage, setPhaseErrorMessage] = useState<string | null>(null);
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

  const isMobile = useIsMobile(640);

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

  const ownerId = board.created_by || currentUserId;

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return directoryMembers;
    const query = searchQuery.toLowerCase().trim();
    return directoryMembers.filter((m) => m.name.toLowerCase().includes(query));
  }, [directoryMembers, searchQuery]);

  // Count active cards assigned to each phase name for deletion safeguards
  const cardsInPhase = useMemo(() => {
    const map: Record<string, number> = {};
    const allCards: CyberboardCard[] = board.cards || (board.columns || []).flatMap((col) => col.cards || []);
    allCards.forEach((c) => {
      if (!c.is_archived && c.phase) {
        map[c.phase] = (map[c.phase] || 0) + 1;
      }
    });
    return map;
  }, [board.cards, board.columns]);

  // If board is Private / Exclusive, restrict selectable members for Column/Gantt permissions to Owner & Permitted Members
  const accessibleMembers = useMemo(() => {
    if (visibility !== "private") return filteredMembers;
    return filteredMembers.filter(
      (m) => (ownerId && m.id === ownerId) || allowedMembers.includes(m.id)
    );
  }, [filteredMembers, visibility, allowedMembers, ownerId]);

  // Clean up any selected creator or Gantt editor users if they are no longer permitted on private board
  useEffect(() => {
    if (visibility === "private") {
      if (columnPolicy === "specific_roles") setColumnPolicy("everyone");
      if (ganttPolicy === "specific_roles") setGanttPolicy("everyone");
      const validIds = new Set([
        ...(ownerId ? [ownerId] : []),
        ...allowedMembers,
      ]);
      setAllowedCreatorUsers((prev) => prev.filter((id) => validIds.has(id)));
      setAllowedGanttEditorUsers((prev) => prev.filter((id) => validIds.has(id)));
    }
  }, [visibility, allowedMembers, ownerId, columnPolicy, ganttPolicy]);

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
        gantt_edit_policy: ganttPolicy,
        allowed_gantt_editor_roles: ganttPolicy === "specific_roles" ? allowedGanttEditorRoles : [],
        allowed_gantt_editor_users: ganttPolicy === "specific_users" ? allowedGanttEditorUsers : [],
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
              maxLength={150}
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
              maxLength={1000}
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
                  className={`w-8 h-8 rounded-full transition-all cursor-pointer border border-white/10 ${
                    coverColor === c ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-900 scale-110 shadow-md" : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
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

      {/* Tab 2: Privacy & Exclusivity */}
      {activeTab === "privacy" && (
        <BoardPrivacyPanel
          visibility={visibility}
          setVisibility={setVisibility}
          allowedMembers={allowedMembers}
          setAllowedMembers={setAllowedMembers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isLoadingDirectory={isLoadingDirectory}
          sortedExclusiveMembers={sortedExclusiveMembers}
          ownerId={ownerId}
        />
      )}

      {/* Tab 3: Permissions & Access Control */}
      {activeTab === "columns" && (
        <BoardPermissionsPanel
          columnPolicy={columnPolicy}
          setColumnPolicy={setColumnPolicy}
          allowedCreatorRoles={allowedCreatorRoles}
          setAllowedCreatorRoles={setAllowedCreatorRoles}
          allowedCreatorUsers={allowedCreatorUsers}
          setAllowedCreatorUsers={setAllowedCreatorUsers}
          ganttPolicy={ganttPolicy}
          setGanttPolicy={setGanttPolicy}
          allowedGanttEditorRoles={allowedGanttEditorRoles}
          setAllowedGanttEditorRoles={setAllowedGanttEditorRoles}
          allowedGanttEditorUsers={allowedGanttEditorUsers}
          setAllowedGanttEditorUsers={setAllowedGanttEditorUsers}
          sortedCreatorUsers={sortedCreatorUsers}
          sortedGanttEditorUsers={sortedGanttEditorUsers}
          visibility={visibility}
        />
      )}

      {/* Tab 4: SDLC Phases & Methodology */}
      {activeTab === "phases" && (
        <BoardPhaseEditor
          methodology={methodology}
          setMethodology={setMethodology}
          phaseSettings={phaseSettings}
          setPhaseSettings={setPhaseSettings}
          cardsInPhase={cardsInPhase}
          phaseErrorMessage={phaseErrorMessage}
          setPhaseErrorMessage={setPhaseErrorMessage}
        />
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
          <div className="flex items-center justify-end gap-3 w-full">
            {onDeleteBoard && (
              <button
                type="button"
                onClick={() => onDeleteBoard(board.id)}
                className="px-3 py-3 rounded-xl text-error bg-error/10 hover:bg-error/20 border border-error/25 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete Board</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-border text-text-muted hover:text-text-primary text-sm font-semibold hover:bg-surface-800 transition-all cursor-pointer text-center active:scale-98"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="board-settings-mobile-form"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 py-3 px-5 rounded-xl bg-primary text-surface-950 text-sm font-extrabold hover:bg-primary-light transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/25 active:scale-98"
            >
              <Check className="w-4 h-4 text-surface-950" />
              <span>{isSubmitting ? "Saving..." : "Save Board"}</span>
            </button>
          </div>
        }
      >
        <form id="board-settings-mobile-form" onSubmit={handleSubmit} className="space-y-4">
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

            {type === "roadmap" && (
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in duration-200">
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
