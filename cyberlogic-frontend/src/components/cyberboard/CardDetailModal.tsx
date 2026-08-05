import React, { useState, useEffect } from "react";
import { X, ThumbsUp, Calendar, Send, Trash2, MessageSquare, History, Edit3, Check, Clock, User, Layers, Tag, Flag } from "lucide-react";
import type { CyberboardCard } from "../../utils/api";
import { BottomSheet } from "../ui/BottomSheet";
import MentionTextArea from "../ui/MentionTextArea";
import MentionText from "./MentionText";
import SearchableAssigneePicker from "./SearchableAssigneePicker";

interface CardDetailModalProps {
  card: CyberboardCard | null;
  allBoardCards?: CyberboardCard[];
  boardType?: string;
  boardVisibility?: string;
  allowedMembers?: number[] | null;
  boardPhases?: Array<{ name: string; color: string }>;
  currentUserId?: number;
  userRole?: string;
  boardHostId?: number;
  columnPermissions?: {
    allowed_roles?: string[] | null;
    allowed_users?: number[] | null;
  };
  isAdmin?: boolean;
  onClose: () => void;
  onVoteToggle: (cardId: number) => void;
  onAddComment: (cardId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onDeleteCard: (cardId: number) => void;
  onUpdateCard?: (cardId: number, data: Partial<CyberboardCard>) => Promise<void>;
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

export default function CardDetailModal({
  card,
  allBoardCards = [],
  boardType = "activity",
  boardVisibility = "public",
  allowedMembers = [],
  boardPhases = [],
  currentUserId,
  userRole,
  boardHostId,
  columnPermissions,
  isAdmin,
  onClose,
  onVoteToggle,
  onAddComment,
  onDeleteComment,
  onDeleteCard,
  onUpdateCard,
}: CardDetailModalProps) {
  const safeBoardPhases = boardPhases || [];

  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editColorTag, setEditColorTag] = useState<string>("#06b6d4");
  const [editActivityDate, setEditActivityDate] = useState<string>("");
  const [editActivityEndDate, setEditActivityEndDate] = useState<string>("");
  const [editAssignedUserIds, setEditAssignedUserIds] = useState<number[]>([]);
  const [editPhase, setEditPhase] = useState<string>("");
  const [editPredecessorId, setEditPredecessorId] = useState<number | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (card) {
      setEditTitle(card.title || "");
      setEditDescription(card.description || "");
      setEditPriority(card.priority || "medium");
      setEditColorTag(card.color_tag || "#06b6d4");
      setEditActivityDate(card.activity_date ? card.activity_date.split("T")[0] : "");
      setEditActivityEndDate(card.activity_end_date ? card.activity_end_date.split("T")[0] : "");
      const initialIds = card.assigned_user_ids && card.assigned_user_ids.length > 0
        ? card.assigned_user_ids
        : card.assigned_user_id
        ? [card.assigned_user_id]
        : [];
      setEditAssignedUserIds(initialIds);
      setEditPhase(card.phase || "");
      setEditPredecessorId(card.predecessor_id || null);
    }
  }, [card]);

  if (!card) return null;

  // Determine Column-Based Editing Permissions
  const isOwner = card.user_id === currentUserId;
  const isHost = boardHostId === currentUserId;
  const allowedRoles = columnPermissions?.allowed_roles || [];
  const allowedUsers = columnPermissions?.allowed_users || [];
  const hasColumnRestriction = allowedRoles.length > 0 || allowedUsers.length > 0;

  const canEditCard = (() => {
    if (isAdmin || isHost) return true;
    if (!hasColumnRestriction) return true; // No restriction on column, anyone can edit
    const roleAllowed = userRole && allowedRoles.includes(userRole);
    const userAllowed = currentUserId && allowedUsers.includes(currentUserId);
    return !!(roleAllowed || userAllowed);
  })();

  const canDeleteCard = isOwner || isHost || isAdmin;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(card.id, newComment.trim());
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCardEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !onUpdateCard || isSavingEdit) return;

    setIsSavingEdit(true);
    try {
      await onUpdateCard(card.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        assigned_user_id: editAssignedUserIds[0] || null,
        assigned_user_ids: editAssignedUserIds,
        priority: editPriority,
        phase: editPhase || null,
        predecessor_id: editPredecessorId || null,
        color_tag: editColorTag,
        activity_date: editActivityDate || null,
        activity_end_date: editActivityEndDate || null,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save card edits:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const rawComments = card.comments || [];
  const comments = rawComments.filter(
    (cm, index, self) => index === self.findIndex((c) => c.id === cm.id)
  );

  const activities = card.activities || [];
  const showDateSection = boardType !== "ideas" && boardType !== "brainstorming" && (card.activity_date || card.activity_end_date);

  // Sidepanel Component for Audit Logs
  const auditLogSidepanel = (
    <div className="w-full sm:w-80 bg-surface-900 border-t sm:border-t-0 sm:border-l border-border p-4 sm:p-5 flex flex-col h-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto flex-shrink-0 animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
        <div className="flex items-center gap-2 text-primary">
          <History className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Card Activity Audit Log</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
          {activities.length} logs
        </span>
      </div>

      <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
        Audit trail of card actions and updates. Excludes discussion comments.
      </p>

      <div className="space-y-4 flex-1">
        {activities.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Clock className="w-6 h-6 text-text-muted mx-auto opacity-50" />
            <p className="text-xs text-text-muted italic">No activity recorded yet.</p>
          </div>
        ) : (
          activities.map((act) => {
            const userName = act.user
              ? act.user.name || `${act.user.first_name || ""} ${act.user.last_name || ""}`.trim()
              : "Member";
            const userAvatar =
              act.user?.avatar ||
              "https://api.dicebear.com/9.x/avataaars/svg?seed=" + (act.user_id || "user");

            return (
              <div key={act.id} className="relative pl-5 pb-3 border-l-2 border-border/60 last:border-l-0 space-y-1 group">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary ring-4 ring-surface-900" />

                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-4 h-4 rounded-full border border-border object-cover flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold text-text-primary truncate">{userName}</span>
                  </div>
                  <span className="text-[9px] text-text-muted whitespace-nowrap">{formatDateTime(act.created_at)}</span>
                </div>

                {(() => {
                  const moveMatch = act.description.match(/Moved card from ['"](.+?)['"] to ['"](.+?)['"]/i);
                  if (moveMatch) {
                    const [, fromCol, toCol] = moveMatch;
                    return (
                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-text-primary pl-5.5 py-0.5">
                        <span className="text-text-muted">Moved from</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30 text-[11px]">
                          {fromCol}
                        </span>
                        <span className="text-purple-400 font-bold text-xs">➔</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 text-[11px]">
                          {toCol}
                        </span>
                      </div>
                    );
                  }
                  return <p className="text-xs text-text-secondary leading-snug pl-5.5 font-medium">{act.description}</p>;
                })()}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const modalBody = (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Edit Form Mode */}
      {isEditing ? (
        <form onSubmit={handleSaveCardEdits} className="flex-1 flex flex-col justify-between h-full overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 p-6 overflow-y-auto scrollbar-thin flex-1">
            {/* Left Column: Primary Content (Title & Description - Occupies Full Space) */}
            <div className="flex-1 flex flex-col space-y-4 min-h-0">
              <div className="flex-shrink-0">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                  Card / Task Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm font-semibold text-text-primary focus:border-primary focus:outline-none transition-all"
                  placeholder="Task title..."
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex-shrink-0">
                  Description & Details
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full flex-1 min-h-[200px] p-3.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none resize-none transition-all scrollbar-thin"
                  placeholder="Provide detailed context, instructions, or sub-task notes..."
                />
              </div>
            </div>

            {/* Right Column: Metadata & Controls Sidebar */}
            <div className="w-full md:w-80 space-y-4 bg-surface-900/60 p-4 rounded-2xl border border-border/60 flex-shrink-0">
              {/* Searchable Assignee Picker */}
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

              {/* Priority Dropdown */}
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

              {/* SDLC Phase / Sprint Selector */}
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

              {/* Predecessor / Dependency Task Selector */}
              <div>
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Predecessor Task (Dependency Link)</span>
                </label>
                <select
                  value={editPredecessorId || ""}
                  onChange={(e) => setEditPredecessorId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="">No Predecessor (Independent Task)</option>
                  {allBoardCards
                    .filter((c) => c.id !== card.id)
                    .map((otherCard) => (
                      <option key={`pred-opt-${otherCard.id}`} value={otherCard.id}>
                        {otherCard.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Color Tag Selector */}
              <div>
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Accent Tag Color</span>
                </label>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setEditColorTag(c)}
                      className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                        editColorTag === c ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-900 scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Date Schedule Pickers */}
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

          {/* Sticky Docked Edit Footer */}
          <div className="p-4 px-6 border-t border-border/60 bg-surface-900/90 backdrop-blur-md flex items-center justify-end gap-2 flex-shrink-0 w-full">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
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
        </form>
      ) : (
        /* View Mode: Original Clean Flow */
        <div className="space-y-6 overflow-y-auto p-6 flex-1 scrollbar-thin">
          {/* Metadata Bar (Assignee & Owner) */}
          <div className="p-3.5 rounded-xl bg-surface-800/50 border border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Assignees */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-text-muted font-medium">Assignees:</span>
              {card.assigned_users && card.assigned_users.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {card.assigned_users.map((u) => (
                    <div key={`view-assignee-${u.id}`} className="flex items-center gap-1.5 bg-surface-800 px-2.5 py-1 rounded-lg border border-border/80 text-text-primary text-xs font-bold shadow-xs">
                      <img
                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=06b6d4&color=fff`}
                        alt={u.first_name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{u.first_name} {u.last_name}</span>
                    </div>
                  ))}
                </div>
              ) : card.assigned_user ? (
                <div className="flex items-center gap-1.5 bg-surface-800 px-2.5 py-1 rounded-lg border border-border/80 text-text-primary text-xs font-bold shadow-xs">
                  <img
                    src={card.assigned_user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.assigned_user.first_name)}&background=06b6d4&color=fff`}
                    alt={card.assigned_user.first_name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{card.assigned_user.first_name} {card.assigned_user.last_name}</span>
                </div>
              ) : (
                <span className="text-text-muted italic">Unassigned</span>
              )}
            </div>

            {/* Created By */}
            <div className="flex items-center gap-2 text-text-muted">
              <span>Submitted by:</span>
              <span className="font-semibold text-text-primary">
                {card.user?.first_name ? `${card.user.first_name} ${card.user.last_name}` : "Member"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              {boardType === "ideas" || boardType === "brainstorming" ? "Description & Concept Details" : "Description & Details"}
            </h4>
            <div className="p-4 rounded-xl bg-surface-800/60 border border-border/50 text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {card.description ? <MentionText content={card.description} /> : <span className="text-text-muted italic">No detailed description provided.</span>}
            </div>
          </div>

          {/* Sub-Cards / Sub-Tasks Breakdown Checklist */}
          {card.sub_cards && card.sub_cards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  Sub-Tasks ({card.sub_cards.length})
                </h4>
              </div>
              <div className="space-y-1.5 bg-surface-800/40 p-3 rounded-xl border border-border/50">
                {card.sub_cards.map((subCard) => (
                  <div
                    key={subCard.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-800 border border-border/40 text-xs hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="font-medium text-text-primary">{subCard.title}</span>
                    </div>

                    {subCard.assigned_user && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        @{subCard.assigned_user.username || subCard.assigned_user.first_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Dates */}
          {showDateSection && (
            <div className="p-4 rounded-xl bg-surface-800/40 border border-border/50 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold uppercase tracking-wider">
                  {boardType === "roadmap" ? "Milestone Schedule:" : "Event Schedule:"}
                </span>
              </div>

              <div className="flex items-center gap-3 font-medium text-text-primary">
                {card.activity_date && <span>Start: {formatDate(card.activity_date)}</span>}
                {card.activity_end_date && <span>End: {formatDate(card.activity_end_date)}</span>}
              </div>
            </div>
          )}

          {/* Upvote CTA */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-text-primary">
                {boardType === "ideas" ? "Support this idea" : boardType === "brainstorming" ? "Support this topic" : "Support this suggestion"}
              </h4>
              <p className="text-xs text-text-muted">
                Upvote to let project leads and members know community interest level
              </p>
            </div>

            <button
              type="button"
              onClick={() => onVoteToggle(card.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                card.has_voted
                  ? "bg-primary text-surface-950 shadow-md shadow-primary/20 scale-105"
                  : "bg-surface-800 text-text-primary hover:bg-surface-700 border border-border"
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${card.has_voted ? "fill-surface-950" : ""}`} />
              <span>{card.votes_count || 0} Votes</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Comments ({comments.length})</span>
              </h4>
            </div>

            <form onSubmit={handleSubmitComment} className="flex gap-2.5 items-center">
              <MentionTextArea
                value={newComment}
                onValueChange={setNewComment}
                rows={1}
                containerClassName="flex-1 min-w-0"
                placeholder="Write a comment... (Use @ to mention @officers or members)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none transition-all resize-none min-h-[42px]"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-primary text-surface-950 font-bold text-xs hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-sm shadow-primary/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>

            <div className="space-y-3 min-h-[140px] max-h-[380px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-text-muted italic text-center py-6">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((cm) => {
                  const canDeleteCm = cm.user_id === currentUserId || isAdmin;
                  return (
                    <div
                      key={cm.id}
                      className="p-3.5 rounded-xl bg-surface-800/50 border border-border/40 space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={cm.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
                            alt={cm.user?.name || "User"}
                            className="w-5 h-5 rounded-full border border-border object-cover"
                          />
                          <span className="text-xs font-bold text-text-primary">{cm.user?.name || "Member"}</span>
                          <span className="text-[10px] text-text-muted">{formatDate(cm.created_at)}</span>
                        </div>

                        {canDeleteCm && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(cm.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error rounded-md transition-all cursor-pointer"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary leading-relaxed pl-7 whitespace-pre-wrap">
                        <MentionText content={cm.content} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Delete Card Button */}
          {canDeleteCard && (
            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => onDeleteCard(card.id)}
                className="px-3.5 py-2 rounded-xl text-error bg-error/10 hover:bg-error/20 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Card</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title={card.title}
        initialSnap="3/4"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => setShowAuditLog(!showAuditLog)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showAuditLog ? "bg-primary/20 border-primary text-primary" : "border-border text-text-muted"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({activities.length})</span>
            </button>

            {canEditCard && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs font-semibold text-text-primary flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "View Details" : "Edit Card"}</span>
              </button>
            )}
          </div>

          {showAuditLog ? auditLogSidepanel : modalBody}
        </div>
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-surface-900 border border-border rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isEditing
            ? "max-w-4xl h-[700px] max-h-[92vh]"
            : showAuditLog
            ? "max-w-4xl max-h-[90vh]"
            : "max-w-2xl max-h-[90vh]"
        }`}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-4 bg-surface-900/90 flex-shrink-0"
          style={{
            borderTopColor: card.color_tag || undefined,
            borderTopWidth: card.color_tag ? "4px" : undefined,
          }}
        >
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border inline-block ${
                  card.priority === "high"
                    ? "bg-error/15 text-error border-error/30"
                    : card.priority === "low"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                {card.priority || "medium"} priority
              </span>

              {card.phase && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  ⚡ {card.phase}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-text-primary truncate">
              {card.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Audit Log Sidepanel Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAuditLog(!showAuditLog)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showAuditLog
                  ? "bg-primary/20 border-primary/40 text-primary shadow-xs"
                  : "border-border text-text-muted hover:text-text-primary hover:bg-surface-800"
              }`}
              title="Toggle Card Audit Log Sidepanel"
            >
              <History className="w-4 h-4" />
              <span className="hidden xs:inline">Audit Log</span>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
                {activities.length}
              </span>
            </button>

            {/* Column-Based Edit Button */}
            {canEditCard && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditing
                    ? "bg-primary text-surface-950 font-bold"
                    : "border-border text-text-muted hover:text-text-primary hover:bg-surface-800"
                }`}
                title="Edit Card Details"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden xs:inline">{isEditing ? "View Details" : "Edit"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Layout with optional sidepanel */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          <div className="overflow-hidden flex-1 flex flex-col">{modalBody}</div>
          {showAuditLog && auditLogSidepanel}
        </div>
      </div>
    </div>
  );
}
