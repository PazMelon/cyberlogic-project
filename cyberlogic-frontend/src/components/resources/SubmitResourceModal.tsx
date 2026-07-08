import { useState, useEffect, useRef } from "react";
import { X, Upload, Link2, BookOpen } from "lucide-react";
import { Button } from "../ui";

interface SubmitResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function SubmitResourceModal({
  isOpen,
  onClose,
  onSubmit,
}: SubmitResourceModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"Tutorials" | "Documents" | "Tools" | "Links">("Tutorials");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setCategory("Tutorials");
      setLink("");
      setFile(null);
      setError(null);
    }
  }, [isOpen]);

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
    if (!title.trim() || !description.trim()) {
      setError("Please fill in the title and description.");
      return;
    }

    if (!link.trim() && !file) {
      setError("Please provide either a resource link or upload a file.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      if (link.trim()) {
        formData.append("link", link.trim());
      }
      if (file) {
        formData.append("file", file);
      }

      // Map categories to appropriate Lucide icons automatically
      let icon = "file-text";
      if (category === "Tools") icon = "terminal";
      else if (category === "Links") icon = "external-link";
      else if (category === "Tutorials") icon = "code";
      formData.append("icon", icon);

      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit resource.");
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
            <BookOpen className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-base font-semibold text-text-primary font-[family-name:var(--font-heading)]">
              Submit Resource
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

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Python Automation Scripts"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all select-none"
            >
              <option value="Tutorials">Tutorials</option>
              <option value="Documents">Documents</option>
              <option value="Tools">Tools</option>
              <option value="Links">Links</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the resource and how it benefits members..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">External Link (Optional)</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com/resource"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Upload File (Optional)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-surface-950/20 group flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
              <span className="text-xs text-text-secondary font-medium">
                {file ? file.name : "Drag & drop or click to choose a file"}
              </span>
              <span className="text-[10px] text-text-muted">Max size: 10MB</span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) setFile(selectedFile);
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/30">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold"
            >
              {isSubmitting ? "Submitting..." : "Submit Resource"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
