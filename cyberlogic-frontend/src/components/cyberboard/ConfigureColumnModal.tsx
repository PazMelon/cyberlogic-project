import React, { useState } from "react";
import { Settings, X, Lock, ShieldCheck, Users, Check, UserPlus } from "lucide-react";
import type { CyberboardColumn } from "../../utils/api";

interface CollaboratorOption {
  id: number;
  name: string;
  avatar?: string | null;
}

interface ConfigureColumnModalProps {
  column: CyberboardColumn;
  collaboratorsList: CollaboratorOption[];
  onClose: () => void;
  onSubmit: (columnId: number, data: {
    title?: string;
    color?: string;
    allowed_roles?: string[] | null;
    allowed_users?: number[] | null;
  }) => Promise<void>;
}

export default function ConfigureColumnModal({
  column,
  collaboratorsList,
  onClose,
  onSubmit,
}: ConfigureColumnModalProps) {
  const [title, setTitle] = useState(column.title || "");
  const [color, setColor] = useState(column.color || "#06b6d4");
  
  // Permission presets: 'everyone' | 'host_admin' | 'officer_admin' | 'custom'
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border-t border-x sm:border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5 sm:space-y-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe Handle */}
        <div className="sm:hidden w-12 h-1 bg-text-muted/30 rounded-full mx-auto mb-1 flex-shrink-0 cursor-pointer" onClick={onClose} />
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-text-primary">
              Column Settings & Drag Restrictions
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Column Title & Color */}
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

              {/* Option 4: Custom / Individual Members */}
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

            {/* Individual Member Selector (When Custom mode is active) */}
            {permissionMode === "custom" && (
              <div className="p-3.5 rounded-xl bg-surface-950/60 border border-border/60 space-y-3 animate-in fade-in duration-200">
                <span className="text-xs font-bold text-text-secondary block">
                  Select Permitted Members:
                </span>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
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

          {/* Action CTAs */}
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
              {submitting ? "Saving..." : "Save Restrictions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
