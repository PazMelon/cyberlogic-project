import { useState, useRef, useEffect } from "react";
import { X, Upload, Trash2, Link as LinkIcon } from "lucide-react";
import { uploadProjectImage, type UserProject } from "../../utils/api";
import { optimizeAndConvertToWebP } from "../../utils/imageOptimizer";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; link?: string; images?: string[] }) => Promise<void>;
  project?: UserProject | null;
}

export function ProjectFormModal({ isOpen, onClose, onSave, project }: ProjectFormModalProps) {
  const [title, setTitle] = useState(project?.title || "");
  const [description, setDescription] = useState(project?.description || "");
  const [link, setLink] = useState(project?.link || "");
  const [imagePaths, setImagePaths] = useState<string[]>(project?.images || []);
  const [imageUrls, setImageUrls] = useState<string[]>(project?.image_urls || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync form states with project prop when opening or switching projects
  useEffect(() => {
    if (isOpen) {
      setTitle(project?.title || "");
      setDescription(project?.description || "");
      setLink(project?.link || "");
      setImagePaths(project?.images || []);
      setImageUrls(project?.image_urls || []);
      setError(null);
    }
  }, [project, isOpen]);

  if (!isOpen) return null;


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 5 - imagePaths.length;
    if (remaining <= 0) {
      setError("Maximum 5 images per project.");
      return;
    }

    const toUpload = files.slice(0, remaining);
    setIsUploading(true);
    setError(null);

    try {
      for (const file of toUpload) {
        const optimized = await optimizeAndConvertToWebP(file);
        const dataURLtoFile = (dataurl: string, filename: string) => {
          const arr = dataurl.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1] || "image/webp";
          const bstr = atob(arr[arr.length - 1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          return new File([u8arr], filename, { type: mime });
        };
        const ext = file.type === "image/gif" ? "gif" : "webp";
        const processedFile = dataURLtoFile(optimized.dataUrl, `project.${ext}`);
        const result = await uploadProjectImage(processedFile);
        setImagePaths((prev) => [...prev, result.path]);
        setImageUrls((prev) => [...prev, result.url]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImagePaths((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        link: link.trim() || undefined,
        images: imagePaths,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md animate-dialog-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border bg-surface-900/90 glass p-6 animate-dialog-content border-border max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
            {project ? "Edit Project" : "Add Project"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium mb-4 animate-fadeIn">
            ✗ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Project" className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" required maxLength={255} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's this project about?" className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none text-xs" maxLength={5000} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5" /> Project URL
            </label>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://github.com/..." className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" />
          </div>

          {/* Image uploads */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary">
              Images ({imageUrls.length}/5)
            </label>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden aspect-square bg-surface-800 border border-border">
                    <img src={url} alt={`Project image ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-error text-white hover:bg-error-dark shadow-md transition-all cursor-pointer z-10"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imageUrls.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 text-xs font-semibold text-text-muted hover:text-text-primary transition-all cursor-pointer w-full justify-center disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? "Uploading..." : "Upload Image"}
              </button>
            )}

            <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleImageUpload} multiple className="hidden" />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary border border-border text-xs font-semibold transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer disabled:opacity-50">
              {isSaving ? "Saving..." : project ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
