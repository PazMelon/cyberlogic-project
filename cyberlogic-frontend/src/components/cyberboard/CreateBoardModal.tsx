import React, { useState } from "react";
import { X, Kanban, Calendar, Lightbulb, Brain, Rocket } from "lucide-react";

export type BoardType = "activity" | "ideas" | "brainstorming" | "roadmap";

interface CreateBoardModalProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    type?: BoardType;
    cover_color?: string;
  }) => Promise<void>;
}

const BOARD_TYPES: {
  id: BoardType;
  label: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}[] = [
  {
    id: "activity",
    label: "Activity Board",
    badge: "Scheduled Events",
    description: "Plan events and club activities with start & end dates",
    icon: Calendar,
    accentColor: "#06b6d4",
  },
  {
    id: "ideas",
    label: "Idea Box Board",
    badge: "Ideas Only (No Date)",
    description: "Collect member suggestions, feature requests & feedback",
    icon: Lightbulb,
    accentColor: "#f59e0b",
  },
  {
    id: "brainstorming",
    label: "Brainstorming",
    badge: "Collab Ideation",
    description: "Collaborative workshops, team concepts & open discussions",
    icon: Brain,
    accentColor: "#8b5cf6",
  },
  {
    id: "roadmap",
    label: "Project Roadmap",
    badge: "Milestones & Target Dates",
    description: "Track initiative milestones, deliverables & release goals",
    icon: Rocket,
    accentColor: "#10b981",
  },
];

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
  const [boardType, setBoardType] = useState<BoardType>("activity");
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
        type: boardType,
        cover_color: coverColor,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create board.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Kanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Create Board
              </h2>
              <p className="text-xs text-text-muted">
                Setup a new collaborative board for your project or ideas
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium">
              {error}
            </div>
          )}

          {/* Board Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Select Board Type <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BOARD_TYPES.map((bt) => {
                const IconComponent = bt.icon;
                const isSelected = boardType === bt.id;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => {
                      setBoardType(bt.id);
                      setCoverColor(bt.accentColor);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-md shadow-primary/5"
                        : "bg-surface-800/60 border-border/70 hover:border-border hover:bg-surface-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div
                        className={`p-1.5 rounded-lg border flex items-center justify-center ${
                          isSelected
                            ? "bg-primary/20 border-primary/30 text-primary"
                            : "bg-surface-900 border-border text-text-muted"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-surface-900 text-text-muted border-border"
                        }`}
                      >
                        {bt.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-text-primary">
                        {bt.label}
                      </h4>
                      <p className="text-[11px] text-text-muted leading-tight mt-0.5 line-clamp-2">
                        {bt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Board Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                boardType === "ideas"
                  ? "e.g. Club Feature & Website Ideas"
                  : boardType === "brainstorming"
                  ? "e.g. Hackathon Topic Brainstorming"
                  : boardType === "roadmap"
                  ? "e.g. Q3/Q4 Project Roadmap"
                  : "e.g. Cybersecurity Week 2026"
              }
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
              placeholder={
                boardType === "ideas"
                  ? "Describe the purpose of this idea submission box..."
                  : "Describe the main goal or scope of this board..."
              }
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
          <div className="pt-4 border-t border-border flex justify-end gap-2 flex-shrink-0">
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
