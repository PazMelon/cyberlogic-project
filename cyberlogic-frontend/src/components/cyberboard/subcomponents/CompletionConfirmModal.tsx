import React from "react";
import { CheckSquare, Check } from "lucide-react";

interface CompletionConfirmModalProps {
  cardTitle: string;
  targetColumnTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CompletionConfirmModal: React.FC<CompletionConfirmModalProps> = ({
  cardTitle,
  targetColumnTitle,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-emerald-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="text-base font-bold text-text-primary">
            Mark Task as Completed?
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Task <span className="font-semibold text-text-primary">"{cardTitle}"</span> has reached 100% completion. Would you like to move it to the <span className="font-bold text-emerald-400">"{targetColumnTitle}"</span> column status?
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border bg-surface-800 hover:bg-surface-700 text-xs font-semibold text-text-secondary transition-all cursor-pointer"
          >
            Keep Current Column
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Move to {targetColumnTitle}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionConfirmModal;
