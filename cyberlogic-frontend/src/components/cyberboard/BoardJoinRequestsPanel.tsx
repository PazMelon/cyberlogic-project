import { useState, useEffect, useCallback } from "react";
import { X, Check, UserCheck, MessageSquare, Sparkles, UserX } from "lucide-react";
import {
  fetchCyberboardJoinRequests,
  respondCyberboardJoinRequest,
  getAvatarUrl,
  type CyberboardJoinRequest,
} from "../../utils/api";
import { useWebSocket } from "../../context/WebSocketContext";

interface BoardJoinRequestsPanelProps {
  boardId: number;
  isOpen: boolean;
  onClose: () => void;
  onToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export default function BoardJoinRequestsPanel({
  boardId,
  isOpen,
  onClose,
  onToast,
}: BoardJoinRequestsPanelProps) {
  const { subscribe } = useWebSocket();
  const [requests, setRequests] = useState<CyberboardJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCyberboardJoinRequests(boardId);
      setRequests(data || []);
    } catch (err: any) {
      console.error("Failed to load join requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, loadRequests]);

  useEffect(() => {
    if (!isOpen || !boardId) return;
    const unsubscribe = subscribe(`cyberboard:${boardId}`, (_payload: any, type: string) => {
      if (["join_request:created", "join_request:approved", "join_request:rejected"].includes(type)) {
        loadRequests();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [isOpen, boardId, subscribe, loadRequests]);

  const handleRespond = async (requestId: number, action: "approve" | "reject") => {
    setProcessingId(requestId);
    try {
      await respondCyberboardJoinRequest(boardId, requestId, action);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (onToast) {
        onToast(
          action === "approve" ? "Access granted to user!" : "Join request declined.",
          action === "approve" ? "success" : "info"
        );
      }
    } catch (err: any) {
      if (onToast) onToast(err.message || "Failed to process request.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-border rounded-3xl max-w-lg w-full h-[550px] max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border/80 flex items-center justify-between gap-3 bg-surface-950/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                Pending Join Requests ({requests.length})
              </h2>
              <p className="text-[11px] text-text-muted">Approve users to join this private board</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all cursor-pointer"
            title="Close Panel"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-text-muted">Loading pending requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-text-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-text-secondary">No pending join requests.</p>
              <p className="text-[11px] text-text-muted">New request submissions will appear here automatically.</p>
            </div>
          ) : (
            requests.map((req) => {
              const avatar = getAvatarUrl(req.user?.avatar || req.user?.avatar_path, req.user?.first_name || "User");
              const userName = req.user
                ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || req.user.username
                : "Applicant User";

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-surface-800/80 border border-border/60 space-y-3 hover:border-border transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={avatar} alt={userName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate">{userName}</p>
                        <p className="text-[10px] text-text-muted truncate">
                          Requested {new Date(req.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {req.message && (
                    <div className="p-2.5 rounded-xl bg-surface-950/60 border border-border/40 text-xs text-text-secondary flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed italic">{req.message}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => handleRespond(req.id, "reject")}
                      disabled={processingId === req.id}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespond(req.id, "approve")}
                      disabled={processingId === req.id}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 text-surface-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Access</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
