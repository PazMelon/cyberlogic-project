import { Image, LayoutGrid, Columns2, PanelTop, GalleryHorizontalEnd, Grid3X3 } from 'lucide-react';
import type { ImageTemplate } from '../types/blog-editor.types';

interface ImageTemplateSelectorProps {
  value: ImageTemplate;
  onChange: (template: ImageTemplate) => void;
}

interface TemplateOption {
  id: ImageTemplate;
  label: string;
  description: string;
  icon: React.ElementType;
  preview: React.ReactNode;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'single',
    label: 'Single Image',
    description: '1 full-width image',
    icon: Image,
    preview: (
      <div className="w-full aspect-video bg-brand/15 rounded-lg" />
    ),
  },
  {
    id: 'side-by-side',
    label: 'Side by Side',
    description: '2 images, 50/50 split',
    icon: Columns2,
    preview: (
      <div className="w-full aspect-video flex gap-1">
        <div className="flex-1 bg-brand/15 rounded-lg" />
        <div className="flex-1 bg-brand/10 rounded-lg" />
      </div>
    ),
  },
  {
    id: 'bento-3',
    label: 'Bento (3)',
    description: '1 large + 2 stacked',
    icon: LayoutGrid,
    preview: (
      <div className="w-full aspect-video flex gap-1">
        <div className="flex-[1.5] bg-brand/15 rounded-lg" />
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex-1 bg-brand/10 rounded-lg" />
          <div className="flex-1 bg-brand/8 rounded-lg" />
        </div>
      </div>
    ),
  },
  {
    id: 'bento-4',
    label: 'Grid (2×2)',
    description: '4 images in a 2×2 grid',
    icon: Grid3X3,
    preview: (
      <div className="w-full aspect-video grid grid-cols-2 gap-1">
        <div className="bg-brand/15 rounded-lg" />
        <div className="bg-brand/12 rounded-lg" />
        <div className="bg-brand/10 rounded-lg" />
        <div className="bg-brand/8 rounded-lg" />
      </div>
    ),
  },
  {
    id: 'bento-6',
    label: 'Gallery (6)',
    description: '6 images in masonry grid',
    icon: GalleryHorizontalEnd,
    preview: (
      <div className="w-full aspect-video grid grid-cols-3 grid-rows-2 gap-1">
        <div className="bg-brand/15 rounded-lg col-span-2 row-span-1" />
        <div className="bg-brand/12 rounded-lg" />
        <div className="bg-brand/10 rounded-lg" />
        <div className="bg-brand/8 rounded-lg col-span-2 row-span-1" />
      </div>
    ),
  },
  {
    id: 'banner',
    label: 'Banner',
    description: 'Full-width cinematic strip',
    icon: PanelTop,
    preview: (
      <div className="w-full h-8 bg-brand/15 rounded-lg" />
    ),
  },
];

export default function ImageTemplateSelector({ value, onChange }: ImageTemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {TEMPLATES.map(t => {
        const isActive = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`
              relative flex flex-col gap-2 p-3 rounded-xl border-2 text-left cursor-pointer transition-all duration-200
              ${isActive
                ? 'border-brand bg-brand/5 shadow-sm'
                : 'border-border/40 hover:border-brand/30 hover:bg-subtle/30'
              }
            `}
          >
            {/* Preview thumbnail */}
            <div className="w-full">
              {t.preview}
            </div>
            <div>
              <p className={`text-[11px] font-bold ${isActive ? 'text-brand' : 'text-charcoal'}`}>{t.label}</p>
              <p className="text-[9px] text-muted">{t.description}</p>
            </div>
            {isActive && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
