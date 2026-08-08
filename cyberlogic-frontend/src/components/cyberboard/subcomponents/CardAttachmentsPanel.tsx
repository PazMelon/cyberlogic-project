import React from "react";
import { Paperclip, Loader2, ImageIcon, Link as LinkIcon, Sparkles, Trash2, ChevronLeft, ChevronRight, ExternalLink, Check } from "lucide-react";
import type { CyberboardAttachment } from "../../../utils/api";
import ProviderBadge from "../ui/ProviderBadge";
import { formatFileSize, detectAttachmentProvider } from "../shared/cyberboardUtils";

interface CardAttachmentsPanelProps {
  attachments: CyberboardAttachment[];
  canEditCard: boolean;
  isUploadingImage: boolean;
  uploadStatusText: string;
  activeCarouselIndex: number;
  setActiveCarouselIndex: React.Dispatch<React.SetStateAction<number>>;
  setFullscreenImageIndex: (index: number | null) => void;
  copiedAttachmentId: string | null;
  setCopiedAttachmentId: (id: string | null) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowAddLinkModal: () => void;
  onRemoveAttachment: (id: string) => void;
  hideUploadButtons?: boolean;
}

export const CardAttachmentsPanel: React.FC<CardAttachmentsPanelProps> = ({
  attachments = [],
  canEditCard,
  isUploadingImage,
  uploadStatusText,
  activeCarouselIndex,
  setActiveCarouselIndex,
  setFullscreenImageIndex,
  copiedAttachmentId,
  setCopiedAttachmentId,
  onImageUpload,
  onShowAddLinkModal,
  onRemoveAttachment,
  hideUploadButtons = false,
}) => {
  const imageAttachments = attachments.filter((att) => att.type === "image");
  const linkAttachments = attachments.filter((att) => att.type !== "image");

  if (hideUploadButtons && attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="w-4 h-4 text-primary" />
          <span>Attachments ({attachments.length})</span>
        </h4>

        {!hideUploadButtons && canEditCard && (
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <label
              className={`px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-750 text-xs font-bold text-text-primary border border-border flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow-xs ${
                isUploadingImage ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <ImageIcon className="w-4 h-4 text-primary" />
              )}
              <span>{isUploadingImage ? "Uploading..." : "Upload Image"}</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={onImageUpload}
                disabled={isUploadingImage}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={onShowAddLinkModal}
              className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary border border-primary/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <LinkIcon className="w-4 h-4 text-primary" />
              <span>Add Link</span>
            </button>
          </div>
        )}
      </div>

      {uploadStatusText && (
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs text-primary font-semibold animate-pulse">
          <Sparkles className="w-4 h-4 text-primary animate-spin" />
          <span>{uploadStatusText}</span>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="p-4 rounded-xl bg-surface-800/30 border border-border/40 text-center space-y-1">
          <p className="text-xs text-text-muted italic">No file links or images attached yet.</p>
          {canEditCard && (
            <p className="text-[11px] text-text-muted/70">
              Attach Google Drive links, Dropbox, OneDrive, Figma, GitHub links, or upload WebP-optimized images.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {imageAttachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Image Preview ({imageAttachments.length})</span>
                </span>
                {imageAttachments.length > 1 && (
                  <span className="text-[11px] text-text-muted font-medium">
                    {activeCarouselIndex + 1} of {imageAttachments.length}
                  </span>
                )}
              </div>

              <div className="relative rounded-2xl bg-surface-950/80 border border-border/80 overflow-hidden group">
                <div
                  className="relative aspect-video sm:aspect-[16/9] w-full bg-surface-950 flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => setFullscreenImageIndex(activeCarouselIndex)}
                >
                  <img
                    src={imageAttachments[activeCarouselIndex]?.url}
                    alt={imageAttachments[activeCarouselIndex]?.title || "Attachment Preview"}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />

                  {canEditCard && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetId = imageAttachments[activeCarouselIndex]?.id;
                        if (targetId) onRemoveAttachment(targetId);
                        if (activeCarouselIndex > 0) setActiveCarouselIndex(activeCarouselIndex - 1);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-xl bg-surface-900/90 text-text-muted hover:text-error border border-border/60 backdrop-blur-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer z-10 active:scale-95"
                      title="Remove Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {imageAttachments.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCarouselIndex((prev) =>
                          prev > 0 ? prev - 1 : imageAttachments.length - 1
                        );
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-surface-900/80 text-text-primary border border-border/60 hover:bg-surface-800 hover:scale-110 transition-all backdrop-blur-md cursor-pointer z-10 shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCarouselIndex((prev) =>
                          prev < imageAttachments.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-surface-900/80 text-text-primary border border-border/60 hover:bg-surface-800 hover:scale-110 transition-all backdrop-blur-md cursor-pointer z-10 shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {imageAttachments.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {imageAttachments.map((imgAtt, idx) => (
                    <button
                      key={imgAtt.id}
                      type="button"
                      onClick={() => setActiveCarouselIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                        activeCarouselIndex === idx
                          ? "border-primary ring-2 ring-primary/40 scale-105"
                          : "border-border/60 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={imgAtt.url} alt={imgAtt.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {linkAttachments.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                File Hosting Links ({linkAttachments.length})
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {linkAttachments.map((att) => {
                  const provider = att.provider || detectAttachmentProvider(att.url);
                  return (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl bg-surface-800/80 border border-border/60 hover:border-primary/40 transition-all flex items-start gap-3 group relative overflow-hidden"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-900 border border-border/60 flex items-center justify-center flex-shrink-0">
                        {provider === "google_drive" && <span className="text-lg">📁</span>}
                        {provider === "dropbox" && <span className="text-lg">📦</span>}
                        {provider === "onedrive" && <span className="text-lg">☁️</span>}
                        {provider === "figma" && <span className="text-lg">🎨</span>}
                        {provider === "github" && <span className="text-lg">🐙</span>}
                        {provider === "general" && <LinkIcon className="w-5 h-5 text-primary" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ProviderBadge provider={provider} />
                        </div>

                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-text-primary hover:text-primary transition-colors block truncate"
                          title={att.title}
                        >
                          {att.title}
                        </a>

                        <div className="flex items-center gap-2 text-[10px] text-text-muted">
                          {att.file_size ? <span>{formatFileSize(att.file_size)}</span> : null}

                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(att.url);
                              setCopiedAttachmentId(att.id);
                              setTimeout(() => setCopiedAttachmentId(null), 2000);
                            }}
                            className="hover:text-text-primary font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            {copiedAttachmentId === att.id ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Copied
                              </span>
                            ) : (
                              <span>Copy URL</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {canEditCard && (
                        <button
                          type="button"
                          onClick={() => onRemoveAttachment(att.id)}
                          className="text-text-muted hover:text-error p-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0 active:scale-95"
                          title="Remove Attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardAttachmentsPanel;
