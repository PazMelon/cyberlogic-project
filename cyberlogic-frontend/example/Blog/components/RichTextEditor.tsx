import { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

/**
 * Lightweight rich text editor using contentEditable.
 * Supports bold, italic, bullet lists, numbered lists, and paragraphs.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '160px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Sync value prop to innerHTML only when it changes from outside
  useEffect(() => {
    if (editorRef.current) {
      if (isFirstRender.current || (value !== editorRef.current.innerHTML && document.activeElement !== editorRef.current)) {
        editorRef.current.innerHTML = value;
      }
      isFirstRender.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== value) {
        onChange(currentHtml);
      }
    }
  }, [onChange, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      handleInput();
    }
  };

  const execCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const isActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const ToolbarButton = ({ command, icon: Icon, label }: { command: string; icon: React.ElementType; label: string }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Keep focus in editor
        execCommand(command);
      }}
      className={`p-2 rounded-lg transition-colors cursor-pointer ${isActive(command)
        ? 'bg-brand/10 text-brand'
        : 'text-muted hover:text-charcoal hover:bg-subtle/60'
        }`}
      title={label}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-subtle/30 border-b border-border/40">
        <ToolbarButton command="bold" icon={Bold} label="Bold (Ctrl+B)" />
        <ToolbarButton command="italic" icon={Italic} label="Italic (Ctrl+I)" />
        <div className="w-px h-5 bg-border/50 mx-1" />
        <ToolbarButton command="insertUnorderedList" icon={List} label="Bullet List" />
        <ToolbarButton command="insertOrderedList" icon={ListOrdered} label="Numbered List" />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="px-4 py-3 text-sm text-charcoal leading-relaxed outline-none bg-white overflow-y-auto
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted/50
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
          [&_li]:my-0.5
          [&_b]:font-bold [&_strong]:font-bold
          [&_i]:italic [&_em]:italic
          [&_p]:my-1
          min-h-[inherit]
        "
        style={{ minHeight }}
      />
    </div>
  );
}
