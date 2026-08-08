import React, { useState } from "react";
import { CheckCircle2, Lock, Send, ShieldAlert, UserCheck } from "lucide-react";
import MentionText from "../MentionText";
import { getAvatarUrl } from "../../../utils/api";
import { formatDate } from "../shared/cyberboardUtils";

interface CardProgressNotesSectionProps {
  cardId: number;
  completionPercentage?: number;
  assignedUsers?: any[];
  currentUserId?: number;
  boardHostId?: number;
  cardUserId?: number;
  isAdmin?: boolean;
  checklist?: any[];
  onToggleChecklistItem?: (itemId: string) => void;
  progressComments?: any[];
  onAddComment?: (cardId: number, content: string) => Promise<void>;
}

export const CardProgressNotesSection: React.FC<CardProgressNotesSectionProps> = ({
  cardId,
  completionPercentage = 0,
  assignedUsers = [],
  currentUserId: _currentUserId,
  boardHostId: _boardHostId,
  cardUserId: _cardUserId,
  isAdmin: _isAdmin = false,
  checklist: _checklist = [],
  onToggleChecklistItem: _onToggleChecklistItem,
  progressComments = [],
  onAddComment,
}) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map Database Progress Comments into Notes Feed (Persisted permanently in Laravel MySQL Database!)
  const dbNotes = progressComments.map((cm: any) => {
    const commentUserId = cm.user_id || cm.user?.id;
    const authorObj = cm.user || assignedUsers.find((u: any) => Number(u.id) === Number(commentUserId));
    const authorName = authorObj
      ? `${authorObj.first_name || ""} ${authorObj.last_name || ""}`.trim() || authorObj.name || authorObj.username || "Member"
      : cm.first_name || cm.last_name
      ? `${cm.first_name || ""} ${cm.last_name || ""}`.trim()
      : cm.user_name || cm.author_name || cm.name || "Member";
    const authorAvatar = getAvatarUrl(authorObj?.avatar || cm.avatar || cm.user_avatar, authorName);

    return {
      id: cm.id,
      userName: authorName,
      userAvatar: authorAvatar,
      content: cm.content ? cm.content.replace(/^\[PROGRESS_NOTE\]:\s*/, "") : "",
      timestamp: formatDate(cm.created_at),
    };
  });

  const canPostNote = true;

  const handleAddWorkNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !canPostNote || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onAddComment) {
        // Persist to Laravel MySQL database via API
        await onAddComment(cardId, `[PROGRESS_NOTE]: ${newNote.trim()}`);
      }
      setNewNote("");
    } catch (err) {
      console.error("Failed to post progress work note to database:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 p-4">
      {/* Progress Metric Banner */}
      <div className="p-4 rounded-2xl bg-surface-800/80 border border-border/70 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Task Completion Status
          </span>
          <span className="text-sm font-black text-cyan-400">{completionPercentage}%</span>
        </div>

        <div className="h-2.5 w-full rounded-full bg-surface-900 border border-border/60 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Assignee Work Notes & Progress Feed Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            Progress & Assignee Notes ({dbNotes.length})
          </span>
          {!canPostNote && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Assignee Restricted
            </span>
          )}
        </div>

        {/* Input Form for Assignees */}
        {canPostNote ? (
          <form onSubmit={handleAddWorkNote} className="space-y-2">
            <textarea
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Post a progress note or milestone update (Assignees only)..."
              className="w-full p-3 rounded-2xl bg-surface-800/80 border border-border/70 text-xs text-text-primary focus:border-cyan-500 focus:outline-none resize-none scrollbar-thin"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newNote.trim() || isSubmitting}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>{isSubmitting ? "Saving Note..." : "Post Work Note"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 rounded-2xl bg-surface-800/40 border border-border/50 text-xs text-text-muted flex items-center gap-2 italic">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Only assigned members can post progress updates to this card.</span>
          </div>
        )}

        {/* Database Persisted Notes & Auto-Log Feed */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
          {dbNotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted italic bg-surface-800/30 rounded-2xl border border-border/40 p-4">
              No progress notes or checklist updates logged yet.
            </div>
          ) : (
            [...dbNotes].reverse().map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-1.5 shadow-xs transition-all hover:bg-purple-500/15"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={note.userAvatar}
                      alt={note.userName}
                      className="w-5 h-5 rounded-full object-cover border border-purple-500/40 flex-shrink-0"
                    />
                    <span className="text-xs font-black text-purple-900 dark:text-purple-100 truncate">
                      {note.userName}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold whitespace-nowrap">
                    {note.timestamp}
                  </span>
                </div>
                <div className="text-xs text-purple-950 dark:text-purple-200 font-medium leading-relaxed pl-7">
                  <MentionText content={note.content} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CardProgressNotesSection;
