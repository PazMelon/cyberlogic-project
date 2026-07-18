import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FullscreenImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  images?: string[];
  defaultIndex?: number;
  alt?: string;
  caption?: string;
  subcaption?: string;
}

export function FullscreenImageViewer({
  isOpen,
  onClose,
  imageUrl,
  images = [],
  defaultIndex = 0,
  alt = "Image",
  caption,
  subcaption,
}: FullscreenImageViewerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(defaultIndex);

  // Sync index when defaultIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(defaultIndex);
    }
  }, [defaultIndex, isOpen]);

  const activeImages = images.length > 0 ? images : imageUrl ? [imageUrl] : [];
  const hasMultiple = activeImages.length > 1;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (hasMultiple) {
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, hasMultiple, activeImages.length]);

  if (!isOpen || activeImages.length === 0) return null;

  const currentSrc = activeImages[currentIndex];

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-dialog-backdrop cursor-pointer"
    >
      {/* Top Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors duration-200 text-text-secondary cursor-pointer z-10"
        title="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full flex flex-col items-center justify-center select-none"
      >
        {/* Main Viewport Container */}
        <div className="relative w-full flex items-center justify-center min-h-[50vh]">
          {/* Left Arrow */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 md:left-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-all cursor-pointer"
              title="Previous Image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Active Image Frame */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-h-[70vh] bg-surface-950 flex items-center justify-center transition-all duration-300">
            <img
              src={currentSrc}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>

          {/* Right Arrow */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 md:right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-all cursor-pointer"
              title="Next Image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Caption */}
        {(caption || subcaption || hasMultiple) && (
          <div className="mt-4 text-center">
            {caption && <p className="text-sm font-bold text-white">{caption}</p>}
            <p className="text-xs text-text-secondary mt-0.5">
              {subcaption ? `${subcaption} • ` : ""}Image {currentIndex + 1} of {activeImages.length}
            </p>
          </div>
        )}

        {/* Bottom Thumbnails */}
        {hasMultiple && (
          <div className="mt-6 flex justify-center gap-2 overflow-x-auto max-w-full p-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
            {activeImages.map((src, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  idx === currentIndex ? "border-primary scale-105" : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

