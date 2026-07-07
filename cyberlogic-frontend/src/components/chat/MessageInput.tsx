import { Paperclip, Smile, Send } from "lucide-react";

export interface MessageInputProps {
  messageText: string;
  placeholder: string;
  disabled: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  return (
    <div className="p-4 border-t border-border bg-surface-900/30 flex-shrink-0">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 p-2 rounded-xl bg-surface-800 border border-border focus-within:border-primary/50 transition-all"
      >
        <button
          type="button"
          disabled={!hasWritePermission}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted"
          aria-label="Upload file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        
        <input
          type="text"
          value={messageText}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 py-1 disabled:text-text-muted disabled:cursor-not-allowed"
        />
        
        <button
          type="button"
          disabled={!hasWritePermission}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted"
          aria-label="Add emoji"
        >
          <Smile className="w-4 h-4" />
        </button>
        
        <button
          type="submit"
          disabled={!messageText.trim() || disabled}
          className="p-2 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-50 text-white transition-colors"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
