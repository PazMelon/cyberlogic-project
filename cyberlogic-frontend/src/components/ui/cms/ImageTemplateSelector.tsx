import { Image as ImageIcon, Columns2, LayoutGrid, Grid3X3, GalleryHorizontalEnd, PanelTop, GalleryHorizontal } from "lucide-react";
import type { ImageTemplate } from "./types";

interface ImageTemplateSelectorProps {
  value: ImageTemplate;
  onChange: (template: ImageTemplate) => void;
}

export default function ImageTemplateSelector({ value, onChange }: ImageTemplateSelectorProps) {
  const TEMPLATES: { id: ImageTemplate; label: string; description: string; icon: React.ElementType; preview: React.ReactNode }[] = [
    {
      id: "single",
      label: "Single Image",
      description: "1 full-width image",
      icon: ImageIcon,
      preview: <div className="w-full aspect-video bg-primary/20 rounded-lg border border-primary/20" />,
    },
    {
      id: "side-by-side",
      label: "Side by Side",
      description: "2 images, 50/50 split",
      icon: Columns2,
      preview: (
        <div className="w-full aspect-video flex gap-1">
          <div className="flex-1 bg-primary/20 rounded-lg border border-primary/20" />
          <div className="flex-1 bg-primary/10 rounded-lg border border-primary/10" />
        </div>
      ),
    },
    {
      id: "bento-3",
      label: "Bento (3)",
      description: "1 large + 2 stacked",
      icon: LayoutGrid,
      preview: (
        <div className="w-full aspect-video flex gap-1">
          <div className="flex-[1.5] bg-primary/20 rounded-lg border border-primary/20" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex-1 bg-primary/10 rounded-lg border border-primary/10" />
            <div className="flex-1 bg-primary/5 rounded-lg border border-primary/5" />
          </div>
        </div>
      ),
    },
    {
      id: "bento-4",
      label: "Grid (2×2)",
      description: "4 images in 2×2",
      icon: Grid3X3,
      preview: (
        <div className="w-full aspect-video grid grid-cols-2 gap-1">
          <div className="bg-primary/20 rounded-lg border border-primary/20" />
          <div className="bg-primary/15 rounded-lg border border-primary/15" />
          <div className="bg-primary/10 rounded-lg border border-primary/10" />
          <div className="bg-primary/5 rounded-lg border border-primary/5" />
        </div>
      ),
    },
    {
      id: "bento-6",
      label: "Masonry (6)",
      description: "6 image grid mosaic",
      icon: GalleryHorizontalEnd,
      preview: (
        <div className="w-full aspect-video grid grid-cols-3 grid-rows-2 gap-1">
          <div className="bg-primary/20 rounded-lg col-span-2 row-span-1 border border-primary/20" />
          <div className="bg-primary/15 rounded-lg border border-primary/15" />
          <div className="bg-primary/10 rounded-lg border border-primary/10" />
          <div className="bg-primary/5 rounded-lg col-span-2 row-span-1 border border-primary/5" />
        </div>
      ),
    },
    {
      id: "banner",
      label: "Wide Banner",
      description: "Full-width cinematic row",
      icon: PanelTop,
      preview: <div className="w-full h-8 bg-primary/20 rounded-lg border border-primary/20" />,
    },
    {
      id: "carousel",
      label: "Carousel Slider",
      description: "Interactive slider (up to 8)",
      icon: GalleryHorizontal,
      preview: (
        <div className="w-full aspect-video flex gap-1 items-center justify-center bg-primary/20 rounded-lg border border-primary/20 relative">
          <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[9px] absolute left-1 select-none">‹</div>
          <div className="w-12 h-12 bg-white/10 rounded-md border border-white/20" />
          <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[9px] absolute right-1 select-none">›</div>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {TEMPLATES.map((t) => {
        const isActive = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`
              relative flex flex-col gap-2 p-3 rounded-xl border-2 text-left cursor-pointer transition-all duration-200
              ${
                isActive
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border/60 bg-surface-900/20 hover:border-primary/45 hover:bg-surface-800/40"
              }
            `}
          >
            <div className="w-full">{t.preview}</div>
            <div>
              <p className={`text-[11px] font-bold ${isActive ? "text-primary" : "text-text-primary"}`}>{t.label}</p>
              <p className="text-[9px] text-text-muted">{t.description}</p>
            </div>
            {isActive && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
