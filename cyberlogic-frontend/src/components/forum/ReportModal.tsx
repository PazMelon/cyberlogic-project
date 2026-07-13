import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createReport } from "../../utils/api";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportableType: "thread" | "comment" | "project";
  reportableId: number;
  onSuccess?: () => void;
}

const REASONS = [
  "Spam or misleading content",
  "Harassment or abuse",
  "Inappropriate, offensive or NSFW content",
  "Intellectual property violation / Plagiarism",
  "Hate speech or discrimination",
  "Other issues"
];

export function ReportModal({ isOpen, onClose, reportableType, reportableId, onSuccess }: ReportModalProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await createReport({
        reportable_type: reportableType,
        reportable_id: reportableId,
        reason,
        details: details.trim() || undefined
      });
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setDetails("");
        setReason(REASONS[0]);
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit report:", err);
      setError(err.message || "Something went wrong while submitting the report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/65 backdrop-blur-md animate-dialog-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border bg-surface-900/90 glass p-6 animate-dialog-content border-border"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] capitalize">
            Report {reportableType}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-2.5 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success text-xl font-bold">
              ✓
            </div>
            <h4 className="text-sm font-bold text-text-primary">Report Submitted</h4>
            <p className="text-xs text-text-muted">Thank you. The moderation team will review this report shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
                ✗ {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                required
              >
                {REASONS.map((r) => (
                  <option key={r} value={r} className="bg-surface-900 text-text-primary">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Provide additional details or context to help moderators understand the issue..."
                className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none"
                maxLength={1000}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-center text-xs font-bold bg-surface-800 hover:bg-surface-700 text-text-primary border border-border rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 text-center text-xs font-bold bg-gradient-to-r from-error to-red-600 hover:shadow-lg hover:shadow-error/25 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
