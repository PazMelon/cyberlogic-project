import { useState, useEffect, useRef } from "react";
import { Palette, X, RefreshCw, Moon, Sun, Check, Move } from "lucide-react";
import { applyGlobalTheme } from "../../utils/theme";

interface ThemeOption {
  key: string;
  label: string;
  isDark: boolean;
  primaryColor: string;
}

type Corner = "bottom-left" | "bottom-right" | "top-left" | "top-right";

const THEME_OPTIONS: ThemeOption[] = [
  // Dark Themes
  { key: "cyber", label: "Cyberlogic Default", isDark: true, primaryColor: "#06b6d4" },
  { key: "matrix", label: "Matrix Green", isDark: true, primaryColor: "#22c55e" },
  { key: "royal", label: "Royal Blue", isDark: true, primaryColor: "#3b82f6" },
  { key: "rose", label: "Cyber Rose", isDark: true, primaryColor: "#f43f5e" },
  { key: "amber", label: "Cyber Amber", isDark: true, primaryColor: "#f59e0b" },
  { key: "dark_pink", label: "Dark Pink", isDark: true, primaryColor: "#ec4899" },
  { key: "dark_orange", label: "Dark Orange", isDark: true, primaryColor: "#f97316" },
  { key: "maroon_spider", label: "Maroon Spider", isDark: true, primaryColor: "#881337" },

  // Light Themes
  { key: "light_classic", label: "Classic Light", isDark: false, primaryColor: "#d97706" },
  { key: "light_neo", label: "Neo Light", isDark: false, primaryColor: "#0891b2" },
  { key: "light_mint", label: "Mint Green", isDark: false, primaryColor: "#059669" },
  { key: "light_lavender", label: "Lavender Purple", isDark: false, primaryColor: "#8b5cf6" },
  { key: "light_retro", label: "Retro Sand", isDark: false, primaryColor: "#b45309" },
  { key: "light_pink", label: "Soft Pink", isDark: false, primaryColor: "#db2777" },
  { key: "light_orange", label: "Soft Orange", isDark: false, primaryColor: "#ea580c" },
  { key: "light_neon_pink", label: "Neon Pink Light", isDark: false, primaryColor: "#db2777" },
  { key: "maroon_spider_light", label: "Maroon Spider Light", isDark: false, primaryColor: "#881337" },
];

export default function DevThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem("cl-theme") || "cyber";
  });

  const [corner, setCorner] = useState<Corner>(() => {
    return (localStorage.getItem("cl-dev-theme-switcher-corner") as Corner) || "bottom-left";
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const handleSelectTheme = (themeKey: string) => {
    setActiveTheme(themeKey);
    applyGlobalTheme(themeKey);
  };

  const handleReset = () => {
    const savedTheme = localStorage.getItem("cl-theme") || "cyber";
    setActiveTheme(savedTheme);
    applyGlobalTheme(savedTheme);
  };

  // Dragging start logic
  const startDrag = (clientX: number, clientY: number) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    setDragPos({ x: rect.left, y: rect.top });
    setIsDragging(true);
    hasMovedRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Dragging move & snap logic
  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (clientX: number, clientY: number) => {
      hasMovedRef.current = true;
      const newX = Math.max(8, Math.min(window.innerWidth - 48, clientX - dragOffsetRef.current.x));
      const newY = Math.max(8, Math.min(window.innerHeight - 48, clientY - dragOffsetRef.current.y));
      setDragPos({ x: newX, y: newY });
    };

    const onMouseMove = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onPointerUp = () => {
      setIsDragging(false);
      if (dragPos) {
        // Calculate nearest corner
        const midX = window.innerWidth / 2;
        const midY = window.innerHeight / 2;
        const isLeft = dragPos.x + 20 < midX;
        const isTop = dragPos.y + 20 < midY;

        let targetCorner: Corner = "bottom-left";
        if (isTop && isLeft) targetCorner = "top-left";
        else if (isTop && !isLeft) targetCorner = "top-right";
        else if (!isTop && isLeft) targetCorner = "bottom-left";
        else if (!isTop && !isLeft) targetCorner = "bottom-right";

        setCorner(targetCorner);
        localStorage.setItem("cl-dev-theme-switcher-corner", targetCorner);
      }
      setDragPos(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onPointerUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [isDragging, dragPos]);

  // Corner positioning CSS
  const getCornerStyle = (): React.CSSProperties => {
    if (dragPos) {
      return {
        position: "fixed",
        left: `${dragPos.x}px`,
        top: `${dragPos.y}px`,
        zIndex: 99999,
        transition: "none",
      };
    }

    const base: React.CSSProperties = { position: "fixed", zIndex: 99999, transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" };
    switch (corner) {
      case "top-left":
        return { ...base, top: "16px", left: "16px" };
      case "top-right":
        return { ...base, top: "16px", right: "16px" };
      case "bottom-right":
        return { ...base, bottom: "16px", right: "16px" };
      case "bottom-left":
      default:
        return { ...base, bottom: "16px", left: "16px" };
    }
  };

  const isTop = corner.startsWith("top");
  const isRight = corner.endsWith("right");

  return (
    <div
      ref={buttonRef}
      style={getCornerStyle()}
      className="flex flex-col items-start gap-2 select-none font-sans"
    >
      {/* Floating Draggable Toggle Button */}
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => {
          if (!hasMovedRef.current) {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-11 h-11 rounded-full bg-slate-900 border border-slate-700/80 text-white shadow-2xl hover:scale-105 active:scale-95 hover:bg-slate-800 transition-transform flex items-center justify-center cursor-grab active:cursor-grabbing group relative ${
          isDragging ? "ring-2 ring-cyan-400 scale-110" : ""
        }`}
        title="Drag to snap corners • Click to swap theme"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-rose-400" />
        ) : (
          <Palette className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
        )}

        {/* Small Drag Icon */}
        <span className="absolute -bottom-1 -right-1 bg-slate-800 border border-slate-700 rounded-full p-0.5 text-slate-400">
          <Move className="w-2.5 h-2.5" />
        </span>

        {/* DEV badge */}
        <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 font-extrabold text-[8px] px-1 rounded-sm tracking-wider shadow-xs">
          DEV
        </span>
      </button>

      {/* Expanded Switcher Panel (Positioned relative to snapped corner) */}
      {isOpen && (
        <div
          className={`w-72 max-h-[380px] overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-950/95 backdrop-blur-md p-4 text-slate-200 shadow-2xl animate-in fade-in duration-200 flex flex-col gap-3.5 ${
            isTop ? "mt-2" : ""
          } ${isRight ? "self-end" : "self-start"}`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div>
              <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dev Theme Swapper</span>
              </p>
              <p className="text-[10px] text-slate-400">Drag DEV button to snap corners</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="p-1 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-cyan-400 cursor-pointer"
              title="Reset to User Saved Theme"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dark Themes Group */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Dark Themes ({THEME_OPTIONS.filter((t) => t.isDark).length})</span>
            </p>
            <div className="grid grid-cols-1 gap-1">
              {THEME_OPTIONS.filter((t) => t.isDark).map((theme) => {
                const isActive = activeTheme === theme.key || activeTheme === theme.key.replace("_", "-");
                return (
                  <button
                    key={theme.key}
                    type="button"
                    onClick={() => handleSelectTheme(theme.key)}
                    className={`w-full p-2 rounded-xl text-left text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-800 border-cyan-500/50 text-cyan-400 shadow-sm"
                        : "bg-slate-900/60 border-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <span className="truncate">{theme.label}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Light Themes Group */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Light Themes ({THEME_OPTIONS.filter((t) => !t.isDark).length})</span>
            </p>
            <div className="grid grid-cols-1 gap-1">
              {THEME_OPTIONS.filter((t) => !t.isDark).map((theme) => {
                const isActive = activeTheme === theme.key || activeTheme === theme.key.replace("_", "-");
                return (
                  <button
                    key={theme.key}
                    type="button"
                    onClick={() => handleSelectTheme(theme.key)}
                    className={`w-full p-2 rounded-xl text-left text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-800 border-cyan-500/50 text-cyan-400 shadow-sm"
                        : "bg-slate-900/60 border-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <span className="truncate">{theme.label}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
