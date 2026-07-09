import { useState, useEffect } from "react";
import { Target, Eye, Heart, Check, Save } from "lucide-react";
import { fetchSiteSettings, updateSiteSettings } from "../../../utils/api";
import { useDialog } from "../../../utils/useDialog";

export default function AboutMissionVisionSettings() {
  const { showAlert } = useDialog();
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [values, setValues] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const settings = await fetchSiteSettings();
        setMission(settings.about_mission || "");
        setVision(settings.about_vision || "");
        setValues(settings.about_values || "");
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSiteSettings({
        about_mission: mission,
        about_vision: vision,
        about_values: values,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      showAlert({
        title: "Save Failed",
        message: "Failed to save settings.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Loading mission & vision data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Mission Input */}
        <div className="glass rounded-2xl p-6 border border-border/40 hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Our Mission</h3>
              <p className="text-[10px] text-text-muted">Describe the club's primary purpose and actionable goals.</p>
            </div>
          </div>
          <textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            rows={4}
            placeholder="Enter mission statements..."
            className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
            required
          />
        </div>

        {/* Vision Input */}
        <div className="glass rounded-2xl p-6 border border-border/40 hover:border-accent/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Our Vision</h3>
              <p className="text-[10px] text-text-muted">Describe the long-term aspiration and target future state of the club.</p>
            </div>
          </div>
          <textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            rows={4}
            placeholder="Enter vision statements..."
            className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
            required
          />
        </div>

        {/* Goals / Values Input */}
        <div className="glass rounded-2xl p-6 border border-border/40 hover:border-success/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Our Values & Goals</h3>
              <p className="text-[10px] text-text-muted">Describe the core principles, values, and guidelines that drive club members.</p>
            </div>
          </div>
          <textarea
            value={values}
            onChange={(e) => setValues(e.target.value)}
            rows={4}
            placeholder="Enter values and goals..."
            className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-success/50 focus:ring-1 focus:ring-success/20 transition-all resize-none"
            required
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save Mission & Vision"}
        </button>
      </div>
    </form>
  );
}
