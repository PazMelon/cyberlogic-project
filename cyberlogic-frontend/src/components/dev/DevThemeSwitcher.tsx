import { useState } from "react";
import { Palette, X, RefreshCw, Moon, Sun, Check } from "lucide-react";
import { applyGlobalTheme } from "../../utils/theme";

interface ThemeOption {
  key: string;
  label: string;
  isDark: boolean;
  primaryColor: string;
}

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

  const handleSelectTheme = (themeKey: string) => {
    setActiveTheme(themeKey);
    applyGlobalTheme(themeKey);
  };

  const handleReset = () => {
    const savedTheme = localStorage.getItem("cl-theme") || "cyber";
    setActiveTheme(savedTheme);
    applyGlobalTheme(savedTheme);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[99999] flex flex-col items-start gap-2 select-none font-sans">
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700/80 text-white shadow-xl hover:scale-105 hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer group relative"
        title="Dev Mode Theme Switcher"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-rose-400" />
        ) : (
          <Palette className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
        )}
        {/* DEV badge */}
        <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 font-extrabold text-[8px] px-1 rounded-sm tracking-wider">
          DEV
        </span>
      </button>

      {/* Expanded Switcher Panel */}
      {isOpen && (
        <div className="w-72 max-h-[380px] overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-950/95 backdrop-blur-md p-4 text-slate-200 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-200 flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div>
              <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dev Theme Swapper</span>
              </p>
              <p className="text-[10px] text-slate-400">On-the-fly preview (dev-mode only)</p>
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
