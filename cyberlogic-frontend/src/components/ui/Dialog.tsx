import React, { useEffect, useRef } from "react";
import { Info, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";
import { Button } from "./Button";

export type DialogType = "info" | "success" | "warning" | "error" | "danger";

interface DialogProps {
  title: string;
  message: string;
  type: DialogType;
  confirmText?: string;
  cancelText?: string;
  isConfirm: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export function Dialog({
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  isConfirm = false,
  onConfirm,
  onCancel,
  onClose,
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-8 h-8 text-success animate-bounce" />;
      case "warning":
        return <AlertTriangle className="w-8 h-8 text-warning" />;
      case "error":
      case "danger":
        return <XCircle className="w-8 h-8 text-error" />;
      case "info":
      default:
        return <Info className="w-8 h-8 text-info" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-success/30 shadow-[0_0_25px_rgba(34,197,94,0.15)]";
      case "warning":
        return "border-warning/30 shadow-[0_0_25px_rgba(245,158,11,0.15)]";
      case "error":
      case "danger":
        return "border-error/30 shadow-[0_0_25px_rgba(239,68,68,0.15)]";
      case "info":
      default:
        return "border-info/30 shadow-[0_0_25px_rgba(59,130,246,0.15)]";
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md animate-dialog-backdrop"
    >
      <div
        ref={containerRef}
        className={`w-full max-w-md overflow-hidden rounded-2xl border bg-surface-900/90 glass p-6 animate-dialog-content ${getBorderColor()}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 flex items-center justify-center">
              {getIcon()}
            </div>
            <h3 className="text-lg font-semibold font-heading text-text-primary tracking-wide">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors duration-200"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-sm text-text-secondary leading-relaxed font-body whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3">
          {isConfirm && (
            <Button
              variant="secondary"
              onClick={onCancel}
              className="px-4 py-2"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={type === "danger" || type === "error" ? "danger" : "primary"}
            onClick={onConfirm}
            className="px-5 py-2 min-w-[80px]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
