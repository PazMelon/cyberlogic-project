import { useState } from "react";
import { RotateCcw, Check, Palette } from "lucide-react";

interface ColorSetting {
  key: string;
  label: string;
  group: string;
  defaultValue: string;
}

const colorSettings: ColorSetting[] = [
  // Primary
  { key: "--cl-primary", label: "Primary", group: "Brand Colors", defaultValue: "#06b6d4" },
  { key: "--cl-primary-light", label: "Primary Light", group: "Brand Colors", defaultValue: "#22d3ee" },
  { key: "--cl-primary-dark", label: "Primary Dark", group: "Brand Colors", defaultValue: "#0891b2" },
  // Accent
  { key: "--cl-accent", label: "Accent", group: "Brand Colors", defaultValue: "#a855f7" },
  { key: "--cl-accent-light", label: "Accent Light", group: "Brand Colors", defaultValue: "#c084fc" },
  { key: "--cl-accent-dark", label: "Accent Dark", group: "Brand Colors", defaultValue: "#9333ea" },
  // Surfaces
  { key: "--cl-surface-950", label: "Background", group: "Surfaces", defaultValue: "#0a0e1a" },
  { key: "--cl-surface-900", label: "Surface 900", group: "Surfaces", defaultValue: "#0f1729" },
  { key: "--cl-surface-800", label: "Surface 800", group: "Surfaces", defaultValue: "#151d33" },
  { key: "--cl-surface-700", label: "Surface 700", group: "Surfaces", defaultValue: "#1e2a45" },
  // Text
  { key: "--cl-text-primary", label: "Text Primary", group: "Text", defaultValue: "#f1f5f9" },
  { key: "--cl-text-secondary", label: "Text Secondary", group: "Text", defaultValue: "#94a3b8" },
  { key: "--cl-text-muted", label: "Text Muted", group: "Text", defaultValue: "#64748b" },
  // Status
  { key: "--cl-success", label: "Success", group: "Status Colors", defaultValue: "#22c55e" },
  { key: "--cl-warning", label: "Warning", group: "Status Colors", defaultValue: "#f59e0b" },
  { key: "--cl-error", label: "Error", group: "Status Colors", defaultValue: "#ef4444" },
  { key: "--cl-info", label: "Info", group: "Status Colors", defaultValue: "#3b82f6" },
];

export default function SiteSettings() {
  const [colors, setColors] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    colorSettings.forEach((s) => {
      const stored = getComputedStyle(document.documentElement).getPropertyValue(s.key).trim();
      initial[s.key] = stored || s.defaultValue;
    });
    return initial;
  });
  const [saved, setSaved] = useState(false);

  const updateColor = (key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
    document.documentElement.style.setProperty(key, value);
    setSaved(false);
  };

  const resetAll = () => {
    colorSettings.forEach((s) => {
      document.documentElement.style.removeProperty(s.key);
    });
    const defaults: Record<string, string> = {};
    colorSettings.forEach((s) => {
      defaults[s.key] = s.defaultValue;
    });
    setColors(defaults);
    setSaved(false);
  };

  const saveSettings = () => {
    // In a real app, this would persist to a database
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Group colors by their group property
  const groups = colorSettings.reduce<Record<string, ColorSetting[]>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Site Settings
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Customize the portal's look and feel. Changes are applied live.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-amber-500/30 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={saveSettings}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:-translate-y-0.5"
          >
            {saved ? <Check className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Live Preview Swatch */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Live Preview</h2>
        <div className="flex flex-wrap gap-4">
          {/* Preview Card */}
          <div className="flex-1 min-w-[200px] rounded-xl p-4 bg-surface-900 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Sample Card</p>
                <p className="text-xs text-text-muted">Preview of your theme</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary mb-3">This is how text looks with your current color scheme. Adjust the colors below to see changes in real-time.</p>
            <div className="flex gap-2">
              <button type="button" className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium">Primary</button>
              <button type="button" className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium">Accent</button>
              <button type="button" className="px-3 py-1.5 rounded-lg bg-success text-white text-xs font-medium">Success</button>
              <button type="button" className="px-3 py-1.5 rounded-lg bg-error text-white text-xs font-medium">Error</button>
            </div>
          </div>
          {/* Color Swatches */}
          <div className="flex flex-wrap gap-2 items-start">
            {colorSettings.filter((s) => s.group === "Brand Colors" || s.group === "Status Colors").map((s) => (
              <div
                key={s.key}
                className="w-10 h-10 rounded-lg border border-border shadow-inner"
                style={{ backgroundColor: colors[s.key] }}
                title={s.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Color Groups */}
      {Object.entries(groups).map(([groupName, settings]) => (
        <div key={groupName} className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{groupName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.map((setting) => (
              <div
                key={setting.key}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-border hover:border-amber-500/20 transition-all"
              >
                <label
                  htmlFor={`color-${setting.key}`}
                  className="relative w-10 h-10 rounded-lg overflow-hidden border border-border cursor-pointer flex-shrink-0 group"
                >
                  <input
                    id={`color-${setting.key}`}
                    type="color"
                    value={colors[setting.key]}
                    onChange={(e) => updateColor(setting.key, e.target.value)}
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: colors[setting.key] }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Palette className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </label>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{setting.label}</p>
                  <p className="text-[10px] text-text-muted font-mono uppercase">{colors[setting.key]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
