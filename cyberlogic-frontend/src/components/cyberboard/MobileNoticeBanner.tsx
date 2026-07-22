import { Smartphone } from "lucide-react";

export default function MobileNoticeBanner() {
  return (
    <div className="md:hidden bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between gap-2 flex-shrink-0 z-20">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>
          <strong>Mobile Notice:</strong> Drag-and-drop planning is optimized for desktop screens. Tap any card to view details or add comments!
        </span>
      </div>
    </div>
  );
}
