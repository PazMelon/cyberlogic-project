import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { Terminal as TerminalIcon, Maximize2, Minimize2, Circle } from "lucide-react";
import { cliFileSystem, terminalMessages } from "../data/cliConfig";
import { CLI_THEMES, applyGlobalTheme } from "../utils/theme";



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
    if (!CLI_THEMES[themeName]) return false;
    applyGlobalTheme(themeName);
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
