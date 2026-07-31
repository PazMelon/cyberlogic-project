import { Globe, X, Users, MessageSquare, Loader2, Zap, Send } from 'lucide-react';
import { type ChessLobbyChatMessage } from '../../utils/chessApi';
import { type OnlineUser } from '../../context/WebSocketContext';

interface MobileCommunityDrawerProps {
  show: boolean;
  drawerTab: 'players' | 'chat';
  onlineUsers: OnlineUser[];
  currentUserId?: number;
  messages: ChessLobbyChatMessage[];
  chatInput: string;
  loadingMoreMessages: boolean;
  mobileChatRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSetDrawerTab: (tab: 'players' | 'chat') => void;
  onChallengeUser: (userId: number) => void;
  onScrollBackread: (ref: React.RefObject<HTMLDivElement | null>) => void;
  onSendChat: (e: React.FormEvent) => void;
  onChatInputChange: (val: string) => void;
}

export function MobileCommunityDrawer({
  show,
  drawerTab,
  onlineUsers,
  currentUserId,
  messages,
  chatInput,
  loadingMoreMessages,
  mobileChatRef,
  onClose,
  onSetDrawerTab,
  onChallengeUser,
  onScrollBackread,
  onSendChat,
  onChatInputChange,
}: MobileCommunityDrawerProps) {
  if (!show) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="bg-[var(--cl-surface-900)] border-l border-[var(--cl-border)] w-full max-w-sm h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Slideout Header */}
        <div className="p-4 border-b border-[var(--cl-border)] flex items-center justify-between bg-[var(--cl-surface-950)]">
          <h3 className="font-bold text-sm text-[var(--cl-text-primary)] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--cl-primary)]" /> Chess Community Hub
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slideout Tabs */}
        <div className="flex border-b border-[var(--cl-border)] bg-[var(--cl-surface-950)]">
          <button
            onClick={() => onSetDrawerTab('players')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              drawerTab === 'players'
                ? 'border-[var(--cl-primary)] text-[var(--cl-primary)] bg-[var(--cl-primary-glow)]'
                : 'border-transparent text-[var(--cl-text-muted)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Online Players ({onlineUsers.length})
          </button>
          <button
            onClick={() => onSetDrawerTab('chat')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              drawerTab === 'chat'
                ? 'border-[var(--cl-primary)] text-[var(--cl-primary)] bg-[var(--cl-primary-glow)]'
                : 'border-transparent text-[var(--cl-text-muted)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Lobby Chat
          </button>
        </div>

        {/* Slideout Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {drawerTab === 'players' ? (
            <div className="space-y-2">
              {onlineUsers.length === 0 ? (
                <div className="text-xs text-[var(--cl-text-muted)] py-8 text-center">
                  No other players online
                </div>
              ) : (
                onlineUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--cl-surface-950)] border border-[var(--cl-border)] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.id}`}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-[var(--cl-border)]"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[var(--cl-surface-950)] ${
                            u.status === 'playing' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                        ></span>
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--cl-text-primary)]">{u.name}</div>
                        <div className="text-[10px] text-[var(--cl-text-muted)] capitalize">{u.status || 'online'}</div>
                      </div>
                    </div>

                    {currentUserId && currentUserId !== u.id && (
                      <button
                        onClick={() => onChallengeUser(u.id)}
                        className="bg-[var(--cl-primary)] text-slate-950 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-all hover:brightness-110 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" /> Challenge
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div
                ref={mobileChatRef}
                onScroll={() => onScrollBackread(mobileChatRef)}
                className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs custom-scrollbar min-h-[300px] relative"
              >
                {loadingMoreMessages && (
                  <div className="py-2 text-center text-[var(--cl-primary)] text-[10px] flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading older messages...
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="text-[var(--cl-text-muted)] text-center py-12 text-xs">
                    No messages yet. Say hello in the chess lobby!
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/60 transition-all gap-2"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="font-bold text-[var(--cl-primary-light)] shrink-0 text-[11px]">
                          {msg.sender?.name || 'Player'}:
                        </span>
                        <span className="text-[var(--cl-text-primary)] truncate font-normal text-[11px]">
                          {msg.text}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--cl-text-muted)] font-mono shrink-0 text-right ml-1">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={onSendChat} className="flex gap-2 pt-2 border-t border-[var(--cl-border)]">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => onChatInputChange(e.target.value)}
                  placeholder="Type message in lobby..."
                  className="flex-1 bg-[var(--cl-surface-950)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--cl-primary)]"
                />
                <button
                  type="submit"
                  className="bg-[var(--cl-primary)] text-slate-950 font-bold p-2.5 rounded-lg transition-all hover:brightness-110 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
