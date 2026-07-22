import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface AddColumnModalProps {
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
}

export default function AddColumnModal({
  onClose,
  onSubmit,
}: AddColumnModalProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(title.trim());
      onClose();
    } catch (err) {
      console.error("Failed to add column:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Add New Column</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted">
              Column Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ideas & Proposals, Under Review, Done"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
        </form>
      </div>
    </div>
  );
}
