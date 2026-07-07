import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Upload, 
  Sparkles,
  Info
} from "lucide-react";
import { fetchForumCategories, createForumThread, type ForumCategoryMapped } from "../utils/api";
import { Button } from "../components/ui";

export default function CreateThread() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ForumCategoryMapped[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const isSpoiler = false;
  const isRedacted = false;
  
  // Tab control: 'post' | 'images'
  const [activeTab, setActiveTab] = useState<"post" | "images">("post");
  
  // Selected files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Load categories
  useEffect(() => {
    async function loadCats() {
      try {
        setIsLoadingCats(true);
        const data = await fetchForumCategories();
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].dbId.toString()); // Default to first category
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        setErrorMsg("Failed to load forum categories.");
      } finally {
        setIsLoadingCats(false);
      }
    }
    loadCats();
  }, []);

  // Handle image files selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Max 5 images
    if (selectedFiles.length + files.length > 5) {
      alert("You can upload a maximum of 5 images.");
      return;
    }

    const newFiles = [...selectedFiles];
    const newPreviews = [...filePreviews];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed.");
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...filePreviews];
    
    // Revoke object URL to avoid leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Thread title is required.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Thread text content is required.");
      return;
    }
    if (!categoryId) {
      setErrorMsg("Please select a category.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      // Build Multipart Form Data (necessary for file uploads)
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("category_id", categoryId);
      formData.append("is_spoiler", isSpoiler ? "1" : "0");
      formData.append("is_redacted", isRedacted ? "1" : "0");
      
      selectedFiles.forEach((file) => {
        formData.append("images[]", file);
      });

      const newThread = await createForumThread(formData);
      navigate(`/app/forums/thread/${newThread.id}`);
    } catch (err: any) {
      console.error("Failed to create thread:", err);
      setErrorMsg(err.message || "Failed to create thread. Check file sizes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          to="/app/forums"
          className="p-2 rounded-xl bg-white/5 border border-border/40 text-text-secondary hover:text-text-primary hover:border-border/60 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            Create a New Thread
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Share ideas, CTF guides, or request support in the Cyberlogic community.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Form container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-2xl p-5 border border-border/30 space-y-5">
          {/* Category Select & Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-[family-name:var(--font-heading)]">
                Category Slug
              </label>
              {isLoadingCats ? (
                <div className="h-10 rounded-xl bg-surface-900/40 border border-border/20 animate-pulse" />
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-950 border border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-text-primary text-sm font-semibold transition-all"
                >
                  {categories.map((c) => (
                    <option key={c.dbId} value={c.dbId}>
                      {c.name} ({c.type === "support" ? "Support Requests" : "Discussion"})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Direct Warning Labels */}
            <div className="flex flex-col justify-end">
              <div className="text-[10px] text-text-muted bg-surface-900/30 border border-border/10 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  Threads in **Help & Support** allow marking replies as solved, while other categories are general discussions.
                </span>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-[family-name:var(--font-heading)]">
              Title
            </label>
            <input
              type="text"
              placeholder="An interesting cyber title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
              disabled={isSubmitting}
              className="w-full h-11 px-4 bg-surface-950 border border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-text-primary text-sm font-semibold placeholder:text-text-muted/50 transition-all shadow-inner"
            />
          </div>

          {/* Tab Selection (Reddit-style tabs: Text Post / Image Uploader) */}
          <div className="border-b border-border/20 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("post")}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "post"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <FileText className="w-4 h-4" />
              Post Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("images")}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "images"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images ({selectedFiles.length} / 5)
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[220px]">
            {activeTab === "post" ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest font-[family-name:var(--font-heading)]">
                  Description
                </label>
                <textarea
                  placeholder="Draft your post details here... (Supports standard HTML content or plain text. Use ||spoiler|| for inline spoilers)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  required
                  disabled={isSubmitting}
                  className="w-full p-4 bg-surface-950 border border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-text-primary text-sm font-medium placeholder:text-text-muted/40 transition-all font-[family-name:var(--font-mono)]"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest font-[family-name:var(--font-heading)]">
                  Media Attachments
                </label>
                
                {/* Upload drag drop panel */}
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/40 hover:border-primary/40 rounded-xl cursor-pointer bg-surface-950/20 hover:bg-surface-950/40 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <Upload className="w-8 h-8 text-text-muted group-hover:text-primary group-hover:scale-110 transition-all mb-2" />
                    <p className="text-xs text-text-secondary font-bold tracking-wide">
                      Click to upload or drag & drop files
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      PNG, JPG, JPEG, GIF (Max. 5 images, up to 4MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>

                {/* File previews grid */}
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative group/thumb rounded-lg overflow-hidden aspect-square border border-border/30 bg-black">
                        <img
                          src={preview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                        />
                        
                        {/* Remove Overlay Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200"
                        >
                          <Trash2 className="w-5 h-5 text-error hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action button rows */}
        <div className="flex justify-end gap-3">
          <Link to="/app/forums">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            Publish Thread
          </Button>
        </div>
      </form>
    </div>
  );
}
