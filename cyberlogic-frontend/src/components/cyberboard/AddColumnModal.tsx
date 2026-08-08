import React, { useState } from "react";
import { Plus, X, Lock, ShieldCheck, Users, Check, UserPlus } from "lucide-react";
import { BottomSheet } from "../ui/BottomSheet";
import type { CollaboratorOption } from "./shared/cyberboardTypes";
import { useIsMobile } from "./shared/useIsMobile";

interface AddColumnModalProps {
  collaboratorsList?: CollaboratorOption[];
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    color?: string;
    status_type?: string | null;
    allowed_roles?: string[] | null;
    allowed_users?: number[] | null;
  }) => Promise<void>;
}

export default function AddColumnModal({
  collaboratorsList = [],
  onClose,
  onSubmit,
}: AddColumnModalProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#06b6d4");
  const [statusType, setStatusType] = useState<string>("not_started");
  const [permissionMode, setPermissionMode] = useState<string>("everyone");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isMobile = useIsMobile(640);

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

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

      await onSubmit({
        title: title.trim(),
        color,
        status_type: statusType,
        allowed_roles,
        allowed_users,
      });
      onClose();
    } catch (err) {
      console.error("Failed to add column:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formBody = (
    <form id="add-column-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Column Title & Color */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-text-muted">
            Column Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Ideas, Under Review, Approved, Done"
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
          Choose what status tasks created in this column will receive in the Gantt View & Excel exports:
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
          {/* Option 1: Everyone */}
          <button
            type="button"
            onClick={() => setPermissionMode("everyone")}
            className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              permissionMode === "everyone"
                ? "bg-primary/10 border-primary/40 text-text-primary"
                : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
            }`}
          >
            <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  Everyone (All Club Members)
                </span>
                {permissionMode === "everyone" && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                Any member can freely suggest or move cards into this column.
              </p>
            </div>
          </button>

          {/* Option 2: Board Host & Admins Only */}
          <button
            type="button"
            onClick={() => setPermissionMode("host_admin")}
            className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              permissionMode === "host_admin"
                ? "bg-primary/10 border-primary/40 text-text-primary"
                : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  Board Host & Admins Only
                </span>
                {permissionMode === "host_admin" && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                Ideal for "Under Review" or "Approved" columns. Standard members cannot drop cards here.
              </p>
            </div>
          </button>

          {/* Option 3: Officers & Admins Only */}
          <button
            type="button"
            onClick={() => setPermissionMode("officer_admin")}
            className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
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

          {/* Option 4: Custom / Individual Members */}
          <button
            type="button"
            onClick={() => setPermissionMode("custom")}
            className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              permissionMode === "custom"
                ? "bg-primary/10 border-primary/40 text-text-primary"
                : "bg-surface-800/40 border-border/60 text-text-muted hover:bg-surface-800"
            }`}
          >
            <UserPlus className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  Specific Individual Members
                </span>
                {permissionMode === "custom" && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                Pick specific individual members who are granted permission to drag into this column.
              </p>
            </div>
          </button>
        </div>

        {/* Individual Member Selector */}
        {permissionMode === "custom" && (
          <div className="p-3 rounded-xl bg-surface-950/60 border border-border/60 space-y-2 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-text-secondary block">
              Select Permitted Members:
            </span>

            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {collaboratorsList.map((member) => {
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
              })}
            </div>
          </div>
        )}
      </div>

      {!isMobile && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
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
            {submitting ? "Creating..." : "Create Column"}
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
        title="Add New Column"
        initialSnap="3/4"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold hover:bg-surface-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-column-form"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
            >
              {submitting ? "Creating..." : "Create Column"}
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
      <div className="bg-surface-900 border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Add New Kanban Column</span>
          </h2>
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
