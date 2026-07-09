import { useRef, useEffect } from "react";
import { Paperclip, Smile, Send } from "lucide-react";

export interface MessageInputProps {
  messageText: string;
  placeholder: string;
  disabled: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  hasWritePermission: boolean;
}

export default function MessageInput({
  messageText,
  placeholder,
  disabled,
  onSubmit,
  onChange,
  hasWritePermission,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto grow height based on scrollHeight
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [messageText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only intercept enter key if on desktop (innerWidth >= 768)
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      if (messageText.trim() && !disabled) {
        const form = textareaRef.current?.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <div className="p-4 border-t border-border bg-surface-900/30 flex-shrink-0">
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 p-2 rounded-xl bg-surface-800 border border-border focus-within:border-primary/50 transition-all"
      >
        <button
          type="button"
          disabled={!hasWritePermission}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted mb-0.5"
          aria-label="Upload file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        
        <textarea
          ref={textareaRef}
          rows={1}
          value={messageText}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 py-1 disabled:text-text-muted disabled:cursor-not-allowed resize-none max-h-[120px] overflow-y-auto no-scrollbar"
        />
        
        <button
          type="button"
          disabled={!hasWritePermission}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted mb-0.5"
          aria-label="Add emoji"
        >
          <Smile className="w-4 h-4" />
        </button>
        
        <button
          type="submit"
          disabled={!messageText.trim() || disabled}
          className="p-2 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-50 text-white transition-colors mb-0.5"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
