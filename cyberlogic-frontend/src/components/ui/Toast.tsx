import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type?: "error" | "info" | "success";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "error", onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styleClasses = {
    success: "bg-emerald-950/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50",
    info: "bg-surface-900/95 border-primary/40 text-text-primary shadow-primary/10",
    error: "bg-error/95 border-error/50 text-white shadow-error/20",
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-primary flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />,
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
      <div
        className={`border backdrop-blur-md text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 ${styleClasses[type]}`}
      >
        {icons[type]}
        <span className="font-medium">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-0.5"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
