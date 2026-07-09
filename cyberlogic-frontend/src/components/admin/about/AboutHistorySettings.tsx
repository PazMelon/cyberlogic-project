import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Check, Save, Edit2, Calendar } from "lucide-react";
import { fetchSiteSettings, updateSiteSettings } from "../../../utils/api";
import { useDialog } from "../../../utils/useDialog";

interface TimelineEvent {
  year: string;
  title: string;
  desc: string;
}

const defaultTimeline: TimelineEvent[] = [
  {
    year: "2020",
    title: "Club Founded",
    desc: "Cyberlogic Club was established by a group of technology-passionate students to bridge the gap between classroom theory and real-world application."
  },
  {
    year: "2021",
    title: "First Bootcamp",
    desc: "Hosted our first inter-departmental digital design showcase and hardware troubleshooting bootcamp."
  },
  {
    year: "2022",
    title: "Innovation Hub Inauguration",
    desc: "Opened our dedicated computer servicing and digital design hub with custom workspace tools."
  },
  {
    year: "2023",
    title: "100+ Members",
    desc: "Reached over 100 active members and launched our online learning platform."
  },
  {
    year: "2024",
    title: "Campus Recognition",
    desc: "Recognized as one of the most innovative and active student organizations at St. Rita's College."
  },
  {
    year: "2026",
    title: "Portal Launch",
    desc: "Launched the Cyberlogic Club Portal — a centralized hub for members and resources."
  }
];

export default function AboutHistorySettings() {
  const { showAlert, showConfirm } = useDialog();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state for creating/editing inline
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [yearInput, setYearInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const settings = await fetchSiteSettings();
        if (settings.about_history) {
          try {
            setEvents(JSON.parse(settings.about_history));
          } catch {
            setEvents(defaultTimeline);
          }
        } else {
          setEvents(defaultTimeline);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        setEvents(defaultTimeline);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await updateSiteSettings({
        about_history: JSON.stringify(events)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      showAlert({
        title: "Save Failed",
        message: "Failed to save history settings.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingIndex(null);
    setYearInput("");
    setTitleInput("");
    setDescInput("");
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setIsAddingNew(false);
    setYearInput(events[index].year);
    setTitleInput(events[index].title);
    setDescInput(events[index].desc);
  };

  const handleCancelForm = () => {
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearInput.trim() || !titleInput.trim() || !descInput.trim()) return;

    const newEvent: TimelineEvent = {
      year: yearInput.trim(),
      title: titleInput.trim(),
      desc: descInput.trim()
    };

    if (isAddingNew) {
      setEvents((prev) => [...prev, newEvent]);
      setIsAddingNew(false);
    } else if (editingIndex !== null) {
      setEvents((prev) => {
        const updated = [...prev];
        updated[editingIndex] = newEvent;
        return updated;
      });
      setEditingIndex(null);
    }

    // Reset inputs
    setYearInput("");
    setTitleInput("");
    setDescInput("");
  };

  const handleDelete = async (index: number) => {
    const confirmed = await showConfirm({
      title: "Delete Event",
      message: "Are you sure you want to delete this event?",
      type: "danger",
      confirmText: "Delete",
    });

    if (confirmed) {
      setEvents((prev) => prev.filter((_, idx) => idx !== index));
      if (editingIndex === index) {
        handleCancelForm();
      }
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setEvents((prev) => {
      const swapped = [...prev];
      const temp = swapped[index];
      swapped[index] = swapped[index - 1];
      swapped[index - 1] = temp;
      return swapped;
    });
  };

  const moveDown = (index: number) => {
    if (index === events.length - 1) return;
    setEvents((prev) => {
      const swapped = [...prev];
      const temp = swapped[index];
      swapped[index] = swapped[index + 1];
      swapped[index + 1] = temp;
      return swapped;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Loading timeline history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex justify-between items-center bg-surface-900/50 p-4 rounded-xl border border-border/40">
        <div>
          <span className="text-xs font-bold text-text-primary block">Timeline History Builder</span>
          <span className="text-[10px] text-text-muted">Add, remove, and reorder events in the club's history timeline.</span>
        </div>
        <button
          type="button"
          onClick={handleStartAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 hover:bg-primary text-text-primary text-xs font-semibold transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Milestone
        </button>
      </div>

      {/* Editor Layout: Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: List of events */}
        <div className="lg:col-span-2 space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <p className="text-xs text-text-muted">No timeline events configured. Click "Add Milestone" to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, idx) => {
                const isEditing = editingIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`glass rounded-xl p-4 border transition-all duration-300 relative flex flex-col sm:flex-row items-start justify-between gap-4 ${
                      isEditing 
                        ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5" 
                        : "border-border/40 hover:border-border/85"
                    }`}
                  >
                    <div className="space-y-1 text-left max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-primary/25 border border-primary/45 text-primary">
                          <Calendar className="w-3 h-3" /> {event.year}
                        </span>
                        <h4 className="text-sm font-bold text-text-primary">{event.title}</h4>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed font-sans mt-2">{event.desc}</p>
                    </div>

                    {/* Quick controls */}
                    <div className="flex items-center sm:flex-col sm:justify-start gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(idx)}
                        title="Edit entry"
                        className="p-1.5 rounded-lg bg-surface-800 border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg bg-surface-800 border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(idx)}
                        disabled={idx === events.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg bg-surface-800 border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        title="Delete entry"
                        className="p-1.5 rounded-lg bg-surface-800 border border-border text-text-secondary hover:text-error hover:border-error/30 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Inline edit/create panel */}
        <div className="lg:col-span-1">
          {(isAddingNew || editingIndex !== null) ? (
            <div className="glass rounded-xl p-5 border border-primary/35 shadow-md shadow-primary/5 animate-fadeIn space-y-4 text-left">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary">
                {isAddingNew ? "Add New Milestone" : `Edit Milestone #${(editingIndex ?? 0) + 1}`}
              </h3>
              
              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-secondary">Year / Period</label>
                  <input
                    type="text"
                    required
                    value={yearInput}
                    onChange={(e) => setYearInput(e.target.value)}
                    placeholder="e.g. 2026, Q3 2026, 2022-2023"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-secondary">Milestone Title</label>
                  <input
                    type="text"
                    required
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g. Organization Founded"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-secondary">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Provide a detailed description of what happened..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="flex-1 py-2 rounded-lg bg-surface-800 border border-border hover:bg-surface-750 text-text-secondary text-xs font-semibold transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-primary/20 border border-primary/45 hover:bg-primary/30 text-primary text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Apply changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass rounded-xl p-5 border border-border/40 text-center py-10 space-y-2 text-left">
              <Calendar className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <h4 className="text-xs font-bold text-text-secondary text-center">Form Editor Idle</h4>
              <p className="text-[10px] text-text-muted text-center leading-relaxed font-sans">
                Select an event to edit details, or click "Add Milestone" to append a new history timeline event.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border/30">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : saved ? "Changes Saved!" : "Save Timeline changes"}
        </button>
      </div>
    </div>
  );
}
