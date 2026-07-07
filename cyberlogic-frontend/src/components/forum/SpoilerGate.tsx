import { useState } from "react";
import { Eye } from "lucide-react";

interface SpoilerGateProps {
  children: React.ReactNode;
  isSpoiler: boolean;
}

export function SpoilerGate({ children, isSpoiler }: SpoilerGateProps) {
  const [revealed, setRevealed] = useState(false);

  if (!isSpoiler || revealed) {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-xl">
      {/* Blurred Content Panel */}
      <div className="filter blur-xl select-none pointer-events-none transition-all duration-500">
        {children}
      </div>

      {/* Cybernetic Spoiler Overlay Cover */}
      <button
        onClick={() => setRevealed(true)}
        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 bg-surface-950/80 backdrop-blur-lg border border-warning/10 hover:border-warning/30 transition-all duration-300 z-10"
      >
        <div className="w-12 h-12 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center text-warning group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-warning/5 animate-pulse">
          <Eye className="w-6 h-6" />
        </div>
        <div className="text-center px-4">
          <span className="block text-sm font-bold tracking-widest text-warning uppercase font-[family-name:var(--font-heading)]">
            ⚠️ Spoiler Warning
          </span>
          <span className="block text-xs text-text-muted mt-1 font-medium">
            Click to decrypt and reveal content
          </span>
        </div>
      </button>
    </div>
  );
}
