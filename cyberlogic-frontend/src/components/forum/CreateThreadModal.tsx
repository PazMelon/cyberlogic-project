import { useState, useEffect } from "react";
import { X, MessageSquarePlus } from "lucide-react";
import { Button } from "../ui";
import type { ForumCategoryMapped } from "../../utils/api";

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ForumCategoryMapped[];
  onSubmit: (title: string, content: string, categoryDbId: number) => Promise<void>;
}

export function CreateThreadModal({
  isOpen,
  onClose,
  categories,
  onSubmit
}: CreateThreadModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryDbId, setCategoryDbId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default category to first database category when open
  useEffect(() => {
    if (isOpen && categories.length > 0) {
      setCategoryDbId(categories[0].dbId);
    }
  }, [isOpen, categories]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryDbId) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(title, content, Number(categoryDbId));
      setTitle("");
      setContent("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create thread.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg glass border border-border/80 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-base font-semibold text-text-primary font-[family-name:var(--font-heading)]">
              Create New Thread
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-error/15 text-error rounded-xl border border-error/30">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Category</label>
            <select
              value={categoryDbId}
              onChange={(e) => setCategoryDbId(e.target.value ? Number(e.target.value) : "")}
              required
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.dbId} value={cat.dbId}>
                  {cat.name} {cat.type === "support" ? "(Q&A)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Title</label>
            <input
              type="text"
              placeholder="What is your thread about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Content</label>
            <textarea
              placeholder="Share details, snippets, or ask your question..."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full p-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || !categoryDbId || isSubmitting}
              variant="primary"
              className="px-5 py-2.5"
            >
              {isSubmitting ? "Publishing..." : "Publish Thread"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
