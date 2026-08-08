import React from "react";
import { Bold, Italic, Strikethrough, List, Quote, Code } from "lucide-react";

interface DescriptionRichEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
}

export const DescriptionRichEditor: React.FC<DescriptionRichEditorProps> = ({
  value,
  onChange,
  placeholder = "Add description & details...",
}) => {
  const insertFormatting = (syntaxStart: string, syntaxEnd: string = "") => {
    if (!syntaxEnd && syntaxStart.endsWith("\n")) {
      // Line-based insertion (lists, quotes)
      onChange(value ? `${value}\n${syntaxStart}` : syntaxStart);
    } else {
      // Wrap selected text or insert snippet
      onChange(value ? `${value} ${syntaxStart}text${syntaxEnd}` : `${syntaxStart}text${syntaxEnd}`);
    }
  };

  return (
    <div className="space-y-2 border border-border/80 rounded-2xl bg-surface-900 overflow-hidden shadow-xs">
      {/* Rich Text Toolbar */}
      <div className="p-2 bg-surface-800/80 border-b border-border/60 flex items-center gap-1 flex-wrap text-text-muted">
        <button
          type="button"
          onClick={() => insertFormatting("**", "**")}
          className="p-1.5 rounded-lg hover:bg-surface-700 hover:text-text-primary transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          title="Bold (**text**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting("*", "*")}
          className="p-1.5 rounded-lg hover:bg-surface-700 hover:text-text-primary transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          title="Italic (*text*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting("~~", "~~")}
          className="p-1.5 rounded-lg hover:bg-surface-700 hover:text-text-primary transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          title="Strikethrough (~~text~~)"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => insertFormatting("- ")}
          className="p-1.5 rounded-lg hover:bg-surface-700 hover:text-text-primary transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          title="Bullet List (- item)"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting("> ")}
          className="p-1.5 rounded-lg hover:bg-surface-700 hover:text-text-primary transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          title="Blockquote (> quote)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting("`", "`")}
          className="p-1.5 rounded-lg hover:bg-surface-700 hover:text-text-primary transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          title="Code Block (`code`)"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Description Text Area */}
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3.5 bg-transparent border-none text-xs sm:text-sm text-text-primary focus:outline-none resize-y scrollbar-thin leading-relaxed"
      />
    </div>
  );
};

export default DescriptionRichEditor;
