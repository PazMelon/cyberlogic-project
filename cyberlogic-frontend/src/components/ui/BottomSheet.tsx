import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press and lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-surface-950/60 backdrop-blur-sm animate-bottomsheet-backdrop"
    >
      <div
        className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-x border-border bg-surface-900/95 glass pb-8 pt-3 px-4 shadow-[0_-8px_30px_rgb(0,0,0,0.3)] animate-bottomsheet-slideup flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag/Swipe Indicator Handle */}
        <div className="w-12 h-1 bg-text-muted/30 rounded-full mx-auto mb-4 cursor-pointer hover:bg-text-muted/50 transition-colors" onClick={onClose} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          {title ? (
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors duration-200"
            aria-label="Close bottom sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-2">
          {children}
        </div>
      </div>
    </div>
  );
}
