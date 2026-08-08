import React from "react";
import { User, Flag, Layers, Clock, Tag, Check } from "lucide-react";
import type { CyberboardCard } from "../../../utils/api";
import SearchableAssigneePicker from "../SearchableAssigneePicker";
import SearchableTaskPicker from "../SearchableTaskPicker";
import ColorPicker from "../ui/ColorPicker";
import DescriptionRichEditor from "./DescriptionRichEditor";

interface CardEditFormProps {
  card: CyberboardCard;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editPriority: "low" | "medium" | "high";
  setEditPriority: (val: "low" | "medium" | "high") => void;
  editColorTag: string;
  setEditColorTag: (val: string) => void;
  editActivityDate: string;
  setEditActivityDate: (val: string) => void;
  editActivityEndDate: string;
  setEditActivityEndDate: (val: string) => void;
  editAssignedUserIds: number[];
  setEditAssignedUserIds: (val: number[]) => void;
  editPhase: string;
  setEditPhase: (val: string) => void;
  editPredecessorIds: number[];
  setEditPredecessorIds: (val: number[]) => void;
  editParentId: number | null;
  setEditParentId: (val: number | null) => void;
  isSavingEdit: boolean;
  boardType?: string;
  boardVisibility?: string;
  allowedMembers?: number[] | null;
  boardHostId?: number;
  safeBoardPhases: Array<{ name: string; color: string }>;
  allBoardCards: CyberboardCard[];
  isMobile: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CardEditForm: React.FC<CardEditFormProps> = ({
  card,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editPriority,
  setEditPriority,
  editColorTag,
  setEditColorTag,
  editActivityDate,
  setEditActivityDate,
  editActivityEndDate,
  setEditActivityEndDate,
  editAssignedUserIds,
  setEditAssignedUserIds,
  editPhase,
  setEditPhase,
  editPredecessorIds,
  setEditPredecessorIds,
  editParentId,
  setEditParentId,
  isSavingEdit,
  boardType = "activity",
  boardVisibility = "public",
  allowedMembers = [],
  boardHostId,
  safeBoardPhases,
  allBoardCards,
  isMobile,
  onCancel,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col justify-between h-full overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 p-6 overflow-y-auto scrollbar-thin flex-1">
        {/* Left Column: Title & Description */}
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div className="flex-shrink-0">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
              Card / Task Title *
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={200}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm font-semibold text-text-primary focus:border-primary focus:outline-none transition-all"
              placeholder="Task title..."
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex-shrink-0">
              Description & Details
            </label>
            <DescriptionRichEditor
              value={editDescription}
              onChange={setEditDescription}
              placeholder="Provide detailed context, instructions, or sub-task notes..."
            />
          </div>
        </div>

        {/* Right Column: Metadata Controls */}
        <div className="w-full md:w-80 space-y-4 bg-surface-900/60 p-4 rounded-2xl border border-border/60 flex-shrink-0 overflow-y-auto max-h-[70vh] scrollbar-thin">
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Assigned Members</span>
            </label>
            <SearchableAssigneePicker
              value={editAssignedUserIds}
              onChange={(uIds) => setEditAssignedUserIds(uIds)}
              boardVisibility={boardVisibility}
              allowedMembers={allowedMembers}
              boardHostId={boardHostId}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span>Task Priority</span>
            </label>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Project Phase / Sprint</span>
            </label>
            <select
              value={editPhase}
              onChange={(e) => setEditPhase(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="">No SDLC Phase Assigned</option>
              {safeBoardPhases.map((p, idx) => (
                <option key={`b-edit-phase-${idx}`} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Parent Task (Sub-Task Relationship)</span>
            </label>
            <SearchableTaskPicker
              value={editParentId}
              onChange={(id) => setEditParentId(id)}
              cards={allBoardCards}
              excludeCardId={card.id}
              emptyLabel="None (Top-Level Parent Task)"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Predecessor Tasks (Dependency Links)</span>
            </label>
            <SearchableTaskPicker
              value={editPredecessorIds}
              onChange={(ids) => setEditPredecessorIds(ids)}
              cards={allBoardCards}
              excludeCardId={card.id}
              emptyLabel="No Predecessors (Independent Task)"
              isMulti={true}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>Accent Tag Color</span>
            </label>
            <ColorPicker value={editColorTag} onChange={setEditColorTag} size="sm" />
          </div>

          {(boardType === "activity" || boardType === "roadmap") && (
            <div className="space-y-2 pt-1 border-t border-border/40">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={editActivityDate}
                  onChange={(e) => setEditActivityDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={editActivityEndDate}
                  onChange={(e) => setEditActivityEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!isMobile && (
        <div className="sticky bottom-0 z-30 p-4 px-6 border-t border-border/60 bg-surface-900/95 backdrop-blur-md flex items-center justify-end gap-2 flex-shrink-0 w-full shadow-lg">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!editTitle.trim() || isSavingEdit}
            className="px-5 py-2.5 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light flex items-center gap-1.5 shadow-sm shadow-primary/20 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{isSavingEdit ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      )}
    </form>
  );
};

export default CardEditForm;
