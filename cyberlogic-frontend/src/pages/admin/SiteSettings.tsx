import { useState, useEffect } from "react";
import { RotateCcw, Check, Palette, Eye, Shield, Calendar, Share2 } from "lucide-react";
import { applyGlobalTheme } from "../../utils/theme";
import { fetchSiteSettings, updateSiteSettings } from "../../utils/api";
import { useDialog } from "../../utils/useDialog";
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

import { useSEO } from "../../utils/useSEO";

export default function SiteSettings() {
  useSEO({
    title: "Site Settings & CMS",
    description: "Manage default theme, mission, vision, values, and officers lists for the portal.",
  });

  const { showAlert } = useDialog();
  const [activeTab, setActiveTab] = useState<"theme" | "about_mv" | "about_history" | "about_officers" | "connect_us">("theme");
  const [defaultTheme, setDefaultTheme] = useState("cyberpunk");
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Social Connect Links States
  const [connectWebsite, setConnectWebsite] = useState("");
  const [connectGithub, setConnectGithub] = useState("");
  const [connectLinkedin, setConnectLinkedin] = useState("");
  const [connectFacebook, setConnectFacebook] = useState("");
  const [connectTwitter, setConnectTwitter] = useState("");
  const [connectInstagram, setConnectInstagram] = useState("");
  const [connectEmail, setConnectEmail] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await fetchSiteSettings();
        if (settings) {
          if (settings.default_theme) setDefaultTheme(settings.default_theme);
          setConnectWebsite(settings.connect_website || "");
          setConnectGithub(settings.connect_github || "");
          setConnectLinkedin(settings.connect_linkedin || "");
          setConnectFacebook(settings.connect_facebook || "");
          setConnectTwitter(settings.connect_twitter || "");
          setConnectInstagram(settings.connect_instagram || "");
          setConnectEmail(settings.connect_email || "");
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
      showAlert({
        title: "Reset Failed",
        message: "Failed to reset settings.",
        type: "error",
      });
    }
  };

  const saveSettings = async () => {
    try {
      await updateSiteSettings({
        default_theme: defaultTheme,
        connect_website: connectWebsite,
        connect_github: connectGithub,
        connect_linkedin: connectLinkedin,
        connect_facebook: connectFacebook,
        connect_twitter: connectTwitter,
        connect_instagram: connectInstagram,
        connect_email: connectEmail,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      showAlert({
        title: "Save Failed",
        message: err.message || "Failed to save settings.",
        type: "error",
      });
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
        {(activeTab === "theme" || activeTab === "connect_us") && (
          <div className="flex items-center gap-3">
            {activeTab === "theme" && (
              <button
                type="button"
                onClick={resetAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-amber-500/30 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Reset Defaults
              </button>
            )}
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
          { key: "about_officers", label: "Officers List", icon: Shield },
          { key: "connect_us", label: "Connect Links", icon: Share2 }
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

        {activeTab === "connect_us" && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-text-primary">Connect With Us / Social Links</h2>
              <p className="text-xs text-text-muted mt-1">
                Customize the footer social link buttons and contact email displayed on the landing page footer. Leave empty to hide the respective link.
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-xs text-text-muted">Loading settings...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Website URL</label>
                    <input
                      type="url"
                      value={connectWebsite}
                      onChange={(e) => { setConnectWebsite(e.target.value); setSaved(false); }}
                      placeholder="https://example.com"
                      className="w-full bg-surface-900 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">GitHub URL</label>
                    <input
                      type="url"
                      value={connectGithub}
                      onChange={(e) => { setConnectGithub(e.target.value); setSaved(false); }}
                      placeholder="https://github.com/org"
                      className="w-full bg-surface-900 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">LinkedIn URL</label>
                    <input
                      type="url"
                      value={connectLinkedin}
                      onChange={(e) => { setConnectLinkedin(e.target.value); setSaved(false); }}
                      placeholder="https://linkedin.com/company/org"
                      className="w-full bg-surface-900 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Facebook URL</label>
                    <input
                      type="url"
                      value={connectFacebook}
                      onChange={(e) => { setConnectFacebook(e.target.value); setSaved(false); }}
                      placeholder="https://facebook.com/page"
                      className="w-full bg-surface-900 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Twitter / X URL</label>
                    <input
                      type="url"
                      value={connectTwitter}
                      onChange={(e) => { setConnectTwitter(e.target.value); setSaved(false); }}
                      placeholder="https://twitter.com/profile"
                      className="w-full bg-surface-900 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Instagram URL</label>
                    <input
                      type="url"
                      value={connectInstagram}
                      onChange={(e) => { setConnectInstagram(e.target.value); setSaved(false); }}
                      placeholder="https://instagram.com/profile"
                      className="w-full bg-surface-900 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Contact Email Address</label>
                  <input
                    type="email"
                    value={connectEmail}
                    onChange={(e) => { setConnectEmail(e.target.value); setSaved(false); }}
                    placeholder="cyberlogic@university.edu"
                    className="w-full bg-surface-900 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
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
