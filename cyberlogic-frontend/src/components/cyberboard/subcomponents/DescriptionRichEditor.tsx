import React, { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  Quote,
  Code,
  Heading,
} from "lucide-react";

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
  const editorRef = useRef<HTMLDivElement>(null);

  // Active formatting state indicators
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    heading: false,
    unorderedList: false,
    quote: false,
    code: false,
  });

  const checkActiveStates = () => {
    if (!editorRef.current) return;
    try {
      const isBold = document.queryCommandState("bold");
      const isItalic = document.queryCommandState("italic");
      const isUnderline = document.queryCommandState("underline");
      const isStrike = document.queryCommandState("strikeThrough");
      const isList = document.queryCommandState("insertUnorderedList");

      const blockValue = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      const isHeading = blockValue === "h3" || blockValue === "heading";
      const isQuote = blockValue === "blockquote";
      const isCode = blockValue === "pre";

      setActiveStates({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strikeThrough: isStrike,
        heading: isHeading,
        unorderedList: isList,
        quote: isQuote,
        code: isCode,
      });
    } catch (_err) {}
  };

  // Convert legacy markdown format to HTML on initial mount
  const formatInitialHtml = (val: string) => {
    if (!val) return "";
    if (
      val.includes("<p>") ||
      val.includes("<strong>") ||
      val.includes("<b>") ||
      val.includes("<em>") ||
      val.includes("<i>") ||
      val.includes("<u>") ||
      val.includes("<del>") ||
      val.includes("<code>") ||
      val.includes("<h3>") ||
      val.includes("<ul>") ||
      val.includes("blockquote") ||
      val.includes("<pre>")
    ) {
      return val;
    }
    return val
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  };

  useEffect(() => {
    if (editorRef.current) {
      const formatted = formatInitialHtml(value);
      if (editorRef.current.innerHTML !== formatted) {
        editorRef.current.innerHTML = formatted;
      }
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      checkActiveStates();
    }
  };

  const execFormat = (cmd: string, val: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    checkActiveStates();
  };

  // Toggle Block Format (H3, BLOCKQUOTE, PRE) - toggles off to <p> if already active!
  const toggleBlockFormat = (blockTag: string, isActive: boolean) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (isActive) {
      document.execCommand("formatBlock", false, "p");
    } else {
      document.execCommand("formatBlock", false, blockTag);
    }
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    checkActiveStates();
  };

  return (
    <div className="space-y-1.5 border border-border/80 rounded-2xl bg-surface-900 overflow-hidden shadow-xs">
      {/* WYSIWYG Formatting Toolbar with Active Indicators (Sticky to top) */}
      <div className="sticky top-0 z-10 p-2 bg-surface-800/95 backdrop-blur-md border-b border-border/60 flex items-center gap-1 flex-wrap text-text-muted select-none">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("bold");
          }}
          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeStates.bold
              ? "bg-primary text-surface-950 font-black shadow-xs"
              : "hover:bg-surface-700 hover:text-text-primary text-text-muted"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("italic");
          }}
          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeStates.italic
              ? "bg-primary text-surface-950 font-black shadow-xs"
              : "hover:bg-surface-700 hover:text-text-primary text-text-muted"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("underline");
          }}
          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeStates.underline
              ? "bg-primary text-surface-950 font-black shadow-xs"
              : "hover:bg-surface-700 hover:text-text-primary text-text-muted"
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("strikeThrough");
          }}
          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeStates.strikeThrough
              ? "bg-primary text-surface-950 font-black shadow-xs"
              : "hover:bg-surface-700 hover:text-text-primary text-text-muted"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border/60 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleBlockFormat("H3", activeStates.heading);
          }}
          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeStates.heading
              ? "bg-cyan-500 text-surface-950 font-black shadow-xs"
              : "hover:bg-surface-700 hover:text-text-primary text-text-muted"
          }`}
          title="Heading (H3)"
        >
          <Heading className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("insertUnorderedList");
          }}
          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeStates.unorderedList
              ? "bg-cyan-500 text-surface-950 font-black shadow-xs"
              : "hover:bg-surface-700 hover:text-text-primary text-text-muted"
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleBlockFormat("BLOCKQUOTE", activeStates.quote);
          }}
          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeStates.quote
              ? "bg-cyan-500 text-surface-950 font-black shadow-xs"
              : "hover:bg-surface-700 hover:text-text-primary text-text-muted"
          }`}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleBlockFormat("PRE", activeStates.code);
          }}
          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeStates.code
              ? "bg-cyan-500 text-surface-950 font-black shadow-xs"
              : "hover:bg-surface-700 hover:text-text-primary text-text-muted"
          }`}
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ContentEditable Visual WYSIWYG Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={checkActiveStates}
        onMouseUp={checkActiveStates}
        onClick={checkActiveStates}
        data-placeholder={placeholder}
        className="w-full min-h-[110px] p-3.5 bg-transparent text-xs sm:text-sm text-text-primary focus:outline-none resize-y overflow-y-auto scrollbar-thin leading-relaxed font-medium prose prose-invert max-w-none [&_h3]:text-base [&_h3]:font-black [&_h3]:text-primary [&_h3]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-muted [&_pre]:bg-surface-950 [&_pre]:p-2.5 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-cyan-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1"
      />
    </div>
  );
};

export default DescriptionRichEditor;
