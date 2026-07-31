import { MessageSquare, Loader2, Send, Clock } from 'lucide-react';
import { type ChessLobbyChatMessage } from '../../utils/chessApi';

interface LobbyMessageHubCardProps {
  messages: ChessLobbyChatMessage[];
  chatInput: string;
  loadingMoreMessages: boolean;
  desktopChatRef: React.RefObject<HTMLDivElement | null>;
  onScrollBackread: (containerRef: React.RefObject<HTMLDivElement | null>) => void;
  onSendChat: (e: React.FormEvent) => void;
  onChatInputChange: (val: string) => void;
}

export function LobbyMessageHubCard({
  messages,
  chatInput,
  loadingMoreMessages,
  desktopChatRef,
  onScrollBackread,
  onSendChat,
  onChatInputChange,
}: LobbyMessageHubCardProps) {
  return (
    <div className="bg-[var(--cl-surface-900)]/90 backdrop-blur-md border border-[var(--cl-border)] rounded-2xl p-4 flex flex-col flex-1 min-h-[240px] overflow-hidden transition-all">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pb-2.5 border-b border-[var(--cl-border)]/60">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-[var(--cl-primary-glow)] text-[var(--cl-primary-light)] border border-[var(--cl-primary)]/20 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-[var(--cl-text-primary)] font-[family-name:var(--font-heading)] truncate">
            Arena Lobby Chat
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-[var(--cl-text-muted)] bg-[var(--cl-surface-950)] border border-[var(--cl-border)] shrink-0 flex items-center gap-1">
          <Clock className="w-3 h-3 text-[var(--cl-primary-light)]" />
          7d history
        </span>
      </div>

      {/* Messages Scroll Container */}
      <div
        ref={desktopChatRef}
        onScroll={() => onScrollBackread(desktopChatRef)}
        className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs custom-scrollbar relative min-h-0"
      >
        {loadingMoreMessages && (
          <div className="py-1.5 text-center text-[var(--cl-primary)] text-[10px] font-semibold flex items-center justify-center gap-1.5 bg-[var(--cl-surface-950)]/50 rounded-lg border border-[var(--cl-border)]/40">
            <Loader2 className="w-3 h-3 animate-spin" /> Fetching older messages...
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="w-8 h-8 text-[var(--cl-text-muted)] opacity-30 mb-1.5" />
            <p className="text-xs text-[var(--cl-text-muted)] italic">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className="p-2 rounded-xl bg-[var(--cl-surface-950)]/80 border border-[var(--cl-border)]/60 hover:border-[var(--cl-primary)]/30 transition-all space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-[var(--cl-primary-light)] text-[11px] truncate">
                  {msg.sender?.name || 'Player'}
                </span>
                <span className="text-[9px] text-[var(--cl-text-muted)] font-mono shrink-0">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-[var(--cl-text-primary)] font-normal text-xs leading-relaxed break-words">
                {msg.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={onSendChat} className="flex gap-2 shrink-0 pt-2.5 border-t border-[var(--cl-border)]/60">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          placeholder="Send a message to arena..."
          className="flex-1 min-w-0 bg-[var(--cl-surface-950)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] placeholder-[var(--cl-text-muted)] rounded-xl px-3.5 py-2 focus:outline-none focus:border-[var(--cl-primary)] transition-all"
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="bg-[var(--cl-primary)] hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-extrabold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 text-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
