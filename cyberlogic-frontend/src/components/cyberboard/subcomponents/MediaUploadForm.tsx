import React from "react";
import { Link2, UploadCloud, Loader2 } from "lucide-react";

interface MediaUploadFormProps {
  showAddForm: "link" | "upload" | null;
  setShowAddForm: (mode: "link" | "upload" | null) => void;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newUrl: string;
  setNewUrl: (val: string) => void;
  newDescription: string;
  setNewDescription: (val: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  isSubmitting: boolean;
  onAddLinkSubmit: (e: React.FormEvent) => void;
  onUploadFileSubmit: (e: React.FormEvent) => void;
}

export const MediaUploadForm: React.FC<MediaUploadFormProps> = ({
  showAddForm,
  setShowAddForm,
  newTitle,
  setNewTitle,
  newUrl,
  setNewUrl,
  newDescription,
  setNewDescription,
  selectedFile,
  setSelectedFile,
  isSubmitting,
  onAddLinkSubmit,
  onUploadFileSubmit,
}) => {
  if (!showAddForm) return null;

  if (showAddForm === "link") {
    return (
      <form onSubmit={onAddLinkSubmit} className="p-4 rounded-2xl bg-surface-900 border border-primary/40 space-y-3 mb-4 animate-in fade-in zoom-in-95 duration-150">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-primary" />
          <span>Add External Link Asset</span>
        </h4>

        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">Asset Title *</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            placeholder="e.g. Figma Design System"
            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">URL Link *</label>
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
            placeholder="https://figma.com/file/..."
            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">Description (Optional)</label>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Short notes about this resource..."
            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowAddForm(null)}
            className="px-3 py-1.5 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newTitle.trim() || !newUrl.trim() || isSubmitting}
            className="px-4 py-1.5 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light flex items-center gap-1.5 disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Save Link</span>
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onUploadFileSubmit} className="p-4 rounded-2xl bg-surface-900 border border-cyan-500/40 space-y-3 mb-4 animate-in fade-in zoom-in-95 duration-150">
      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
        <UploadCloud className="w-4 h-4 text-cyan-400" />
        <span>Upload General File Asset</span>
      </h4>

      <div>
        <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">Select File *</label>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setSelectedFile(file);
            if (file && !newTitle) setNewTitle(file.name);
          }}
          required
          className="w-full text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-surface-800 file:text-primary hover:file:bg-surface-700 cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">Asset Title (Optional)</label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Defaults to filename..."
          className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowAddForm(null)}
          className="px-3 py-1.5 rounded-xl border border-border text-text-muted hover:text-text-primary text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!selectedFile || isSubmitting}
          className="px-4 py-1.5 rounded-xl bg-cyan-400 text-surface-950 text-xs font-bold hover:bg-cyan-300 flex items-center gap-1.5 disabled:opacity-40"
        >
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          <span>Upload File</span>
        </button>
      </div>
    </form>
  );
};

export default MediaUploadForm;
