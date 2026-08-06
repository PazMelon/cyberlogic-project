import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Lock, Send, ArrowLeft, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { requestCyberboardAccess, redeemCyberboardInviteToken } from "../../utils/api";

interface PrivateBoardAccessScreenProps {
  boardId: number;
  boardTitle?: string;
  hostName?: string;
  hasPendingRequest?: boolean;
  inviteToken?: string | null;
  onSuccessJoined: () => void;
}

export default function PrivateBoardAccessScreen({
  boardId,
  boardTitle = "Private CyberBoard",
  hostName = "Board Host",
  hasPendingRequest = false,
  inviteToken = null,
  onSuccessJoined,
}: PrivateBoardAccessScreenProps) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(hasPendingRequest);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Auto-redeem single-use 6h invite token if present in URL
  useEffect(() => {
    if (inviteToken) {
      setIsSubmitting(true);
      redeemCyberboardInviteToken(boardId, inviteToken)
        .then(() => {
          setSuccessText("Invite link validated! Granting board access...");
          setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            onSuccessJoined();
          }, 1200);
        })
        .catch((err) => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setErrorText(err.message || "Failed to redeem invite link. Token may be expired or already used.");
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  }, [boardId, inviteToken, onSuccessJoined]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorText(null);
    try {
      await requestCyberboardAccess(boardId, message.trim() || undefined);
      setIsPending(true);
      setSuccessText("Join request sent to the board host for approval!");
    } catch (err: any) {
      setErrorText(err.message || "Failed to submit access request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 text-text-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="bg-surface-900 border border-border/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Top Back Navigation */}
        <button
          type="button"
          onClick={() => navigate("/app/cyberboard")}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Boards Directory</span>
        </button>

        {/* Lock Shield Icon & Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30 inline-block mb-1">
              Strictly Private Board
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary">{boardTitle}</h1>
            <p className="text-xs text-text-muted">
              Hosted by <strong className="text-text-secondary">{hostName}</strong>
            </p>
          </div>
        </div>

        {/* Info Disclaimer */}
        <div className="p-4 rounded-2xl bg-surface-950/60 border border-border/60 text-xs text-text-muted leading-relaxed space-y-1">
          <div className="flex items-center gap-2 font-bold text-text-primary">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Exclusive Access Required</span>
          </div>
          <p>
            This CyberBoard is strictly private. Only explicit members approved by the host or guests with a valid 6-hour single-use invite link can access board tasks.
          </p>
        </div>

        {errorText && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-semibold">
            {errorText}
          </div>
        )}

        {successText && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successText}</span>
          </div>
        )}

        {/* Request Access Form or Pending Status Badge */}
        {isPending ? (
          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 text-center space-y-2">
            <Clock className="w-6 h-6 text-primary mx-auto animate-pulse" />
            <h3 className="text-sm font-bold text-primary">Access Request Pending Approval</h3>
            <p className="text-xs text-text-muted">
              Your request has been sent to <strong>{hostName}</strong>. You will gain access as soon as the host approves your request.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted">
                Message to Board Host (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Introduce yourself or explain why you are requesting access..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-800 border border-border/60 text-xs text-text-primary focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-light text-surface-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Submitting Request..." : "Request Access to Join"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
