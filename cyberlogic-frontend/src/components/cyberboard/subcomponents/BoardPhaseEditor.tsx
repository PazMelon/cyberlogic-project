import React, { useState } from "react";
import { Layers, Plus, Trash2, GripVertical } from "lucide-react";
import { PRESET_COLORS } from "../shared/cyberboardConstants";

interface PhaseSetting {
  name: string;
  color: string;
}

interface BoardPhaseEditorProps {
  methodology: "waterfall" | "agile" | "custom";
  setMethodology: (m: "waterfall" | "agile" | "custom") => void;
  phaseSettings: PhaseSetting[];
  setPhaseSettings: React.Dispatch<React.SetStateAction<PhaseSetting[]>>;
  cardsInPhase?: Record<string, number>;
  phaseErrorMessage?: string | null;
  setPhaseErrorMessage?: (msg: string | null) => void;
}

const WATERFALL_PRESETS: PhaseSetting[] = [
  { name: "Requirements & Planning", color: "#3b82f6" },
  { name: "Architecture & Design", color: "#8b5cf6" },
  { name: "Development & Implementation", color: "#06b6d4" },
  { name: "Testing & QA", color: "#f59e0b" },
  { name: "Deployment & Release", color: "#10b981" },
];

const AGILE_PRESETS: PhaseSetting[] = [
  { name: "Sprint Backlog", color: "#64748b" },
  { name: "Sprint 1 — In Progress", color: "#3b82f6" },
  { name: "Sprint 2 — Next Up", color: "#06b6d4" },
  { name: "Code Review & QA", color: "#f59e0b" },
  { name: "Sprint Release", color: "#10b981" },
];

export const BoardPhaseEditor: React.FC<BoardPhaseEditorProps> = ({
  methodology,
  setMethodology,
  phaseSettings,
  setPhaseSettings,
  cardsInPhase = {},
  setPhaseErrorMessage,
}) => {
  const [newPhaseName, setNewPhaseName] = useState("");
  const [draggedPhaseIndex, setDraggedPhaseIndex] = useState<number | null>(null);

  const handleMethodologyChange = (val: "waterfall" | "agile" | "custom") => {
    setMethodology(val);
    if (val === "waterfall") {
      setPhaseSettings(WATERFALL_PRESETS);
    } else if (val === "agile") {
      setPhaseSettings(AGILE_PRESETS);
    }
  };

  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim()) return;
    const name = newPhaseName.trim();
    if (phaseSettings.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      if (setPhaseErrorMessage) setPhaseErrorMessage(`Phase "${name}" already exists.`);
      return;
    }
    const color = PRESET_COLORS[phaseSettings.length % PRESET_COLORS.length];
    setPhaseSettings((prev) => [...prev, { name, color }]);
    setNewPhaseName("");
    if (setPhaseErrorMessage) setPhaseErrorMessage(null);
  };

  const handleRemovePhase = (index: number) => {
    const target = phaseSettings[index];
    if (target && cardsInPhase[target.name] && cardsInPhase[target.name] > 0) {
      if (setPhaseErrorMessage) {
        setPhaseErrorMessage(
          `Cannot delete "${target.name}": ${cardsInPhase[target.name]} active card(s) are assigned to this phase.`
        );
      }
      return;
    }
    setPhaseSettings((prev) => prev.filter((_, idx) => idx !== index));
    if (setPhaseErrorMessage) setPhaseErrorMessage(null);
  };

  const handlePhaseColorChange = (index: number, color: string) => {
    setPhaseSettings((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, color } : p))
    );
  };

  const handleDragStart = (idx: number) => {
    setDraggedPhaseIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedPhaseIndex === null || draggedPhaseIndex === idx) return;

    const updated = [...phaseSettings];
    const item = updated.splice(draggedPhaseIndex, 1)[0];
    updated.splice(idx, 0, item);
    setDraggedPhaseIndex(idx);
    setPhaseSettings(updated);
  };

  const handleDragEnd = () => {
    setDraggedPhaseIndex(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
          Project Methodology Preset
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleMethodologyChange("waterfall")}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              methodology === "waterfall"
                ? "bg-primary/10 border-primary text-primary shadow-xs"
                : "bg-surface-800/80 border-border/60 text-text-secondary hover:border-border"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Waterfall</span>
          </button>

          <button
            type="button"
            onClick={() => handleMethodologyChange("agile")}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              methodology === "agile"
                ? "bg-primary/10 border-primary text-primary shadow-xs"
                : "bg-surface-800/80 border-border/60 text-text-secondary hover:border-border"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Agile Sprints</span>
          </button>

          <button
            type="button"
            onClick={() => setMethodology("custom")}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              methodology === "custom"
                ? "bg-primary/10 border-primary text-primary shadow-xs"
                : "bg-surface-800/80 border-border/60 text-text-secondary hover:border-border"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/40">
        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
          Phases & Sprints Config ({phaseSettings.length})
        </label>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
          {phaseSettings.map((phase, idx) => (
            <div
              key={`phase-row-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs bg-surface-800/80 border-border/60 transition-all ${
                draggedPhaseIndex === idx ? "opacity-40 border-primary" : ""
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <GripVertical className="w-4 h-4 text-text-muted/40 hover:text-text-muted cursor-grab flex-shrink-0" />
                <input
                  type="text"
                  value={phase.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhaseSettings((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, name: val } : p))
                    );
                  }}
                  className="bg-transparent border-none text-text-primary text-xs font-bold focus:outline-none flex-1 truncate"
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                  {PRESET_COLORS.slice(0, 5).map((color) => (
                    <button
                      type="button"
                      key={`phase-${idx}-${color}`}
                      onClick={() => handlePhaseColorChange(idx, color)}
                      className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                        phase.color === color ? "ring-2 ring-primary scale-110" : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePhase(idx)}
                  className="p-1 text-text-muted hover:text-error rounded-md transition-colors cursor-pointer"
                  title="Remove phase"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddPhase} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            placeholder="Add new custom phase or sprint..."
            className="flex-1 px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newPhaseName.trim()}
            className="px-3.5 py-2 rounded-xl bg-primary text-surface-950 font-bold text-xs hover:bg-primary-light flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Phase</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default BoardPhaseEditor;
