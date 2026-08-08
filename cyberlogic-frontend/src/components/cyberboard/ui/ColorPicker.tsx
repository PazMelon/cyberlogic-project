import React from "react";
import { PRESET_COLORS } from "../shared/cyberboardConstants";

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
  presetColors?: string[];
  size?: "sm" | "md" | "lg";
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  selectedColor,
  onSelectColor,
  presetColors = PRESET_COLORS,
  size = "md",
}) => {
  const activeColor = selectedColor || value || PRESET_COLORS[0];
  const handleSelect = onSelectColor || onChange || (() => {});
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  }[size];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presetColors.map((c) => (
        <button
          type="button"
          key={c}
          onClick={() => handleSelect(c)}
          className={`${sizeClasses} rounded-full transition-all cursor-pointer border border-white/10 ${
            activeColor === c
              ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-900 scale-110 shadow-md"
              : "hover:scale-105 opacity-80 hover:opacity-100"
          }`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
      <div className="flex items-center gap-2 ml-1">
        <input
          type="color"
          value={activeColor}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-8 h-8 rounded-xl bg-surface-800 border border-border cursor-pointer p-0.5"
          title="Custom Color Picker"
        />
        <span className="text-xs font-mono font-bold text-text-muted">{activeColor}</span>
      </div>
    </div>
  );
};

export default ColorPicker;
