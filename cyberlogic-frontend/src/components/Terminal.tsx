import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { Terminal as TerminalIcon, Maximize2, Minimize2, Circle } from "lucide-react";
import { cliFileSystem, terminalMessages } from "../data/cliConfig";

// Predefined CLI themes that update root CSS custom properties
const CLI_THEMES: Record<string, Record<string, string>> = {
  cyber: {
    "--cl-primary": "#06b6d4",
    "--cl-primary-light": "#22d3ee",
    "--cl-primary-dark": "#0891b2",
    "--cl-primary-glow": "rgba(6, 182, 212, 0.3)",
    "--cl-accent": "#a855f7",
    "--cl-accent-light": "#c084fc",
    "--cl-accent-dark": "#9333ea",
    "--cl-accent-glow": "rgba(168, 85, 247, 0.3)",
    "--cl-surface-950": "#0a0e1a",
    "--cl-surface-900": "#0f1729",
    "--cl-surface-800": "#151d33",
  },
  matrix: {
    "--cl-primary": "#22c55e",
    "--cl-primary-light": "#4ade80",
    "--cl-primary-dark": "#16a34a",
    "--cl-primary-glow": "rgba(34, 197, 94, 0.3)",
    "--cl-accent": "#10b981",
    "--cl-accent-light": "#34d399",
    "--cl-accent-dark": "#059669",
    "--cl-accent-glow": "rgba(16, 185, 129, 0.3)",
    "--cl-surface-950": "#030804",
    "--cl-surface-900": "#061208",
    "--cl-surface-800": "#0a1d0d",
  },
  amber: {
    "--cl-primary": "#f59e0b",
    "--cl-primary-light": "#fbbf24",
    "--cl-primary-dark": "#d97706",
    "--cl-primary-glow": "rgba(245, 158, 11, 0.3)",
    "--cl-accent": "#ea580c",
    "--cl-accent-light": "#f97316",
    "--cl-accent-dark": "#c2410c",
    "--cl-accent-glow": "rgba(234, 88, 12, 0.3)",
    "--cl-surface-950": "#0d0702",
    "--cl-surface-900": "#160d04",
    "--cl-surface-800": "#231407",
  },
  rose: {
    "--cl-primary": "#f43f5e",
    "--cl-primary-light": "#fb7185",
    "--cl-primary-dark": "#e11d48",
    "--cl-primary-glow": "rgba(244, 63, 94, 0.3)",
    "--cl-accent": "#d946ef",
    "--cl-accent-light": "#e879f9",
    "--cl-accent-dark": "#c084fc",
    "--cl-accent-glow": "rgba(217, 70, 239, 0.3)",
    "--cl-surface-950": "#0e0207",
    "--cl-surface-900": "#17040d",
    "--cl-surface-800": "#250616",
  },
  royal: {
    "--cl-primary": "#3b82f6",
    "--cl-primary-light": "#60a5fa",
    "--cl-primary-dark": "#2563eb",
    "--cl-primary-glow": "rgba(59, 130, 246, 0.3)",
    "--cl-accent": "#6366f1",
    "--cl-accent-light": "#818cf8",
    "--cl-accent-dark": "#4f46e5",
    "--cl-accent-glow": "rgba(99, 102, 241, 0.3)",
    "--cl-surface-950": "#030712",
    "--cl-surface-900": "#0b0f19",
    "--cl-surface-800": "#121824",
  },
  light_classic: {
    "--cl-primary": "#d97706",
    "--cl-primary-light": "#f59e0b",
    "--cl-primary-dark": "#b45309",
    "--cl-primary-glow": "rgba(217, 119, 6, 0.15)",
    "--cl-accent": "#4f46e5",
    "--cl-accent-light": "#6366f1",
    "--cl-accent-dark": "#3730a3",
    "--cl-accent-glow": "rgba(79, 70, 229, 0.15)",
    "--cl-surface-950": "#f8fafc",
    "--cl-surface-900": "#f1f5f9",
    "--cl-surface-800": "#e2e8f0",
    "--cl-surface-700": "#cbd5e1",
    "--cl-surface-600": "#94a3b8",
    "--cl-text-primary": "#0f172a",
    "--cl-text-secondary": "#334155",
    "--cl-text-muted": "#64748b",
    "--cl-border": "rgba(15, 23, 42, 0.08)",
    "--cl-border-light": "rgba(15, 23, 42, 0.04)",
    "--cl-glass": "rgba(248, 250, 252, 0.8)",
    "--cl-glass-light": "rgba(248, 250, 252, 0.4)",
  },
  light_neo: {
    "--cl-primary": "#0891b2",
    "--cl-primary-light": "#06b6d4",
    "--cl-primary-dark": "#0e7490",
    "--cl-primary-glow": "rgba(8, 145, 178, 0.15)",
    "--cl-accent": "#db2777",
    "--cl-accent-light": "#ec4899",
    "--cl-accent-dark": "#be185d",
    "--cl-accent-glow": "rgba(219, 39, 119, 0.15)",
    "--cl-surface-950": "#ffffff",
    "--cl-surface-900": "#fafafa",
    "--cl-surface-800": "#f5f5f5",
    "--cl-surface-700": "#e5e5e5",
    "--cl-surface-600": "#d4d4d4",
    "--cl-text-primary": "#171717",
    "--cl-text-secondary": "#404040",
    "--cl-text-muted": "#737373",
    "--cl-border": "rgba(23, 23, 23, 0.08)",
    "--cl-border-light": "rgba(23, 23, 23, 0.04)",
    "--cl-glass": "rgba(255, 255, 255, 0.85)",
    "--cl-glass-light": "rgba(255, 255, 255, 0.45)",
  },
  light_mint: {
    "--cl-primary": "#059669",
    "--cl-primary-light": "#10b981",
    "--cl-primary-dark": "#047857",
    "--cl-primary-glow": "rgba(5, 150, 105, 0.15)",
    "--cl-accent": "#0284c7",
    "--cl-accent-light": "#0ea5e9",
    "--cl-accent-dark": "#0369a1",
    "--cl-accent-glow": "rgba(2, 132, 199, 0.15)",
    "--cl-surface-950": "#f0fdf4",
    "--cl-surface-900": "#dcfce7",
    "--cl-surface-800": "#bbf7d0",
    "--cl-surface-700": "#86efac",
    "--cl-surface-600": "#4ade80",
    "--cl-text-primary": "#14532d",
    "--cl-text-secondary": "#166534",
    "--cl-text-muted": "#15803d",
    "--cl-border": "rgba(20, 83, 45, 0.08)",
    "--cl-border-light": "rgba(20, 83, 45, 0.04)",
    "--cl-glass": "rgba(240, 253, 244, 0.8)",
    "--cl-glass-light": "rgba(240, 253, 244, 0.4)",
  },
  light_lavender: {
    "--cl-primary": "#8b5cf6",
    "--cl-primary-light": "#a78bfa",
    "--cl-primary-dark": "#7c3aed",
    "--cl-primary-glow": "rgba(139, 92, 246, 0.15)",
    "--cl-accent": "#db2777",
    "--cl-accent-light": "#ec4899",
    "--cl-accent-dark": "#be185d",
    "--cl-accent-glow": "rgba(219, 39, 119, 0.15)",
    "--cl-surface-950": "#faf5ff",
    "--cl-surface-900": "#f3e8ff",
    "--cl-surface-800": "#e9d5ff",
    "--cl-surface-700": "#d8b4fe",
    "--cl-surface-600": "#c084fc",
    "--cl-text-primary": "#3b0764",
    "--cl-text-secondary": "#581c87",
    "--cl-text-muted": "#701a75",
    "--cl-border": "rgba(59, 7, 100, 0.08)",
    "--cl-border-light": "rgba(59, 7, 100, 0.04)",
    "--cl-glass": "rgba(250, 245, 255, 0.8)",
    "--cl-glass-light": "rgba(250, 245, 255, 0.4)",
  },
  light_retro: {
    "--cl-primary": "#b45309",
    "--cl-primary-light": "#d97706",
    "--cl-primary-dark": "#78350f",
    "--cl-primary-glow": "rgba(180, 83, 9, 0.15)",
    "--cl-accent": "#0d9488",
    "--cl-accent-light": "#14b8a6",
    "--cl-accent-dark": "#0f766e",
    "--cl-accent-glow": "rgba(13, 148, 136, 0.15)",
    "--cl-surface-950": "#fdfbf7",
    "--cl-surface-900": "#f5f0e6",
    "--cl-surface-800": "#eaddca",
    "--cl-surface-700": "#d8c3a5",
    "--cl-surface-600": "#c8ad8d",
    "--cl-text-primary": "#451a03",
    "--cl-text-secondary": "#78350f",
    "--cl-text-muted": "#92400e",
    "--cl-border": "rgba(69, 26, 3, 0.08)",
    "--cl-border-light": "rgba(69, 26, 3, 0.04)",
    "--cl-glass": "rgba(253, 251, 247, 0.8)",
    "--cl-glass-light": "rgba(253, 251, 247, 0.4)",
  },
};

interface HistoryItem {
  input?: string;
  output: string;
  isError?: boolean;
}

export default function Terminal() {
  const [history, setHistory] = useState<HistoryItem[]>([
    { output: terminalMessages.welcomeHeader },
  ]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Scroll inner terminal to bottom on history change
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on terminal container click
  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      processCommand(trimmedInput);
      setCmdHistory((prev) => [...prev, trimmedInput]);
      setInput("");
      setHistoryIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInput(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      autoComplete();
    }
  };

  const autoComplete = () => {
    const parts = input.split(" ");
    const cmd = parts[0];
    const arg = parts.slice(1).join(" ");

    if (parts.length === 1) {
      // Autocomplete command name
      const commands = ["help", "ls", "cat", "clear", "theme", "join", "socials"];
      const matches = commands.filter((c) => c.startsWith(cmd));
      if (matches.length === 1) {
        setInput(matches[0] + " ");
      }
    } else if (cmd === "cat") {
      // Autocomplete file name
      const files = Object.keys(cliFileSystem);
      const matches = files.filter((f) => f.startsWith(arg));
      if (matches.length === 1) {
        setInput(`cat ${matches[0]}`);
      }
    } else if (cmd === "theme") {
      // Autocomplete theme profile
      const themes = Object.keys(CLI_THEMES);
      const matches = themes.filter((t) => t.startsWith(arg));
      if (matches.length === 1) {
        setInput(`theme ${matches[0]}`);
      }
    }
  };

  const applyTheme = (themeName: string) => {
    const themeProps = CLI_THEMES[themeName];
    if (!themeProps) return false;

    // Apply color values to root element styling
    Object.entries(themeProps).forEach(([variable, value]) => {
      document.documentElement.style.setProperty(variable, value);
    });
    return true;
  };

  const processCommand = (rawInput: string) => {
    const parts = rawInput.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output = "";
    let isError = false;

    switch (command) {
      case "help":
        output = `AVAILABLE COMMANDS:
  ls                  List available simulated documents
  cat [filename]      View the content of a document (e.g. cat about.md)
  theme [name]        Interactively swap portal colors (matrix, amber, rose, royal, cyber, light_classic, light_neo, light_mint, light_lavender, light_retro)
  join                Redirect to sign-up registration page
  socials             Display club contact & social media channels
  clear               Flush terminal history logs
  help                Display this user assistance screen`;
        break;

      case "ls":
        output = Object.entries(cliFileSystem)
          .map(([name, file]) => {
            const size = file.content.length;
            const cat = file.category.padEnd(7);
            return `${cat}  ${size.toString().padStart(4)} B  ${name}  -  ${file.description}`;
          })
          .join("\n");
        break;

      case "cat": {
        const filename = args[0];
        if (!filename) {
          output = terminalMessages.catUsage;
          isError = true;
        } else {
          const file = cliFileSystem[filename];
          if (file) {
            output = file.content;
          } else {
            output = `cat: ${filename}: No such file or directory. Try 'ls' to check files.`;
            isError = true;
          }
        }
        break;
      }

      case "theme": {
        const selectedTheme = args[0]?.toLowerCase();
        if (!selectedTheme) {
          output = terminalMessages.themeUsage;
          isError = true;
        } else {
          const success = applyTheme(selectedTheme);
          if (success) {
            output = `System theme successfully updated to: '${selectedTheme}' profile.\nCustom accents and surface variables have been refreshed dynamically.`;
          } else {
            output = `theme: profile not found: '${selectedTheme}'.\nSupported profiles: cyber, matrix, amber, rose, royal, light_classic, light_neo, light_mint, light_lavender, light_retro.`;
            isError = true;
          }
        }
        break;
      }

      case "join":
        output = "Redirecting to membership sign up registration page...";
        setTimeout(() => {
          navigate("/register");
        }, 1500);
        break;

      case "socials":
        output = `CYBERLOGIC CONNECTIVITY:
------------------------
- Email:     cyberlogic@university.edu
- Website:   http://localhost:5175
- Dev Repo:  github.com/cyberlogic-project
- Physical:  IT Room 301, Tech Building`;
        break;

      case "clear":
        setHistory([]);
        return;

      default:
        output = terminalMessages.notFound(command);
        isError = true;
    }

    setHistory((prev) => [...prev, { input: rawInput, output, isError }]);
  };

  return (
    <div
      onClick={focusInput}
      className={`glass rounded-2xl border border-border/20 shadow-2xl flex flex-col font-mono text-left cursor-text transition-all duration-300 w-full ${
        isMaximized
          ? "fixed inset-4 z-50 bg-surface-950"
          : "relative h-[420px] max-w-2xl mx-auto"
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-900/80 border-b border-border/30 rounded-t-2xl">
        <div className="flex items-center gap-1.5">
          <Circle className="w-3 h-3 fill-red-500/80 text-transparent" />
          <Circle className="w-3 h-3 fill-yellow-500/80 text-transparent" />
          <Circle className="w-3 h-3 fill-green-500/80 text-transparent" />
          <div className="flex items-center gap-1.5 text-xs text-text-secondary ml-3">
            <TerminalIcon className="w-3.5 h-3.5 text-primary" />
            <span>sh - guest@cyberlogic:~</span>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMaximized(!isMaximized);
          }}
          className="text-text-muted hover:text-text-secondary transition-colors"
          aria-label={isMaximized ? "Minimize terminal" : "Maximize terminal"}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Terminal Output Stream */}
      <div
        ref={terminalBodyRef}
        className="flex-1 p-4 overflow-y-auto text-xs sm:text-sm text-text-primary space-y-4 select-text"
      >
        {history.map((item, idx) => (
          <div key={idx} className="space-y-1.5 whitespace-pre-wrap">
            {item.input && (
              <div className="flex items-center gap-1.5 text-primary-light">
                <span className="text-accent-light font-bold">guest@cyberlogic</span>
                <span className="text-text-muted">:~$</span>
                <span>{item.input}</span>
              </div>
            )}
            <div
              className={
                item.isError
                  ? "text-red-400"
                  : idx === 0
                  ? "text-primary/90 font-semibold"
                  : "text-text-secondary"
              }
            >
              {item.output}
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Input Bar */}
      <div className="p-4 bg-surface-900/35 border-t border-border/20 flex items-center gap-2 rounded-b-2xl">
        <span className="text-accent-light font-bold text-xs sm:text-sm">guest@cyberlogic</span>
        <span className="text-text-muted text-xs sm:text-sm">:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-primary text-xs sm:text-sm caret-primary focus:ring-0 p-0 font-mono"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="Type 'help' to start..."
        />
      </div>
    </div>
  );
}
