import React from "react";
import { ShieldCheck, Info, Check } from "lucide-react";
import type { CollaboratorOption } from "../shared/cyberboardTypes";
import RolePicker from "../ui/RolePicker";

interface BoardPermissionsPanelProps {
  columnPolicy: "host_admin_only" | "specific_roles" | "specific_users" | "everyone";
  setColumnPolicy: (p: "host_admin_only" | "specific_roles" | "specific_users" | "everyone") => void;
  allowedCreatorRoles: string[];
  setAllowedCreatorRoles: React.Dispatch<React.SetStateAction<string[]>>;
  allowedCreatorUsers: number[];
  setAllowedCreatorUsers: React.Dispatch<React.SetStateAction<number[]>>;
  ganttPolicy: "host_admin_only" | "specific_roles" | "specific_users" | "everyone";
  setGanttPolicy: (p: "host_admin_only" | "specific_roles" | "specific_users" | "everyone") => void;
  allowedGanttEditorRoles: string[];
  setAllowedGanttEditorRoles: React.Dispatch<React.SetStateAction<string[]>>;
  allowedGanttEditorUsers: number[];
  setAllowedGanttEditorUsers: React.Dispatch<React.SetStateAction<number[]>>;
  sortedCreatorUsers: CollaboratorOption[];
  sortedGanttEditorUsers: CollaboratorOption[];
  visibility: "public" | "private";
}

export const BoardPermissionsPanel: React.FC<BoardPermissionsPanelProps> = ({
  columnPolicy,
  setColumnPolicy,
  allowedCreatorRoles,
  setAllowedCreatorRoles,
  allowedCreatorUsers,
  setAllowedCreatorUsers,
  ganttPolicy,
  setGanttPolicy,
  allowedGanttEditorRoles,
  setAllowedGanttEditorRoles,
  allowedGanttEditorUsers,
  setAllowedGanttEditorUsers,
  sortedCreatorUsers,
  sortedGanttEditorUsers,
  visibility,
}) => {
  const toggleCreatorUserSelection = (userId: number) => {
    setAllowedCreatorUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleGanttUserSelection = (userId: number) => {
    setAllowedGanttEditorUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Column Creation Permissions */}
      <div className="space-y-3 p-4 rounded-2xl bg-surface-800/40 border border-border/50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Column Creation Permission
          </h4>
        </div>

        <select
          value={columnPolicy}
          onChange={(e) => setColumnPolicy(e.target.value as any)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none cursor-pointer"
        >
          <option value="everyone">
            {visibility === "private" ? "Everyone (All Allowed Board Members)" : "Everyone (All Club Members)"}
          </option>
          <option value="host_admin_only">Host & Admins Only</option>
          {visibility !== "private" && <option value="specific_roles">Specific Member Roles</option>}
          <option value="specific_users">Specific Individual Users</option>
        </select>

        {columnPolicy === "specific_roles" && visibility !== "private" && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-150">
            <RolePicker
              selectedRoles={allowedCreatorRoles}
              onChange={(roles) => setAllowedCreatorRoles(roles)}
            />
          </div>
        )}

        {columnPolicy === "specific_users" && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-150">
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {sortedCreatorUsers.map((member) => {
                const isSelected = allowedCreatorUsers.includes(member.id);
                return (
                  <div
                    key={`col-creator-${member.id}`}
                    onClick={() => toggleCreatorUserSelection(member.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 text-text-primary"
                        : "bg-surface-800/40 border-border/40 text-text-muted hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=06b6d4&color=fff`}
                        alt={member.name}
                        className="w-5 h-5 rounded-full object-cover border border-border/60"
                      />
                      <span className="font-semibold text-text-primary">{member.name}</span>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-primary text-surface-950 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Gantt Roadmap Edit Permissions */}
      <div className="space-y-3 p-4 rounded-2xl bg-surface-800/40 border border-border/50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Gantt Timeline Drag & Edit Permission
          </h4>
        </div>

        <select
          value={ganttPolicy}
          onChange={(e) => setGanttPolicy(e.target.value as any)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none cursor-pointer"
        >
          <option value="everyone">
            {visibility === "private" ? "Everyone (All Allowed Board Members)" : "Everyone (All Club Members)"}
          </option>
          <option value="host_admin_only">Host & Admins Only</option>
          {visibility !== "private" && <option value="specific_roles">Specific Member Roles</option>}
          <option value="specific_users">Specific Individual Users</option>
        </select>

        {ganttPolicy === "specific_roles" && visibility !== "private" && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-150">
            <RolePicker
              selectedRoles={allowedGanttEditorRoles}
              onChange={(roles) => setAllowedGanttEditorRoles(roles)}
            />
          </div>
        )}

        {ganttPolicy === "specific_users" && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-150">
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {sortedGanttEditorUsers.map((member) => {
                const isSelected = allowedGanttEditorUsers.includes(member.id);
                return (
                  <div
                    key={`gantt-editor-${member.id}`}
                    onClick={() => toggleGanttUserSelection(member.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 text-text-primary"
                        : "bg-surface-800/40 border-border/40 text-text-muted hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=06b6d4&color=fff`}
                        alt={member.name}
                        className="w-5 h-5 rounded-full object-cover border border-border/60"
                      />
                      <span className="font-semibold text-text-primary">{member.name}</span>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-primary text-surface-950 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl bg-surface-800/30 border border-border/40 text-[11px] text-text-muted flex items-start gap-2">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <span>
          Board Hosts and Admins always retain full management access regardless of selected policy.
        </span>
      </div>
    </div>
  );
};

export default BoardPermissionsPanel;
