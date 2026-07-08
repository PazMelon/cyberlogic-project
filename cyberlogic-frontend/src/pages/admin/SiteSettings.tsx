import { useState, useEffect } from "react";
import { RotateCcw, Check, Palette, Eye, Shield, Calendar, Settings } from "lucide-react";
import { applyGlobalTheme } from "../../utils/theme";
import { fetchSiteSettings, updateSiteSettings } from "../../utils/api";
import AboutMissionVisionSettings from "../../components/admin/about/AboutMissionVisionSettings";
import AboutHistorySettings from "../../components/admin/about/AboutHistorySettings";
import AboutOfficerSettings from "../../components/admin/about/AboutOfficerSettings";

const availableThemes = [
  { value: "cyberpunk", label: "👾 Cyberpunk Neon", desc: "Dark mode. Futuristic dark slate, vibrant gradients, and gridlines." },
  { value: "matrix", label: "📟 Neon Matrix", desc: "Dark mode. Carbon black backgrounds with digital green glows." },
  { value: "slate", label: "🌌 Slate Space", desc: "Dark mode. Minimalist deep space navy with silver lines and soft glows." },
  { value: "glass", label: "💎 Glassmorphism", desc: "Dark mode. Rich translucent containers and colorful backgrounds." },
  { value: "light-classic", label: "☀️ Classic Light", desc: "Light mode. Washed slate surfaces, warm amber accents, and indigo details." },
  { value: "light-neo", label: "⚡ Neon Light", desc: "Light mode. Crisp neutral white with electric cyan lines and hot pink glows." },
  { value: "light-mint", label: "🍃 Mint Light", desc: "Light mode. Soothing mint base, deep forest text, and emerald accents." },
  { value: "light-lavender", label: "🦄 Lavender Mist", desc: "Light mode. Soft purple base, lavender mist cards, and orchid accents." },
  { value: "light-retro", label: "📜 Sand Retro", desc: "Light mode. Warm sand cream backgrounds, sepia text, and amber highlights." },
  { value: "maroon-spider", label: "🕷️ Maroon Spider", desc: "Dark mode. Velvet black surfaces with crimson web lines and deep maroon details." }
];

export default function SiteSettings() {
  const [activeTab, setActiveTab] = useState<"theme" | "about_mv" | "about_history" | "about_officers">("theme");
  const [defaultTheme, setDefaultTheme] = useState("cyberpunk");
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await fetchSiteSettings();
        if (settings && settings.default_theme) {
          setDefaultTheme(settings.default_theme);
        }
      } catch (err) {
        console.error("Failed to load site settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSelectTheme = (themeName: string) => {
    setDefaultTheme(themeName);
    applyGlobalTheme(themeName, null);
    setSaved(false);
  };

  const resetAll = async () => {
    try {
      setDefaultTheme("cyberpunk");
      applyGlobalTheme("cyberpunk", null);
      await updateSiteSettings({ default_theme: "cyberpunk" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert("Failed to reset settings.");
    }
  };

  const saveSettings = async () => {
    try {
      await updateSiteSettings({ default_theme: defaultTheme });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || "Failed to save settings.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Site Settings & CMS
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Configure default portal behavior, page contents, layout settings, and presets.
          </p>
        </div>
        {activeTab === "theme" && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-amber-500/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset Defaults
            </button>
            <button
              type="button"
              onClick={saveSettings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              {saved ? <Check className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
              {saved ? "Saved!" : "Save Settings"}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/40 gap-4 overflow-x-auto pb-px">
        {[
          { key: "theme", label: "Portal Theme", icon: Palette },
          { key: "about_mv", label: "Mission & Vision", icon: Eye },
          { key: "about_history", label: "Club History", icon: Calendar },
          { key: "about_officers", label: "Officers List", icon: Shield }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="space-y-6">
        {activeTab === "theme" && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-text-primary">Default Portal Theme</h2>
              <p className="text-xs text-text-muted mt-1">
                Choose the default theme profile applied to new guests and users who haven't set a custom theme preference.
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-xs text-text-muted">Loading settings...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableThemes.map((t) => {
                  const isSelected = defaultTheme === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handleSelectTheme(t.value)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-32 ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface-900/50 hover:bg-white/5 hover:border-border/80"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-text-primary block">{t.label}</span>
                        <span className="text-[10px] text-text-muted mt-1.5 block leading-relaxed">{t.desc}</span>
                      </div>
                      {isSelected && (
                        <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "about_mv" && <AboutMissionVisionSettings />}

        {activeTab === "about_history" && <AboutHistorySettings />}

        {activeTab === "about_officers" && <AboutOfficerSettings />}
      </div>
    </div>
  );
}
