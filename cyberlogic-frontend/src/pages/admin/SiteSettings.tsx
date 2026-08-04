import { useState, useEffect } from "react";
import { RotateCcw, Check, Palette, Eye, Shield, Calendar, Share2, Globe, Sparkles, Layers } from "lucide-react";
import { applyGlobalTheme } from "../../utils/theme";
import { fetchSiteSettings, updateSiteSettings } from "../../utils/api";
import { useDialog } from "../../utils/useDialog";
import AboutMissionVisionSettings from "../../components/admin/about/AboutMissionVisionSettings";
import AboutHistorySettings from "../../components/admin/about/AboutHistorySettings";
import AboutOfficerSettings from "../../components/admin/about/AboutOfficerSettings";
import { useSEO } from "../../utils/useSEO";

const availableThemes = [
  // Dark Themes
  { value: "cyberpunk", label: "👾 Cyberpunk Neon", desc: "Dark mode. Futuristic dark slate, vibrant gradients, and gridlines." },
  { value: "matrix", label: "📟 Neon Matrix", desc: "Dark mode. Carbon black backgrounds with digital green glows." },
  { value: "slate", label: "🌌 Slate Space", desc: "Dark mode. Minimalist deep space navy with silver lines and soft glows." },
  { value: "glass", label: "💎 Glassmorphism", desc: "Dark mode. Rich translucent containers and colorful backgrounds." },
  { value: "maroon-spider", label: "🕷️ Maroon Spider (Dark)", desc: "Dark mode. Velvet black surfaces with crimson web lines and deep maroon details." },
  { value: "dark-pink", label: "🌺 Dark Pink", desc: "Dark mode. Black-cherry background with hot pink highlights and rose details." },
  { value: "dark-orange", label: "🔥 Dark Orange", desc: "Dark mode. Ember charcoal background with glowing orange accents." },

  // Light Themes
  { value: "light-classic", label: "☀️ Classic Light", desc: "Light mode. Washed slate surfaces, warm amber accents, and indigo details." },
  { value: "light-neo", label: "⚡ Neon Light", desc: "Light mode. Crisp neutral white with electric cyan lines and hot pink glows." },
  { value: "light-mint", label: "🍃 Mint Light", desc: "Light mode. Soothing mint base, deep forest text, and emerald accents." },
  { value: "light-lavender", label: "🦄 Lavender Mist", desc: "Light mode. Soft purple base, lavender mist cards, and orchid accents." },
  { value: "light-retro", label: "📜 Sand Retro", desc: "Light mode. Warm sand cream backgrounds, sepia text, and amber highlights." },
  { value: "maroon-spider-light", label: "🕷️ Maroon Spider (Light)", desc: "Light mode. Soft rose-tinted surfaces with deep maroon outlines and crimson details." },
  { value: "light-neon-pink", label: "⚡ Neon Pink Light", desc: "Light mode. Crisp neutral white with electric pink lines and hot cyan glows." },
  { value: "light-pink", label: "🌸 Light Pink", desc: "Light mode. Soft rose background with warm pink accents and deep burgundy text." },
  { value: "light-orange", label: "🍊 Light Orange", desc: "Light mode. Soft orange cream background with warm citrus highlights and brown text." }
];

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

  // Social Connect Links States (Facebook, Instagram, WeChat, TikTok, X, Reddit, etc.)
  const [connectWebsite, setConnectWebsite] = useState("");
  const [connectGithub, setConnectGithub] = useState("");
  const [connectLinkedin, setConnectLinkedin] = useState("");
  const [connectFacebook, setConnectFacebook] = useState("");
  const [connectInstagram, setConnectInstagram] = useState("");
  const [connectWechat, setConnectWechat] = useState("");
  const [connectTiktok, setConnectTiktok] = useState("");
  const [connectTwitter, setConnectTwitter] = useState(""); // X
  const [connectReddit, setConnectReddit] = useState("");
  const [connectEmail, setConnectEmail] = useState("");
  const [connectAddress, setConnectAddress] = useState("");
  const [connectPhone, setConnectPhone] = useState("");

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
          setConnectInstagram(settings.connect_instagram || "");
          setConnectWechat(settings.connect_wechat || "");
          setConnectTiktok(settings.connect_tiktok || "");
          setConnectTwitter(settings.connect_twitter || "");
          setConnectReddit(settings.connect_reddit || "");
          setConnectEmail(settings.connect_email || "");
          setConnectAddress(settings.connect_address || "");
          setConnectPhone(settings.connect_phone || "");
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
    applyGlobalTheme(themeName);
    setSaved(false);
  };

  const resetAll = async () => {
    try {
      setDefaultTheme("cyberpunk");
      applyGlobalTheme("cyberpunk");
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
        connect_instagram: connectInstagram,
        connect_wechat: connectWechat,
        connect_tiktok: connectTiktok,
        connect_twitter: connectTwitter,
        connect_reddit: connectReddit,
        connect_email: connectEmail,
        connect_address: connectAddress,
        connect_phone: connectPhone,
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

  const activeThemeLabel = availableThemes.find((t) => t.value === defaultTheme)?.label || defaultTheme;

  const tabs = [
    { key: "theme", label: "Portal Theme Profile", icon: Palette, badge: availableThemes.length.toString() },
    { key: "about_mv", label: "Mission & Vision", icon: Eye, badge: "CMS" },
    { key: "about_history", label: "Club History", icon: Calendar, badge: "Timeline" },
    { key: "about_officers", label: "Officers List", icon: Shield, badge: "Members" },
    { key: "connect_us", label: "Social & Connect Links", icon: Share2, badge: "Footer" },
  ] as const;

  return (
    <div className="w-full space-y-6 animate-fadeIn text-left pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface-900/80 border border-border/80 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-primary" />
            <span>Site Settings & CMS</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Full control over default themes, organization contents, officer directory, and public connect profiles.
          </p>
        </div>
        {(activeTab === "theme" || activeTab === "connect_us") && (
          <div className="flex items-center gap-3">
            {activeTab === "theme" && (
              <button
                type="button"
                onClick={resetAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-amber-500/30 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Reset Defaults
              </button>
            )}
            <button
              type="button"
              onClick={saveSettings}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              {saved ? <Check className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
              {saved ? "Saved Successfully!" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Top Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-900/60 border border-border/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Palette className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Default Theme</span>
            <span className="text-xs font-bold text-text-primary truncate block mt-0.5">{activeThemeLabel}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-900/60 border border-border/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Theme Presets</span>
            <span className="text-sm font-bold text-text-primary block mt-0.5">{availableThemes.length} Profiles</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-900/60 border border-border/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Connect Channels</span>
            <span className="text-sm font-bold text-text-primary block mt-0.5">
              {[connectWebsite, connectGithub, connectLinkedin, connectFacebook, connectTwitter, connectInstagram].filter(Boolean).length} Active
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-900/60 border border-border/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">CMS Status</span>
            <span className="text-sm font-bold text-emerald-400 block mt-0.5">● Live & Ready</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Sidebar (Non-sticky on tablet/mobile, sticky on desktop lg:) */}
        <div className="lg:col-span-1 space-y-2 bg-surface-900/80 border border-border/80 p-3 rounded-2xl static lg:sticky lg:top-20 shadow-md">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider px-3 py-1 hidden lg:block">
            Settings Modules
          </span>
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 lg:w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-800/80 bg-surface-800/40 lg:bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComp className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-text-muted"}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold hidden sm:inline-block ${
                      isActive ? "bg-white/20 text-white" : "bg-surface-800 text-text-muted border border-border/60"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "theme" && (
            <div className="bg-surface-900/80 border border-border/80 rounded-2xl p-6 space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    <span>Default Portal Theme</span>
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    Select the default visual theme applied to guests and users without custom preferences.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  Active: {activeThemeLabel}
                </span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <p className="text-xs text-text-muted">Loading theme configurations...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {availableThemes.map((t) => {
                    const isSelected = defaultTheme === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleSelectTheme(t.value)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-36 ${
                          isSelected
                            ? "border-primary bg-primary/15 shadow-md shadow-primary/10 ring-2 ring-primary/40"
                            : "border-border/80 bg-surface-950/60 hover:bg-surface-800/80 hover:border-primary/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-xs font-bold text-text-primary truncate">{t.label}</span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-text-muted block leading-relaxed line-clamp-3">
                            {t.desc}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-semibold text-text-muted">
                          <span>{t.desc.includes("Dark") ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
                          {isSelected ? (
                            <span className="text-primary font-bold">Active</span>
                          ) : (
                            <span className="text-text-muted group-hover:text-text-primary">Apply</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "connect_us" && (
            <div className="bg-surface-900/80 border border-border/80 rounded-2xl p-6 space-y-6 shadow-md">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-400" />
                  <span>Connect With Us & Footer Social Links</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Customize the landing page footer social buttons, contact email, and office location.
                </p>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <p className="text-xs text-text-muted">Loading connect links...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Official Website</label>
                      <input
                        type="url"
                        value={connectWebsite}
                        onChange={(e) => { setConnectWebsite(e.target.value); setSaved(false); }}
                        placeholder="https://example.com"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">GitHub Repository / Org</label>
                      <input
                        type="url"
                        value={connectGithub}
                        onChange={(e) => { setConnectGithub(e.target.value); setSaved(false); }}
                        placeholder="https://github.com/org"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">LinkedIn Profile</label>
                      <input
                        type="url"
                        value={connectLinkedin}
                        onChange={(e) => { setConnectLinkedin(e.target.value); setSaved(false); }}
                        placeholder="https://linkedin.com/company/org"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Facebook Page</label>
                      <input
                        type="url"
                        value={connectFacebook}
                        onChange={(e) => { setConnectFacebook(e.target.value); setSaved(false); }}
                        placeholder="https://facebook.com/page"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Instagram Profile</label>
                      <input
                        type="url"
                        value={connectInstagram}
                        onChange={(e) => { setConnectInstagram(e.target.value); setSaved(false); }}
                        placeholder="https://instagram.com/profile"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">WeChat ID / URL</label>
                      <input
                        type="text"
                        value={connectWechat}
                        onChange={(e) => { setConnectWechat(e.target.value); setSaved(false); }}
                        placeholder="WeChat ID or link"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">TikTok Profile</label>
                      <input
                        type="url"
                        value={connectTiktok}
                        onChange={(e) => { setConnectTiktok(e.target.value); setSaved(false); }}
                        placeholder="https://tiktok.com/@profile"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">X / Twitter Profile</label>
                      <input
                        type="url"
                        value={connectTwitter}
                        onChange={(e) => { setConnectTwitter(e.target.value); setSaved(false); }}
                        placeholder="https://x.com/profile"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Reddit Community / Profile</label>
                      <input
                        type="url"
                        value={connectReddit}
                        onChange={(e) => { setConnectReddit(e.target.value); setSaved(false); }}
                        placeholder="https://reddit.com/r/community"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Contact Support Email</label>
                      <input
                        type="email"
                        value={connectEmail}
                        onChange={(e) => { setConnectEmail(e.target.value); setSaved(false); }}
                        placeholder="support@cyberlogic.pazmelon.com"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Contact Phone Number</label>
                      <input
                        type="text"
                        value={connectPhone}
                        onChange={(e) => { setConnectPhone(e.target.value); setSaved(false); }}
                        placeholder="+63 912 345 6789"
                        className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Headquarters / Office Address</label>
                    <input
                      type="text"
                      value={connectAddress}
                      onChange={(e) => { setConnectAddress(e.target.value); setSaved(false); }}
                      placeholder="Room 301, Building A, University Campus"
                      className="w-full bg-surface-950 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
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
    </div>
  );
}
