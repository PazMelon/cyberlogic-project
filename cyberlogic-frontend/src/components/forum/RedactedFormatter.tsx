import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

interface RedactedFormatterProps {
  content: string;
  isRedacted?: boolean;
}

export function RedactedFormatter({ content, isRedacted = false }: RedactedFormatterProps) {
  const [decrypted, setDecrypted] = useState(!isRedacted);
  const [displayText, setDisplayText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Decryption effect for thread-level redacted content
  useEffect(() => {
    if (!isRedacted || decrypted) {
      setDisplayText(content);
      return;
    }

    // Masked default state
    setDisplayText(content.replace(/[a-zA-Z0-9]/g, "█"));
  }, [content, isRedacted, decrypted]);

  const handleDecrypt = () => {
    if (isDecrypting || decrypted) return;
    setIsDecrypting(true);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
    const originalText = content;
    let iteration = 0;
    const intervalTime = 20; // ms
    const totalDuration = 600; // ms
    const maxIterations = totalDuration / intervalTime;

    const interval = setInterval(() => {
      setDisplayText(() => {
        return originalText
          .split("")
          .map((char, index) => {
            if (char === " " || char === "\n" || char === "<" || char === ">" || char === "/") {
              return char;
            }
            // Decrypt index-by-index progressively
            if (index < (iteration / maxIterations) * originalText.length) {
              return originalText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
      });

      iteration += 1;
      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDecrypted(true);
        setIsDecrypting(false);
      }
    }, intervalTime);
  };

  // Helper to parse inline spoiler markdown: ||text|| or >!text!<
  const parseInlineSpoilers = (text: string) => {

    // Standard string replacement for inline spoilers
    // To support standard HTML string inputs
    let cleanText = text;
    
    // 1. Match direct images / gif URLs first (ending in png, jpg, jpeg, gif, webp)
    cleanText = cleanText.replace(/(https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S+)?)/gi, '<div class="my-2 max-w-full"><img src="$1" alt="Embed" class="max-h-80 rounded-xl object-contain border border-border/40" /></div>');
    
    // 2. Match other links to make them clickable anchors
    cleanText = cleanText.replace(/(?<!src=")(https?:\/\/(?!\S+\.(?:png|jpe?g|gif|webp))\S+)/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-semibold">$1</a>');

    // 3. Spoilers & Mentions
    cleanText = cleanText.replace(/(?:\|\|)([^\s].*?[^\s]|[^\s])(?:\|\|)/g, '<span class="inline-spoiler" title="Click to reveal">$1</span>')
      .replace(/(?:&gt;!|>!)([^\s].*?[^\s]|[^\s])(?:!&lt;|!<)/g, '<span class="inline-spoiler" title="Click to reveal">$1</span>')
      .replace(/@([a-zA-Z0-9_\-\.]+)/g, '<a href="/app/u/$1" class="text-primary hover:underline font-semibold">@$1</a>');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: cleanText }} 
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("inline-spoiler")) {
            target.classList.add("revealed");
          }
        }}
      />
    );
  };

  // Add styles to handle inline spoilers in this scope
  useEffect(() => {
    const styleId = "inline-spoiler-styles";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .inline-spoiler {
          background-color: #0c0f17 !important;
          color: transparent !important;
          cursor: pointer;
          border-radius: 4px;
          padding: 0px 4px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-family: monospace;
          transition: all 0.3s ease;
          user-select: none;
        }
        .inline-spoiler.revealed {
          background-color: rgba(239, 68, 68, 0.05) !important;
          color: #ef4444 !important;
          border: 1px solid rgba(239, 68, 68, 0.3);
          user-select: text;
        }
        .inline-spoiler:hover:not(.revealed) {
          border-color: rgba(239, 68, 68, 0.5);
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  if (isRedacted && !decrypted) {
    return (
      <div className="relative group overflow-hidden rounded-xl border border-error/10 bg-black/40 font-[family-name:var(--font-mono)] p-4 leading-relaxed whitespace-pre-wrap select-none">
        {/* Censored Text Display */}
        <div className="text-text-muted/30 blur-[1px]">
          {displayText}
        </div>

        {/* Hacker Decrypt Overlay */}
        <button
          onClick={handleDecrypt}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 bg-surface-950/90 backdrop-blur-sm hover:bg-surface-950/80 transition-all duration-300 border border-transparent hover:border-error/20"
        >
          <ShieldAlert className="w-6 h-6 text-error animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-error uppercase">
            [CLASSIFIED DATA REDACTED]
          </span>
          <span className="text-[10px] text-text-muted mt-0.5">
            Click to bypass authorization and decrypt log
          </span>
        </button>
      </div>
    );
  }

  // If decrypted or regular thread, parse inline spoilers
  return (
    <div className={`leading-relaxed whitespace-pre-wrap ${isRedacted ? "font-[family-name:var(--font-mono)] text-error/95 p-4 rounded-xl border border-error/20 bg-error/5" : ""}`}>
      {parseInlineSpoilers(displayText)}
    </div>
  );
}
