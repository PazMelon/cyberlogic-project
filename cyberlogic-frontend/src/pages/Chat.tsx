import { useState, useRef, useEffect } from "react";
import { Hash, Send, Smile, Paperclip, Users, Info } from "lucide-react";
import { chatChannels, chatMessages, directoryMembers } from "../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../components/Skeleton";

export default function Chat() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const channelMessages = chatMessages.filter((m) => m.channelId === activeChannel);
  const channel = chatChannels.find((c) => c.id === activeChannel);
  const onlineMembers = directoryMembers.filter((m) => m.status === "online");

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeChannel]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeChannel, isLoading]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-950">
      {/* Channel Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-border bg-surface-900/50 hidden sm:flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary font-[family-name:var(--font-heading)]">
            Channels
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {chatChannels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setActiveChannel(ch.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                activeChannel === ch.id
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
            >
              <Hash className="w-4 h-4 flex-shrink-0 opacity-60" />
              <span className="truncate flex-1 text-left">{ch.name}</span>
              {ch.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {ch.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Online Members Preview */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>{onlineMembers.length} online</span>
          </div>
          <div className="flex -space-x-2">
            {onlineMembers.slice(0, 5).map((m) => (
              <img
                key={m.id}
                src={m.avatar}
                alt={m.name}
                className="w-7 h-7 rounded-full border-2 border-surface-900 bg-surface-700"
                title={m.name}
              />
            ))}
            {onlineMembers.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-surface-900 bg-surface-700 flex items-center justify-center text-[10px] text-text-muted font-bold">
                +{onlineMembers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-surface-900/30 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="w-5 h-5 text-text-muted flex-shrink-0" />
            <h3 className="text-sm font-semibold text-text-primary truncate">{channel?.name}</h3>
            <span className="hidden md:inline text-xs text-text-muted">—</span>
            <span className="hidden md:inline text-xs text-text-muted truncate">
              {channel?.description}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-lg transition-colors ${
                showMembers ? "text-primary bg-primary/10" : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
              aria-label="Toggle members"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              aria-label="Channel info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages + Optional Members Panel */}
        <div className="flex-1 flex min-h-0">
          {/* Message Stream */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
          >
            {isLoading ? (
              <div className="space-y-5 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <SkeletonCircle className="w-9 h-9 bg-surface-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <SkeletonLine widthClass="w-24" heightClass="h-3.5" />
                        <SkeletonLine widthClass="w-12" heightClass="h-3" />
                      </div>
                      <SkeletonLine widthClass={i % 2 === 0 ? "w-3/4" : "w-1/2"} heightClass="h-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              channelMessages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex items-center gap-2 text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-800/50">
                      <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>{msg.content}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start gap-3 group hover:bg-white/[0.02] p-2 rounded-lg -mx-2 transition-colors">
                    <img
                      src={msg.authorAvatar}
                      alt={msg.author}
                      className="w-9 h-9 rounded-full bg-surface-700 object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-text-primary">{msg.author}</span>
                        <span className="text-[10px] text-text-muted">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sidebar Panel for Online Members */}
          {showMembers && (
            <div className="w-60 flex-shrink-0 border-l border-border bg-surface-900/30 flex flex-col animate-slideLeft">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Channel Members
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {directoryMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                    <div className="relative">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-8 h-8 rounded-full bg-surface-700 object-cover"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-950 ${
                        m.status === "online" ? "bg-success" : m.status === "away" ? "bg-warning" : "bg-text-muted"
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-text-primary truncate">{m.name}</p>
                      <p className="text-[9px] text-text-muted truncate">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-surface-900/30 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim()) setMessage("");
            }}
            className="flex items-center gap-2 p-2 rounded-xl bg-surface-800 border border-border focus-within:border-primary/50 transition-all"
          >
            <button
              type="button"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
              aria-label="Upload file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message #${channel?.name}`}
              className="flex-1 bg-transparent border-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 py-1"
            />
            <button
              type="button"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
              aria-label="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              className="p-2 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-50 text-white transition-colors"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
