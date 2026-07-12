import React, { useEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "./Button";

interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export function PromptDialog({
  isOpen,
  title,
  message,
  placeholder = "Type here...",
  defaultValue = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync defaultValue when isOpen changes
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md animate-dialog-backdrop"
    >
      <div
        ref={containerRef}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-primary/30 shadow-[0_0_25px_rgba(59,130,246,0.15)] bg-surface-900/90 glass p-6 animate-dialog-content"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 flex items-center justify-center">
              <Info className="w-8 h-8 text-primary animate-pulse" />
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
        <div className="mb-4">
          <p className="text-sm text-text-secondary leading-relaxed font-body whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              rows={6}
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface-850 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all"
              autoFocus
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              className="px-4 py-2"
            >
              {cancelText}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!value.trim()}
              className="px-5 py-2 min-w-[80px]"
            >
              {confirmText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
