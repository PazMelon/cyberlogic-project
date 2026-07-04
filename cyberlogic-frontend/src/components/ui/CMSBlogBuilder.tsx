import { useRef, useCallback, useEffect } from "react";
import {
  Type,
  Image as ImageIcon,
  Quote,
  Minus,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Bold,
  Italic,
  List,
  ListOrdered,
  LayoutGrid,
  Columns2,
  PanelTop,
  GalleryHorizontalEnd,
  Grid3X3,
  Clock,
  Tag,
  User,
  Star,
  Layers,
  FileText
} from "lucide-react";
import { Button, Card } from "../ui";

import type { ContentSection, ImageTemplate, SectionType } from "../../data/mockData";

export interface CMSBlogState {
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string; // intro paragraph
  author: string;
  category: string;
  image?: string; // cover image URL
  readTime?: string;
  featured?: boolean; // mapped to pinned or featured
  sections: ContentSection[];
}

export const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

export function getTemplateImageCount(template: ImageTemplate): number {
  switch (template) {
    case 'single': return 1;
    case 'side-by-side': return 2;
    case 'bento-3': return 3;
    case 'bento-4': return 4;
    case 'bento-6': return 6;
    case 'banner': return 1;
  }
}

// ============================================================
// Rich Text Editor Component
// ============================================================
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '140px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (editorRef.current) {
      if (isFirstRender.current || (value !== editorRef.current.innerHTML && document.activeElement !== editorRef.current)) {
        editorRef.current.innerHTML = value;
      }
      isFirstRender.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== value) {
        onChange(currentHtml);
      }
    }
  }, [onChange, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      handleInput();
    }
  };

  const execCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const isActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const ToolbarButton = ({ command, icon: Icon, label }: { command: string; icon: React.ElementType; label: string }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        execCommand(command);
      }}
      className={`p-2 rounded-lg transition-colors cursor-pointer ${isActive(command)
        ? 'bg-primary/20 text-primary border border-primary/30'
        : 'text-text-muted hover:text-text-primary hover:bg-white/5'
        }`}
      title={label}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="border border-border/80 rounded-xl overflow-hidden focus-within:border-primary/50 transition-all bg-surface-900/20">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-surface-950/40 border-b border-border/60">
        <ToolbarButton command="bold" icon={Bold} label="Bold" />
        <ToolbarButton command="italic" icon={Italic} label="Italic" />
        <div className="w-px h-5 bg-border/50 mx-1" />
        <ToolbarButton command="insertUnorderedList" icon={List} label="Bullet List" />
        <ToolbarButton command="insertOrderedList" icon={ListOrdered} label="Numbered List" />
      </div>

      {/* Editor Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="px-4 py-3 text-sm text-text-secondary leading-relaxed outline-none bg-surface-900/10 min-h-[inherit]
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-text-muted/40
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
          [&_li]:my-0.5
          [&_b]:font-bold [&_strong]:font-bold
          [&_i]:italic [&_em]:italic
          [&_p]:my-1
        "
        style={{ minHeight }}
      />
    </div>
  );
}

// ============================================================
// Image Template Selector Component
// ============================================================
interface ImageTemplateSelectorProps {
  value: ImageTemplate;
  onChange: (template: ImageTemplate) => void;
}

export function ImageTemplateSelector({ value, onChange }: ImageTemplateSelectorProps) {
  const TEMPLATES: { id: ImageTemplate; label: string; description: string; icon: React.ElementType; preview: React.ReactNode }[] = [
    {
      id: 'single',
      label: 'Single Image',
      description: '1 full-width image',
      icon: ImageIcon,
      preview: <div className="w-full aspect-video bg-primary/20 rounded-lg border border-primary/20" />,
    },
    {
      id: 'side-by-side',
      label: 'Side by Side',
      description: '2 images, 50/50 split',
      icon: Columns2,
      preview: (
        <div className="w-full aspect-video flex gap-1">
          <div className="flex-1 bg-primary/20 rounded-lg border border-primary/20" />
          <div className="flex-1 bg-primary/10 rounded-lg border border-primary/10" />
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
          <div className="flex-[1.5] bg-primary/20 rounded-lg border border-primary/20" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex-1 bg-primary/10 rounded-lg border border-primary/10" />
            <div className="flex-1 bg-primary/5 rounded-lg border border-primary/5" />
          </div>
        </div>
      ),
    },
    {
      id: 'bento-4',
      label: 'Grid (2×2)',
      description: '4 images in 2×2',
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
      id: 'bento-6',
      label: 'Masonry (6)',
      description: '6 image grid mosaic',
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
      id: 'banner',
      label: 'Wide Banner',
      description: 'Full-width cinematic row',
      icon: PanelTop,
      preview: <div className="w-full h-8 bg-primary/20 rounded-lg border border-primary/20" />,
    },
  ];

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
                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                : 'border-border/60 bg-surface-900/20 hover:border-primary/45 hover:bg-surface-800/40'
              }
            `}
          >
            <div className="w-full">
              {t.preview}
            </div>
            <div>
              <p className={`text-[11px] font-bold ${isActive ? 'text-primary' : 'text-text-primary'}`}>{t.label}</p>
              <p className="text-[9px] text-text-muted">{t.description}</p>
            </div>
            {isActive && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN CMS BLOG BUILDER
// ============================================================
interface CMSBlogBuilderProps {
  state: CMSBlogState;
  onChange: (state: CMSBlogState) => void;
  categories: string[];
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving?: boolean;
  saveLabel?: string;
  titleLabel?: string;
}

const SECTION_TYPES: { type: SectionType; label: string; icon: React.ElementType }[] = [
  { type: 'text', label: 'Text Block', icon: Type },
  { type: 'image', label: 'Media Block', icon: ImageIcon },
  { type: 'quote', label: 'Blockquote', icon: Quote },
  { type: 'divider', label: 'Divider Row', icon: Minus },
];

function createSection(type: SectionType): ContentSection {
  const id = generateId();
  switch (type) {
    case 'text': return { type: 'text', id, html: '' };
    case 'image': return { type: 'image', id, template: 'single', images: [{ url: '', alt: '' }], caption: '' };
    case 'quote': return { type: 'quote', id, text: '', attribution: '' };
    case 'divider': return { type: 'divider', id };
  }
}

export default function CMSBlogBuilder({
  state,
  onChange,
  categories,
  onSave,
  onCancel,
  saving = false,
  saveLabel = "Publish Article",
  titleLabel = "CMS Blog Builder"
}: CMSBlogBuilderProps) {
  
  const updateState = (updates: Partial<CMSBlogState>) => {
    onChange({ ...state, ...updates });
  };

  const updateSections = (sections: ContentSection[]) => {
    onChange({ ...state, sections });
  };

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    updateSections(state.sections.map(s => s.id === id ? { ...s, ...updates } as ContentSection : s));
  };

  const removeSection = (id: string) => {
    updateSections(state.sections.filter(s => s.id !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const idx = state.sections.findIndex(s => s.id === id);
    if (direction === 'up' && idx > 0) {
      const next = [...state.sections];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      updateSections(next);
    }
    if (direction === 'down' && idx < state.sections.length - 1) {
      const next = [...state.sections];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      updateSections(next);
    }
  };

  const addSection = (type: SectionType, afterId?: string) => {
    const newSection = createSection(type);
    if (afterId) {
      const idx = state.sections.findIndex(s => s.id === afterId);
      const next = [...state.sections];
      next.splice(idx + 1, 0, newSection);
      updateSections(next);
    } else {
      updateSections([...state.sections, newSection]);
    }
  };

  const handleTemplateChange = (id: string, template: ImageTemplate) => {
    const section = state.sections.find(s => s.id === id);
    if (!section || section.type !== 'image') return;

    const requiredCount = getTemplateImageCount(template);
    const currentImages = section.images;
    const images = Array.from({ length: requiredCount }, (_, i) =>
      currentImages[i] || { url: '', alt: '' }
    );

    updateSection(id, { template, images } as Partial<ContentSection>);
  };

  const updateImage = (sectionId: string, imageIdx: number, url: string) => {
    const section = state.sections.find(s => s.id === sectionId);
    if (!section || section.type !== 'image') return;

    const images = [...section.images];
    images[imageIdx] = { ...images[imageIdx], url };
    updateSection(sectionId, { images } as Partial<ContentSection>);
  };

  return (
    <form onSubmit={onSave} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start animate-fadeIn">
      {/* Left Column: Layout Sections List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)] flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-primary" /> Content Sections Builder
            </h2>
            <p className="text-xs text-text-muted">Draft structured content blocks to style your post</p>
          </div>
          <span className="text-xs text-text-muted font-mono bg-surface-800 px-2.5 py-1 rounded-lg">
            {state.sections.length} Block{state.sections.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-4">
          {state.sections.map((section, idx) => (
            <div key={section.id} className="relative group">
              <Card className="border border-border/80 bg-surface-900/30 overflow-hidden shadow-md">
                
                {/* Section Block Title Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-surface-950/40 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-text-muted/40 cursor-grab" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      {section.type === 'text' && 'Text Section'}
                      {section.type === 'image' && 'Media Grid Section'}
                      {section.type === 'quote' && 'Blockquote Section'}
                      {section.type === 'divider' && 'Divider'}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={idx === state.sections.length - 1}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      disabled={state.sections.length <= 1}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Section Fields Renders */}
                <div className="p-4 space-y-4">
                  {section.type === 'text' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Heading (Optional)</label>
                          <input
                            type="text"
                            value={section.title || ''}
                            onChange={(e) => updateSection(section.id, { title: e.target.value } as Partial<ContentSection>)}
                            placeholder="e.g. Overview & Scope"
                            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Sub-heading (Optional)</label>
                          <input
                            type="text"
                            value={section.subtitle || ''}
                            onChange={(e) => updateSection(section.id, { subtitle: e.target.value } as Partial<ContentSection>)}
                            placeholder="e.g. Prerequisites and setup instructions"
                            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                      </div>
                      <div className="border-t border-border/40 pt-3">
                        <RichTextEditor
                          value={section.html}
                          onChange={(html) => updateSection(section.id, { html } as Partial<ContentSection>)}
                          placeholder="Write rich HTML paragraphs, notes, or checklists here..."
                        />
                      </div>
                    </div>
                  )}

                  {section.type === 'image' && (
                    <div className="space-y-4">
                      <ImageTemplateSelector
                        value={section.template}
                        onChange={(template) => handleTemplateChange(section.id, template)}
                      />
                      
                      <div className="space-y-2 border-t border-border/40 pt-3">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Image Source URLs / seeds</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {section.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="space-y-1">
                              <label className="text-[9px] text-text-muted">Slot #{imgIdx + 1} Image URL or Unsplash Seed</label>
                              <input
                                type="text"
                                value={img.url}
                                onChange={(e) => updateImage(section.id, imgIdx, e.target.value)}
                                placeholder="e.g. cyber, server, or https://..."
                                className="w-full px-3 py-1.5 rounded-lg bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Caption Text</label>
                        <input
                          type="text"
                          value={section.caption || ''}
                          onChange={(e) => updateSection(section.id, { caption: e.target.value } as Partial<ContentSection>)}
                          placeholder="Image captions or attribution notes..."
                          className="w-full px-3 py-1.5 rounded-lg bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {section.type === 'quote' && (
                    <div className="space-y-3">
                      <div className="relative pl-4">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-full" />
                        <textarea
                          value={section.text}
                          onChange={(e) => updateSection(section.id, { text: e.target.value } as Partial<ContentSection>)}
                          className="w-full p-3 rounded-xl bg-surface-800/80 border border-border text-sm text-text-secondary italic placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none h-24"
                          placeholder="Type quote message..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Quote Attribution</label>
                        <input
                          type="text"
                          value={section.attribution || ''}
                          onChange={(e) => updateSection(section.id, { attribution: e.target.value } as Partial<ContentSection>)}
                          className="w-full px-3 py-1.5 rounded-lg bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="e.g. John Doe, President of Cyberlogic"
                        />
                      </div>
                    </div>
                  )}

                  {section.type === 'divider' && (
                    <div className="py-6 flex items-center justify-center">
                      <div className="w-full border-t border-dashed border-primary/20 relative">
                        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-surface-900 text-[9px] text-primary/40 uppercase tracking-widest font-mono">
                          Divider Block
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Hover + Add Section Button between sections */}
              <div className="flex justify-center my-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                <div className="relative group/menu">
                  <button
                    type="button"
                    className="p-1.5 rounded-full border border-primary/30 bg-surface-950 text-primary hover:bg-primary hover:text-white transition-all shadow-md flex items-center justify-center cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all duration-200 z-30">
                    <div className="bg-surface-950 border border-border/80 rounded-xl shadow-xl p-1 flex gap-1 whitespace-nowrap">
                      {SECTION_TYPES.map(st => (
                        <button
                          key={st.type}
                          type="button"
                          onClick={() => addSection(st.type, section.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-text-secondary hover:bg-primary hover:text-white transition-colors"
                        >
                          <st.icon size={11} /> {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Metadata Panel in dark glass card */}
      <div className="space-y-6">
        <Card className="p-5 border border-border/80 bg-surface-900/60 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/60 pb-2">
            <FileText className="w-4 h-4" /> {titleLabel}
          </h2>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Title *</label>
            <input
              type="text"
              required
              value={state.title}
              onChange={e => updateState({ title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Post title..."
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Subtitle / Tagline</label>
            <input
              type="text"
              value={state.subtitle || ''}
              onChange={e => updateState({ subtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Tagline or secondary description..."
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Excerpt Summary *</label>
            <textarea
              required
              value={state.excerpt}
              onChange={e => updateState({ excerpt: e.target.value })}
              className="w-full p-3 rounded-xl bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none h-20"
              placeholder="Brief summary shown on feeds..."
              maxLength={500}
            />
            <p className="text-[10px] text-text-muted text-right">{state.excerpt.length}/500</p>
          </div>

          {/* Cover Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Cover Image URL / Seed</label>
            <input
              type="text"
              value={state.image || ''}
              onChange={e => updateState({ image: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Image link or Unsplash query..."
            />
          </div>

          {/* Intro Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Intro Paragraph Text</label>
            <textarea
              value={state.content}
              onChange={e => updateState({ content: e.target.value })}
              className="w-full p-3 rounded-xl bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none h-20"
              placeholder="Introductory paragraph..."
            />
          </div>

          {/* Author & Read Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                <User size={10} /> Author *
              </label>
              <input
                type="text"
                required
                value={state.author}
                onChange={e => updateState({ author: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                placeholder="Author name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                <Clock size={10} /> Read Time
              </label>
              <input
                type="text"
                value={state.readTime || ''}
                onChange={e => updateState({ readTime: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                placeholder="e.g. 5 min"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Tag size={12} /> Category *
            </label>
            <select
              value={state.category}
              onChange={e => updateState({ category: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Featured/Pinned Toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-surface-950/40 rounded-xl hover:bg-surface-900/50 transition-all border border-border/40">
            <input
              type="checkbox"
              checked={state.featured || false}
              onChange={e => updateState({ featured: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer [color-scheme:dark]"
            />
            <div className="flex items-center gap-2">
              <Star size={14} className={state.featured ? 'text-warning fill-warning' : 'text-text-muted'} />
              <span className="text-xs font-bold text-text-primary select-none">Pin / Feature Article</span>
            </div>
          </label>

          {/* Action Buttons inside metadata panel */}
          <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
            <Button
              type="submit"
              variant="admin"
              isLoading={saving}
              className="w-full py-2.5"
            >
              {saveLabel}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="w-full py-2"
            >
              Cancel
            </Button>
          </div>

        </Card>
      </div>
    </form>
  );
}
