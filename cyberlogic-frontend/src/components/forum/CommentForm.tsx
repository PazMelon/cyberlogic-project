import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "../ui";

interface CommentFormProps {
  onSubmit: (content: string) => void | Promise<void>;
  placeholder?: string;
  buttonText?: string;
  autoFocus?: boolean;
  initialValue?: string;
  onCancel?: () => void;
}

export function CommentForm({
  onSubmit,
  placeholder = "What are your thoughts?",
  buttonText = "Post Comment",
  autoFocus = false,
  initialValue = "",
  onCancel
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content);
      setContent("");
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={textareaRef}
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="w-full p-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors rounded-lg bg-surface-900/40 border border-border"
          >
            Cancel
          </button>
        )}
        <Button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          variant="primary"
          className="px-4 py-2 text-xs"
          icon={<Send className="w-3 h-3" />}
        >
          {isSubmitting ? "Submitting..." : buttonText}
        </Button>
      </div>
    </form>
  );
}
