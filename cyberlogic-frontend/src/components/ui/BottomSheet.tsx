import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  initialSnap?: "1/2" | "3/4" | "fullscreen";
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  initialSnap = "3/4",
  children,
}: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Height state ratio (0 to 1)
  const [snapRatio, setSnapRatio] = useState<number>(() => {
    if (initialSnap === "1/2") return 0.5;
    if (initialSnap === "fullscreen") return 1.0;
    return 0.75; // default 3/4
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);

  const startYRef = useRef<number>(0);
  const startHeightPxRef = useRef<number>(0);

  // Close on Escape key & lock scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Pointer drag gesture handlers for snapping
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startYRef.current = e.clientY;

    const currentPx = sheetRef.current
      ? sheetRef.current.getBoundingClientRect().height
      : window.innerHeight * snapRatio;
    startHeightPxRef.current = currentPx;
    setDragHeightPx(currentPx);

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    const newHeight = Math.max(
      80,
      Math.min(window.innerHeight, startHeightPxRef.current - deltaY)
    );
    setDragHeightPx(newHeight);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const finalPx =
      dragHeightPx ?? startHeightPxRef.current - (e.clientY - startYRef.current);
    setDragHeightPx(null);

    const ratio = finalPx / window.innerHeight;

    // Snap thresholds: 0 (Close), 0.5 (Half 1/2), 0.75 (3/4), 1.0 (Fullscreen)
    if (ratio < 0.28) {
      onClose();
    } else if (ratio < 0.625) {
      setSnapRatio(0.5);
    } else if (ratio < 0.875) {
      setSnapRatio(0.75);
    } else {
      setSnapRatio(1.0);
    }
  };

  if (!isOpen) return null;

  const currentHeightCss =
    dragHeightPx !== null ? `${dragHeightPx}px` : `${Math.round(snapRatio * 100)}vh`;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4"
    >
      <div
        ref={sheetRef}
        style={{
          height: currentHeightCss,
          transition: isDragging
            ? "none"
            : "height 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        className="w-full rounded-t-3xl sm:rounded-2xl border-t border-x sm:border border-border/80 bg-surface-900 shadow-2xl flex flex-col overflow-hidden max-w-2xl sm:max-w-xl mx-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Minimal Interactive Drag Handle Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full py-3 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none bg-surface-900 border-b border-border/40 flex-shrink-0"
        >
          <div className="w-12 h-1.5 bg-text-muted/40 rounded-full hover:bg-primary transition-colors" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between flex-shrink-0 bg-surface-950/40">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider truncate">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors"
              aria-label="Close bottom sheet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
