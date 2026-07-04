import { useState, useRef } from "react";
import { UploadCloud, X, AlertCircle, Sparkles } from "lucide-react";
import { optimizeAndConvertToWebP } from "./imageOptimizer";
import { uploadImageFile } from "../../../utils/api";

interface ImageUploadZoneProps {
  value: string; // url or base64 DataURL
  onChange: (url: string) => void;
  aspectHint?: string;
  label?: string;
}

// Convert base64 DataURL to File object for backend multipart uploads
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/webp";
  const bstr = atob(arr[arr.length - 1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export default function ImageUploadZone({
  value,
  onChange,
  aspectHint = "Recommended: 16:9 ratio",
  label = "Upload Image"
}: ImageUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<{ original: string; optimized: string; savings: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setStats(null);
    setIsCompressing(true);

    try {
      // 1. Client-side compress and convert to WebP
      const result = await optimizeAndConvertToWebP(file);
      
      // 2. Convert base64 dataURL back into a WebP File object for multipart form uploading
      const secureName = file.name.substring(0, file.name.lastIndexOf('.')) || "image";
      const webpFile = dataURLtoFile(result.dataUrl, `${secureName}.webp`);

      // 3. Upload WebP binary payload securely to backend public storage
      const backendUrl = await uploadImageFile(webpFile);
      onChange(backendUrl);

      // Calculate compression stats for rich user feedback
      const savingsPercent = Math.round(((result.originalSize - result.optimizedSize) / result.originalSize) * 100);
      setStats({
        original: formatSize(result.originalSize),
        optimized: formatSize(result.optimizedSize),
        savings: savingsPercent > 0 ? `${savingsPercent}%` : "0%"
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process image.");
    } finally {
      setIsCompressing(false);
    }
  };

  // Drag and Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggerBrowse
    onChange("");
    setErrorMsg(null);
    setStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Image URL parser (renders custom data URLs or mockup Unsplash images)
  const resolveUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    return `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=60&sig=${encodeURIComponent(url)}`;
  };

  const resolvedSrc = resolveUrl(value);

  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-xs font-semibold text-text-secondary block">{label}</label>}
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerBrowse}
        className={`
          relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[140px] overflow-hidden
          ${isDragActive 
            ? "border-primary bg-primary/5 shadow-md shadow-primary/5 scale-[0.99]" 
            : "border-border/60 bg-surface-900/20 hover:border-primary/50 hover:bg-surface-800/20"
          }
        `}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isCompressing}
        />

        {isCompressing ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-xs text-primary font-bold animate-pulse">Compressing & converting to WebP...</p>
          </div>
        ) : resolvedSrc ? (
          // Preview State
          <div className="relative w-full h-[150px] group/preview">
            <img
              src={resolvedSrc}
              alt="Uploaded Preview"
              className="w-full h-full object-cover rounded-lg border border-border/60"
            />
            {/* Dark Overlay on Hover */}
            <div className="absolute inset-0 bg-surface-950/70 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 rounded-lg">
              <span className="text-xs font-bold text-text-primary">Click to browse or drop to replace</span>
              <button
                type="button"
                onClick={clearImage}
                className="px-2.5 py-1 text-[10px] font-bold bg-error/20 border border-error/40 hover:bg-error hover:text-white rounded-md flex items-center gap-1 transition-all"
              >
                <X className="w-3 h-3" /> Remove Picture
              </button>
            </div>

            {/* Float Stats badge if compressed in this session */}
            {stats && (
              <div className="absolute bottom-2 left-2 bg-surface-950/80 border border-primary/30 px-2 py-0.5 rounded text-[9px] font-bold text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-warning" /> WebP Optimized ({stats.optimized} vs {stats.original} - Saved {stats.savings})
              </div>
            )}
          </div>
        ) : (
          // Empty Upload Dropzone State
          <div className="flex flex-col items-center justify-center text-center space-y-2 py-2">
            <div className="p-3 rounded-full bg-surface-800/80 text-text-muted hover:text-primary transition-colors border border-border/40">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">
                Drag & drop image here, or <span className="text-primary hover:underline">browse</span>
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{aspectHint}</p>
              <p className="text-[9px] text-text-muted/60 mt-1 italic">Supports JPG, PNG, WEBP (Max 5MB) - Auto-optimized to WebP</p>
            </div>
          </div>
        )}

        {/* Error Alert Display */}
        {errorMsg && (
          <div className="absolute inset-x-0 bottom-0 bg-error/15 border-t border-error/35 py-1 px-3 flex items-center gap-1.5 text-error text-[10px] font-semibold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{errorMsg}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setErrorMsg(null);
              }}
              className="ml-auto p-0.5 hover:bg-error/10 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
