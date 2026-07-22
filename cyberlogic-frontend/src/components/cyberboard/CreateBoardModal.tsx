import React, { useState } from "react";
import { X, Kanban } from "lucide-react";

interface CreateBoardModalProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    cover_color?: string;
  }) => Promise<void>;
}

const COVER_GRADIENTS = [
  { name: "Cyan Cyber", color: "#06b6d4" },
  { name: "Emerald Tech", color: "#10b981" },
  { name: "Amber Glow", color: "#f59e0b" },
  { name: "Purple Neon", color: "#8b5cf6" },
  { name: "Rose Pulse", color: "#ec4899" },
  { name: "Royal Blue", color: "#3b82f6" },
];

export default function CreateBoardModal({ onClose, onSubmit }: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState("#06b6d4");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a board title.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        cover_color: coverColor,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create project board.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Kanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Create New Activity Board
              </h2>
              <p className="text-xs text-text-muted">
                Setup a new collaborative planner for your project
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Project / Board Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cybersecurity Week 2026"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Board Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the main goal or scope of this activity board..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Cover Accent Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COVER_GRADIENTS.map((g) => (
                <button
                  key={g.color}
                  type="button"
                  onClick={() => setCoverColor(g.color)}
                  className={`h-8 rounded-xl border-2 transition-all cursor-pointer ${
                    coverColor === g.color
                      ? "border-white scale-110 shadow-md"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: g.color }}
                  title={g.name}
                />
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-surface-950 font-bold text-xs hover:bg-primary-light disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-primary/20"
            >
              {isSubmitting ? "Creating..." : "Create Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
