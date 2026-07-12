import { useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import type { ChatMessage } from "./MessageBubble";

export interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletingMessage: ChatMessage | null;
  onConfirm: (reason: string) => void;
}

export default function DeleteMessageModal({
  isOpen,
  onClose,
  deletingMessage,
  onConfirm,
}: DeleteMessageModalProps) {
  const [deleteReason, setDeleteReason] = useState("");

  if (!isOpen || !deletingMessage) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteReason.trim()) return;
    onConfirm(deleteReason.trim());
    setDeleteReason("");
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-surface-900 border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fadeIn">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-error/10 border border-error/20">
            <ShieldAlert className="w-5 h-5 text-error" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Delete Message</h3>
            <p className="text-xs text-text-muted">This action will replace the message with a moderation notice.</p>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-surface-800 border border-border/50">
          <p className="text-xs text-text-muted mb-1">
            Message by <span className="font-semibold text-text-secondary">{deletingMessage.author}</span>:
          </p>
          <p className="text-xs text-text-secondary line-clamp-3 break-words">{deletingMessage.content}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Reason for deletion <span className="text-error">*</span>
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter the reason why this message is being removed..."
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface-800 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-error/50 focus:border-error/50 resize-none transition-all"
              rows={3}
              maxLength={500}
              autoFocus
            />
            <p className="text-[10px] text-text-muted mt-1 text-right">{deleteReason.length}/500</p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-surface-800 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!deleteReason.trim()}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-error border border-error/50 text-white hover:bg-error/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Delete Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
