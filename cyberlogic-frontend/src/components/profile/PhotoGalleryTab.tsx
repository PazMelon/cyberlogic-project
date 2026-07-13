import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon, Edit2, Check, X } from "lucide-react";
import { FullscreenImageViewer } from "../ui";
import {
  fetchUserGallery,
  uploadGalleryPhoto,
  updateGalleryCaption,
  deleteGalleryPhoto,
  type UserGalleryPhoto,
} from "../../utils/api";
import { optimizeAndConvertToWebP } from "../../utils/imageOptimizer";

interface PhotoGalleryTabProps {
  userId: number;
  isOwnProfile: boolean;
}

export function PhotoGalleryTab({ userId, isOwnProfile }: PhotoGalleryTabProps) {
  const [photos, setPhotos] = useState<UserGalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fullscreen viewer
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // Edit caption state
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const [isSavingCaption, setIsSavingCaption] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGallery();
  }, [userId]);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserGallery(userId);
      setPhotos(data);
    } catch (err) {
      console.error("Failed to load gallery:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 50) {
      setError(`Gallery limit is 50 photos. You currently have ${photos.length}.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      for (const file of files) {
        // Optimize first
        const optimized = await optimizeAndConvertToWebP(file);
        
        // Convert optimized dataURL back to File object
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
        const processedFile = dataURLtoFile(optimized.dataUrl, `gallery_image.${ext}`);

        // Upload to server
        const response = await uploadGalleryPhoto(processedFile);
        setPhotos((prev) => [response.photo, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload gallery photo.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      await deleteGalleryPhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      if (fullscreenIndex !== null && photos[fullscreenIndex]?.id === id) {
        setFullscreenIndex(null);
      }
    } catch (err) {
      console.error("Failed to delete gallery photo:", err);
    }
  };

  const startEditCaption = (photo: UserGalleryPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPhotoId(photo.id);
    setEditingCaption(photo.caption || "");
  };

  const saveCaption = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingCaption(true);
    try {
      const response = await updateGalleryCaption(id, editingCaption.trim() || null);
      setPhotos((prev) => prev.map((p) => (p.id === id ? response.photo : p)));
      setEditingPhotoId(null);
    } catch (err) {
      console.error("Failed to update caption:", err);
    } finally {
      setIsSavingCaption(false);
    }
  };

  const cancelEditCaption = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPhotoId(null);
    setEditingCaption("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Photo Gallery</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-surface-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> Photo Gallery
          </h2>
          <span className="text-[10px] text-text-muted">
            {photos.length}/50 photos
          </span>
        </div>
        {isOwnProfile && photos.length < 50 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-[10px] font-bold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Upload Photo
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
          ✗ {error}
        </div>
      )}

      {/* Grid of Photos */}
      {photos.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <ImageIcon className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
          <p className="text-xs text-text-muted">
            {isOwnProfile
              ? "You haven't uploaded any photos to your gallery yet."
              : "No photos to display yet."}
          </p>
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-4 px-4 py-2 rounded-lg bg-surface-800 border border-border hover:bg-surface-700 text-xs font-semibold text-text-primary transition-all cursor-pointer"
            >
              Upload Your First Photo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setFullscreenIndex(index)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-surface-800 border border-border/30 hover:border-border/80 transition-all cursor-pointer"
            >
              <img
                src={photo.image_url}
                alt={photo.caption || "Gallery item"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover actions & caption overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5">
                {/* Top Row: Actions */}
                <div className="flex justify-end items-center gap-1.5">
                  {isOwnProfile && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => startEditCaption(photo, e)}
                        className="p-1.5 rounded-lg bg-black/40 border border-white/10 hover:bg-black/60 text-white transition-colors cursor-pointer"
                        title="Edit caption"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(photo.id, e)}
                        className="p-1.5 rounded-lg bg-error/85 border border-error/50 hover:bg-error text-white transition-colors cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>

                {/* Bottom Row: Caption Info / Form */}
                <div className="w-full" onClick={(e) => e.stopPropagation()}>
                  {editingPhotoId === photo.id ? (
                    <div className="flex items-center gap-1 w-full bg-surface-900/90 p-1.5 rounded-lg border border-white/10">
                      <input
                        type="text"
                        value={editingCaption}
                        onChange={(e) => setEditingCaption(e.target.value)}
                        placeholder="Add caption..."
                        className="flex-1 px-2 py-1 rounded bg-surface-850 text-[10px] text-white border border-border/60 focus:outline-none"
                        maxLength={255}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => saveCaption(photo.id, e)}
                        disabled={isSavingCaption}
                        className="p-1 rounded bg-success hover:bg-success-dark text-white disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditCaption}
                        className="p-1 rounded bg-surface-800 text-white/80 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    photo.caption && (
                      <p className="text-[10px] text-white font-semibold line-clamp-2 leading-tight bg-black/40 p-1.5 rounded border border-white/5">
                        {photo.caption}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handlePhotoUpload}
        multiple
        className="hidden"
      />

      {/* Fullscreen Photo Viewer */}
      <FullscreenImageViewer
        isOpen={fullscreenIndex !== null}
        onClose={() => setFullscreenIndex(null)}
        images={photos.map((p) => p.image_url)}
        defaultIndex={fullscreenIndex !== null ? fullscreenIndex : 0}
        alt={fullscreenIndex !== null ? (photos[fullscreenIndex]?.caption || "Gallery photo") : "Gallery photo"}
        caption={fullscreenIndex !== null ? (photos[fullscreenIndex]?.caption || undefined) : undefined}
        subcaption={fullscreenIndex !== null && photos[fullscreenIndex] ? `Uploaded on ${new Date(photos[fullscreenIndex].created_at).toLocaleDateString()}` : undefined}
      />
    </div>
  );
}
