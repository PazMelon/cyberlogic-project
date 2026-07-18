import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FullscreenImageViewerProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenImageViewer({
  images,
  initialIndex,
  isOpen,
  onClose,
}: FullscreenImageViewerProps) {
  const [index, setIndex] = useState(initialIndex);

  // Sync index with initialIndex when modal opens
  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, isOpen]);

  // Bind keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    // Prevent document scrolling when viewer is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, index]);

  if (!isOpen || !images || images.length === 0) return null;

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return createPortal(
    <div className="fixed inset-0 w-full h-full z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-50">
        <span className="text-sm font-bold tracking-widest text-text-secondary uppercase">
          Image Gallery ({index + 1} / {images.length})
        </span>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          aria-label="Close viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Container */}
      <div 
        className="w-full h-full flex items-center justify-center p-4 relative"
        onClick={onClose}
      >
        <div 
          className="max-w-[90%] max-h-[85%] flex items-center justify-center relative select-none"
          onClick={(e) => e.stopPropagation()} // Stop closing when clicking image itself
        >
          <img
            src={images[index]}
            alt={`Fullscreen view ${index + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoom-in"
          />
        </div>
      </div>

      {/* Left/Right Navigation Chevrons */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-6 p-4 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl z-50"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-6 p-4 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl z-50"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
