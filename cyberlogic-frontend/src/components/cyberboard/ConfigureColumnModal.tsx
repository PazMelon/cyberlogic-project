import React, { useState, useEffect, useMemo } from "react";
import { Settings, X, Lock, ShieldCheck, Users, Check, UserPlus, Search } from "lucide-react";
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
          // Merge with collaboratorsList to avoid missing active users
          const mergedMap = new Map<number, CollaboratorOption>();
          directoryOptions.forEach((m) => mergedMap.set(m.id, m));
          collaboratorsList.forEach((m) => {
            if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
          });
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
  }, [collaboratorsList]);

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
      {/* Exclusive Private Board Column Disclaimer */}
      {boardVisibility === "private" && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-amber-300 text-xs font-semibold">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Exclusive Private Board Column Settings — Permissions apply to invited members only.</span>
        </div>
      )}

      {/* Title & Accent Color */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-text-muted">
            Column Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:border-primary focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted">
            Accent Color
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-9 p-1 rounded-xl bg-surface-800 border border-border cursor-pointer"
          />
        </div>
      </div>

      {/* Gantt Roadmap View Status Category Mapping */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
          Gantt Chart Status Mapping
        </label>
        <p className="text-[11px] text-text-muted">
          Choose what status tasks in this column will be marked with in the Gantt Roadmap View & Excel exports:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: "not_started", label: "Not Started / To Do", color: "#fef08a", bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
            { id: "in_progress", label: "In Progress / Active", color: "#65a30d", bg: "bg-lime-500/10 border-lime-500/30 text-lime-400" },
            { id: "under_review", label: "Under Review / QA", color: "#06b6d4", bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" },
            { id: "completed", label: "Completed / Done", color: "#16a34a", bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
            { id: "blocked", label: "Blocked / On Hold", color: "#ea580c", bg: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusType(st.id)}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                statusType === st.id
                  ? `${st.bg} border-2 font-bold shadow-xs`
                  : "bg-surface-800/50 border-border/60 text-text-secondary hover:text-text-primary hover:bg-surface-800"
              }`}
            >
              <span className="truncate">{st.label}</span>
              {statusType === st.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Access Control */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
          Who can drag cards into this column?
        </label>

        <div className="space-y-2">
          {/* Option 1: All Private Board Members or Everyone */}
          <button
            type="button"
            onClick={() => setPermissionMode("everyone")}
            className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              permissionMode === "everyone"
                ? "bg-primary/10 border-primary/40 text-text-primary"
                : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
            }`}
          >
            <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  {boardVisibility === "private" ? "All Private Board Members" : "Everyone (All Club Members)"}
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
                ? "bg-primary/10 border-primary/40 text-text-primary"
                : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  {boardVisibility === "private" ? "Private Board Host Only (Strict Lock)" : "Board Host & Admins Only"}
                </span>
                {permissionMode === "host_admin" && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                {boardVisibility === "private"
                  ? "Only the creator of this private board can move cards into this stage (ideal for host review & verification)."
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
                  ? "bg-primary/10 border-primary/40 text-text-primary"
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

          {/* Option 4: Specific Private Board Members / Custom Members */}
          <button
            type="button"
            onClick={() => setPermissionMode("custom")}
            className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              permissionMode === "custom"
                ? "bg-primary/10 border-primary/40 text-text-primary"
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

        {/* Individual Member Selector */}
        {permissionMode === "custom" && (
          <div className="p-3.5 rounded-xl bg-surface-950/60 border border-border/60 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary block">
                Select Permitted Members
              </span>
              <span className="text-[11px] font-semibold text-primary">
                {selectedUserIds.length} {selectedUserIds.length === 1 ? "member" : "members"} selected
              </span>
            </div>

            {/* Member Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all members by name..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-800 border border-border/80 text-xs text-text-primary focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
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
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/15 border-primary/40 text-text-primary font-semibold"
                          : "bg-surface-800/50 border-border/40 text-text-muted hover:text-text-primary hover:bg-surface-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={
                            member.avatar ||
                            "https://api.dicebear.com/9.x/avataaars/svg?seed=user"
                          }
                          alt={member.name}
                          className="w-5 h-5 rounded-full border border-border object-cover flex-shrink-0"
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

      {/* Action CTAs */}
      {!isMobile && (
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
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
            className="px-4 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
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
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="configure-column-form"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        }
      >
        {formBody}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-text-primary">
              Column Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formBody}
      </div>
    </div>
  );
}
