import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { applyGlobalTheme } from "../../utils/theme";

export default function AppearanceSettings() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("cl-theme") || "cyberpunk");

  useEffect(() => {
    if (user) {
      const savedUserTheme = localStorage.getItem(`cl-theme-user-${user.id}`);
      if (savedUserTheme) {
        setTheme(savedUserTheme);
      }
    }
  }, [user]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyGlobalTheme(newTheme, user?.id);
  };

  return (
    <div id="appearance" className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-5 scroll-mt-20">
      <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
        <Palette className="w-4 h-4 text-warning" /> Theme & Interface Appearance
      </h2>

      <div className="space-y-4">
        <p className="text-xs text-text-muted leading-relaxed">
          Choose a visual theme profile that fits your aesthetic. Changes will apply instantly across the session.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Dark Themes */}
          <button
            type="button"
            onClick={() => handleThemeChange("cyberpunk")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "cyberpunk"
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">👾 Cyberpunk Neon</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Futuristic dark slate, vibrant gradients, and gridlines.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("matrix")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "matrix"
                ? "border-success bg-success/10"
                : "border-border hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">📟 Neon Matrix</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Carbon black backgrounds with digital green glows.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("slate")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "slate"
                ? "border-accent bg-accent/10"
                : "border-border hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🌌 Slate Space</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Minimalist deep space navy with silver lines and soft glows.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("glass")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "glass"
                ? "border-info bg-info/10"
                : "border-border hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">💎 Glassmorphism</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Rich translucent containers and colorful backgrounds.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("maroon-spider")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "maroon-spider"
                ? "border-rose-900 bg-rose-950/20 text-rose-800"
                : "border-border hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🕷️ Maroon Spider (Dark)</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Dark mode. Velvet black surfaces with crimson web lines and deep maroon details.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("dark-pink")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "dark-pink"
                ? "border-pink-400 bg-pink-950/20 text-pink-400"
                : "border-border hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🌺 Dark Pink</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Dark mode. Black-cherry background with hot pink highlights and rose details.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("dark-orange")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "dark-orange"
                ? "border-orange-400 bg-orange-950/20 text-orange-400"
                : "border-border hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🔥 Dark Orange</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Dark mode. Ember charcoal background with glowing orange accents.</span>
          </button>

          {/* Light Themes */}
          <button
            type="button"
            onClick={() => handleThemeChange("light-classic")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "light-classic"
                ? "border-amber-500 bg-amber-500/10 text-amber-500"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">☀️ Classic Light</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Washed slate surfaces, warm amber accents, and indigo details.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("light-neo")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "light-neo"
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">⚡ Neon Light</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Crisp neutral white with electric cyan lines and hot pink glows.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("light-mint")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "light-mint"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🍃 Mint Light</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Soothing mint base, deep forest text, and vibrant emerald accents.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("light-lavender")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "light-lavender"
                ? "border-purple-500 bg-purple-500/10 text-purple-500"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🦄 Lavender Mist</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Soft purple base, lavender mist cards, and orchid accents.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("light-retro")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "light-retro"
                ? "border-amber-700 bg-amber-700/10 text-amber-700"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">📜 Sand Retro</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Warm sand cream backgrounds, sepia text, and deep amber highlights.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("maroon-spider-light")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "maroon-spider-light"
                ? "border-rose-900 bg-rose-50/25 text-rose-850"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🕷️ Maroon Spider (Light)</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Light mode. Soft rose-tinted surfaces with deep maroon outlines and crimson details.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("light-neon-pink")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "light-neon-pink"
                ? "border-pink-500 bg-pink-500/10 text-pink-500"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">⚡ Neon Pink Light</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Light mode. Crisp neutral white with electric pink lines and hot cyan glows.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("light-pink")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "light-pink"
                ? "border-pink-500 bg-pink-500/10 text-pink-500"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🌸 Light Pink</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Soft rose light background with warm pink accents and deep burgundy text.</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("light-orange")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              theme === "light-orange"
                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                : "border-border hover:bg-black/5"
            }`}
          >
            <span className="text-xs font-bold text-text-primary block">🍊 Light Orange</span>
            <span className="text-[9px] text-text-muted mt-0.5 block">Soft orange cream light background with warm citrus highlights and brown text.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
