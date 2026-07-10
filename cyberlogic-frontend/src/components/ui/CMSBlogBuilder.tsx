import { useState, useEffect } from "react";
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
  Clock,
  Tag,
  User,
  Star,
  Layers,
  FileText,
  Columns2,
  LayoutGrid,
  Grid3X3,
  GalleryHorizontalEnd,
  PanelTop,
  GalleryHorizontal,
  Eye,
  X,
  Upload,
  Link2
} from "lucide-react";
import { Button, Card } from "../ui";
import BlogContentRenderer, { resolveCmsUrl } from "../common/BlogContentRenderer";
import { fetchDirectory } from "../../utils/api";
import { FullscreenImageViewer } from "../forum/FullscreenImageViewer";

// Reusable Subcomponents and Types
import type { CMSBlogState, ContentSection, ImageTemplate, SectionType } from "./cms/types";
import { generateId, getTemplateImageCount } from "./cms/types";
import RichTextEditor from "./cms/RichTextEditor";
import ImageTemplateSelector from "./cms/ImageTemplateSelector";
import ImageUploadZone from "./cms/ImageUploadZone";

// Re-export type schemas and ID generators for consumer components (like CreateAnnouncement)
export type { CMSBlogState, ContentSection, ImageTemplate, SectionType };
export { generateId };

interface CMSBlogBuilderProps {
  state: CMSBlogState;
  onChange: (state: CMSBlogState) => void;
  categories: string[];
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving?: boolean;
  saveLabel?: string;
  titleLabel?: string;
  isSuperAdmin?: boolean;
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
    case 'image': return { type: 'image', id, images: [], caption: '' };
    case 'quote': return { type: 'quote', id, text: '', attribution: '' };
    case 'divider': return { type: 'divider', id };
  }
}

function getTemplateLabelAndIcon(t?: ImageTemplate) {
  switch (t) {
    case 'single': return { label: 'Single Image', icon: ImageIcon };
    case 'side-by-side': return { label: 'Side by Side Layout', icon: Columns2 };
    case 'bento-3': return { label: 'Bento Grid (3 Images)', icon: LayoutGrid };
    case 'bento-4': return { label: 'Grid (2x2 Layout)', icon: Grid3X3 };
    case 'bento-6': return { label: 'Masonry Mosaic (6 Images)', icon: GalleryHorizontalEnd };
    case 'banner': return { label: 'Cinematic Wide Banner', icon: PanelTop };
    case 'carousel': return { label: 'Interactive Carousel Slider', icon: GalleryHorizontal };
    default: return { label: 'No layout template selected', icon: ImageIcon };
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
  titleLabel = "CMS Blog Builder",
  isSuperAdmin = false
}: CMSBlogBuilderProps) {

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [tagsInput, setTagsInput] = useState(state.tags ? state.tags.join(", ") : "");

  useEffect(() => {
    if (state.tags) {
      const currentParsed = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      const parentTags = state.tags || [];
      if (JSON.stringify(currentParsed) !== JSON.stringify(parentTags)) {
        setTagsInput(parentTags.join(", "));
      }
    }
  }, [state.tags]);

  // Gather all images for the draft preview fullscreen viewer
  const allImages: string[] = [];
  if (state) {
    if (state.image) {
      allImages.push(resolveCmsUrl(state.image));
    }
    if (state.sections) {
      state.sections.forEach((sec: any) => {
        if (sec.type === "image" && sec.images) {
          sec.images.forEach((img: any) => {
            if (img.url) {
              allImages.push(resolveCmsUrl(img.url));
            }
          });
        }
      });
    }
  }

  const handleImageClick = (url: string) => {
    const idx = allImages.indexOf(url);
    if (idx !== -1) {
      setActiveImageIndex(idx);
      setIsViewerOpen(true);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      const loadMembers = async () => {
        try {
          const data = await fetchDirectory();
          setMembers(data);
        } catch (err) {
          console.error("Failed to load directory for author search:", err);
        }
      };
      loadMembers();
    }
  }, [isSuperAdmin]);

  const toggleCollapse = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...state.sections];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    updateSections(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
    const activeImages = section.images.filter(img => img.url);
    const images = Array.from({ length: requiredCount }, (_, i) =>
      activeImages[i] || { url: '', alt: '' }
    );

    updateSection(id, { template, images } as Partial<ContentSection>);
  };



  return (
    <>
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
              <div
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`relative group transition-all duration-200 ${draggedIndex === idx
                    ? "opacity-35 scale-[0.98] border border-dashed border-primary rounded-xl"
                    : dragOverIndex === idx
                      ? "border-t-2 border-t-primary pt-1.5 animate-pulse"
                      : ""
                  }`}
              >
                <Card className="border border-border/80 bg-surface-900/30 overflow-hidden shadow-md">

                  {/* Section Block Title Toolbar */}
                  <div className={`flex items-center justify-between px-4 py-2.5 bg-surface-950/40 ${collapsedSections[section.id] ? "" : "border-b border-border/60"}`}>
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-text-muted/40 cursor-grab active:cursor-grabbing hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted select-none">
                        {section.type === 'text' && 'Text Section'}
                        {section.type === 'image' && 'Media Grid Section'}
                        {section.type === 'quote' && 'Blockquote Section'}
                        {section.type === 'divider' && 'Divider'}
                      </span>
                      {collapsedSections[section.id] && (
                        <span className="text-[8px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 animate-pulse font-bold ml-1 select-none">
                          Collapsed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(section.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors mr-1 cursor-pointer"
                        title={collapsedSections[section.id] ? "Expand Section" : "Collapse Section"}
                      >
                        {collapsedSections[section.id] ? (
                          <ChevronDown size={14} className="text-primary font-bold" />
                        ) : (
                          <ChevronUp size={14} />
                        )}
                      </button>
                      <div className="w-px h-4 bg-border/40 mx-1" />
                      <button
                        type="button"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={idx === state.sections.length - 1}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        disabled={state.sections.length <= 1}
                        className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1 cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Section Fields Renders */}
                  {!collapsedSections[section.id] && (
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
                          {!section.template ? (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Choose Image Grid Template Layout</label>
                              <ImageTemplateSelector
                                value={section.template as any}
                                onChange={(template) => handleTemplateChange(section.id, template)}
                              />
                            </div>
                          ) : (
                            <div className="space-y-4 animate-fadeIn">
                              {/* Layout Header bar */}
                              {(() => {
                                const activeLayout = getTemplateLabelAndIcon(section.template);
                                const ActiveIcon = activeLayout.icon;
                                const activeImages = section.images.filter(img => img.url);
                                const requiredCount = getTemplateImageCount(section.template);

                                return (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-surface-950/45 p-3 rounded-xl border border-border/80 shadow-inner">
                                      <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                          <ActiveIcon size={16} />
                                        </div>
                                        <div>
                                          <h4 className="text-xs font-bold text-text-primary">{activeLayout.label}</h4>
                                          <p className="text-[10px] text-text-muted">
                                            {section.template === 'carousel'
                                              ? `${activeImages.length} Image${activeImages.length !== 1 ? 's' : ''} Uploaded`
                                              : `${activeImages.length} / ${requiredCount} Image${requiredCount !== 1 ? 's' : ''} Uploaded`
                                            }
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => updateSection(section.id, { template: undefined } as any)}
                                        className="text-[10px] font-bold text-primary hover:underline px-2.5 py-1.5 rounded-lg bg-surface-800 border border-border/80 transition-all cursor-pointer"
                                      >
                                        Change Layout
                                      </button>
                                    </div>

                                    {/* Single Upload dropzone if not filled */}
                                    {activeImages.length < requiredCount ? (
                                      <ImageUploadZone
                                        value=""
                                        onChange={(url) => {
                                          const emptyIdx = section.images.findIndex(img => !img.url);
                                          if (emptyIdx !== -1) {
                                            const nextImages = [...section.images];
                                            nextImages[emptyIdx] = { url, alt: '' };
                                            updateSection(section.id, { images: nextImages } as Partial<ContentSection>);
                                          } else {
                                            updateSection(section.id, { images: [...section.images, { url, alt: '' }] } as Partial<ContentSection>);
                                          }
                                        }}
                                        aspectHint={section.template === 'banner' ? 'Banner: 21:9 ratio' : 'Standard: 16:9 ratio'}
                                        label="Drop or browse a new picture to add to layout"
                                      />
                                    ) : (
                                      <div className="p-4 rounded-xl border border-dashed border-border/60 bg-surface-900/10 text-center text-xs text-text-muted italic select-none">
                                        All {requiredCount} image slots filled for this layout. Remove an image below to upload a new one.
                                      </div>
                                    )}

                                    {/* Preview Grid */}
                                    {activeImages.length > 0 && (
                                      <div className="space-y-2 pt-2 border-t border-border/40">
                                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Uploaded Previews</label>
                                        <div className="flex flex-wrap gap-3">
                                          {activeImages.map((img, imgIdx) => (
                                            <div key={imgIdx} className="relative w-20 h-20 rounded-xl border border-border/80 overflow-hidden group/thumb bg-surface-950/80 shadow-md">
                                              <img
                                                src={img.url.startsWith('data:') || img.url.startsWith('http') ? img.url : `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&auto=format&fit=crop&q=60&sig=${img.url}`}
                                                alt={`Slot ${imgIdx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                                              />
                                              <div className="absolute top-1 left-1 bg-surface-950/85 border border-border/60 text-[8px] font-mono font-bold text-text-secondary px-1.5 py-0.5 rounded">
                                                #{imgIdx + 1}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (section.template === 'carousel') {
                                                    const nextImages = section.images.filter(x => x.url !== img.url);
                                                    updateSection(section.id, { images: nextImages } as Partial<ContentSection>);
                                                  } else {
                                                    const nextImages = section.images.map(x => x.url === img.url ? { url: '', alt: '' } : x);
                                                    updateSection(section.id, { images: nextImages } as Partial<ContentSection>);
                                                  }
                                                }}
                                                className="absolute inset-0 bg-error/85 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-150 flex items-center justify-center rounded-xl cursor-pointer"
                                                title="Remove Image"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

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
                  )}
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
        <div className="space-y-6 lg:sticky lg:top-24 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 scrollbar-thin">
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
            <ImageUploadZone
              value={state.image || ''}
              onChange={url => updateState({ image: url })}
              aspectHint="Cover: 16:9 ratio"
              label="Cover Image"
            />

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

            {/* Author & Read Time OR Event Details */}
            {!state.isEvent ? (
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
            ) : (
              <>
                {/* Event Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={state.eventDate || ''}
                    onChange={e => updateState({ eventDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Event Start Time & End Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      step="900"
                      value={state.eventStartTime || ''}
                      onChange={e => updateState({ eventStartTime: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      step="900"
                      value={state.eventEndTime || ''}
                      onChange={e => updateState({ eventEndTime: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Event Mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                    Event Mode *
                  </label>
                  <select
                    value={state.eventMode || 'registration_and_attendance'}
                    onChange={e => updateState({ eventMode: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="registration_and_attendance">Registration & Attendance (Both Participant RSVP & Audience Check-in)</option>
                    <option value="attendance_only">Attendance Only (No registration, check-in audience via QR only)</option>
                    <option value="registration_only">Registration Only (RSVP only, no QR codes or check-in)</option>
                  </select>
                </div>

                {/* Event Location */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={state.eventLocation || ''}
                    onChange={e => updateState({ eventLocation: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                    placeholder="e.g. IT Lab 402"
                  />
                </div>

                {/* Capacities */}
                <div className="grid grid-cols-2 gap-3">
                  {(state.eventMode !== 'attendance_only') && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                        Registration Capacity
                      </label>
                      <input
                        type="number"
                        value={state.eventCapacity !== undefined ? state.eventCapacity : ''}
                        onChange={e => updateState({ eventCapacity: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="Unlimited if empty"
                      />
                    </div>
                  )}
                  {(state.eventMode !== 'registration_only') && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                        Attendance Capacity
                      </label>
                      <input
                        type="number"
                        value={state.attendanceCapacity !== undefined ? state.attendanceCapacity : ''}
                        onChange={e => updateState({ attendanceCapacity: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="Unlimited if empty"
                      />
                    </div>
                  )}
                </div>

                {/* Timing Windows */}
                {(state.eventMode !== 'attendance_only') && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                        Registration Open Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={state.registrationStart || ''}
                        onChange={e => updateState({ registrationStart: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                        Registration Close Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={state.registrationEnd || ''}
                        onChange={e => updateState({ registrationEnd: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                {(state.eventMode !== 'registration_only') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                        Attendance Open Time
                      </label>
                      <input
                        type="time"
                        step="900"
                        value={state.attendanceStart || ''}
                        onChange={e => updateState({ attendanceStart: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                        Attendance Close Time
                      </label>
                      <input
                        type="time"
                        step="900"
                        value={state.attendanceEnd || ''}
                        onChange={e => updateState({ attendanceEnd: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Author Selection */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <User size={12} /> Author Profile
              </label>
              {isSuperAdmin ? (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm !== "" ? searchTerm : (state.author || "")}
                      placeholder="Search author profile..."
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all pr-8"
                    />
                    {state.authorAvatar && (
                      <img
                        src={state.authorAvatar}
                        alt=""
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full object-cover border border-border"
                      />
                    )}
                  </div>
                  {showDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-surface-900 border border-border/85 rounded-xl shadow-xl scrollbar-thin">
                      {members
                        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              updateState({
                                userId: m.id,
                                author: m.name,
                                authorAvatar: m.avatar,
                              });
                              setSearchTerm(m.name);
                              setShowDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-white/5 transition-all text-text-primary flex items-center gap-2 cursor-pointer"
                          >
                            <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                            <div>
                              <p className="font-semibold text-text-primary">{m.name}</p>
                              <p className="text-[9px] text-text-muted">{m.role} · {m.department}</p>
                            </div>
                          </button>
                        ))}
                      {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <div className="p-3 text-xs text-text-muted italic text-center">No profiles found</div>
                      )}
                    </div>
                  )}
                  {/* Click outside overlay */}
                  {showDropdown && (
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  )}
                </>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-surface-800/40 border border-border/40 text-sm text-text-muted flex items-center gap-2">
                  {state.authorAvatar ? (
                    <img src={state.authorAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User size={14} className="text-text-muted" />
                  )}
                  <span>{state.author || "System Admin"}</span>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <Tag size={12} /> {state.isEvent ? "Event Type *" : (state.isResource ? "Resource Category *" : "Category *")}
              </label>
              <select
                value={state.category}
                onChange={e => updateState({ category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all select-none"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Resource Specific Fields */}
            {state.isResource && (
              <>
                {/* Resource Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                    <Link2 size={12} /> Resource URL Link
                  </label>
                  <input
                    type="url"
                    value={state.resourceLink || ""}
                    onChange={e => updateState({ resourceLink: e.target.value })}
                    placeholder="https://example.com/project"
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Resource File Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                    <Upload size={12} /> Resource File Attachment
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id="resource-file-input"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        updateState({ resourceFile: file });
                      }}
                    />
                    <label
                      htmlFor="resource-file-input"
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-surface-800 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all text-center"
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      {state.resourceFile ? state.resourceFile.name : (state.resourceFilePath ? "Replace attached file" : "Upload file attachment")}
                    </label>
                    {(state.resourceFile || state.resourceFilePath) && (
                      <p className="text-[10px] text-text-muted italic truncate max-w-[280px]">
                        Attached: {state.resourceFile ? state.resourceFile.name : (state.resourceFilePath ? "Existing file in cloud" : "")}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Status Selection */}
            {state.status !== undefined && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  Status *
                </label>
                <select
                  value={state.status}
                  onChange={e => updateState({ status: e.target.value as 'published' | 'draft' })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            )}

            {/* Tags Input */}
            {state.tags !== undefined && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => {
                    const val = e.target.value;
                    setTagsInput(val);
                    const parsedTags = val.split(",").map(t => t.trim()).filter(Boolean);
                    updateState({ tags: parsedTags });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="e.g. tutorial, security, coding"
                />
              </div>
            )}

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
                <span className="text-xs font-bold text-text-primary select-none">
                  {state.isEvent ? "Feature / Pin Event" : "Pin / Feature Article"}
                </span>
              </div>
            </label>

            {/* Action Buttons inside metadata panel */}
            <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
              <Button
                type="submit"
                variant="admin"
                isLoading={saving}
                className="w-full py-2.5 cursor-pointer"
              >
                {saveLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsPreviewOpen(true)}
                className="w-full py-2 flex items-center justify-center gap-1.5 border border-primary/20 text-primary hover:bg-primary hover:text-white cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Preview Draft
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="w-full py-2 cursor-pointer"
              >
                Cancel
              </Button>
            </div>

          </Card>
        </div>
      </form>

      {/* Dynamic Draft Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-950/95 flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-surface-900 border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-950/40">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-text-primary">CMS Live Post Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable draft rendering) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-thin">

              {/* Blog Header Preview */}
              <div className="space-y-4">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {state.category}
                </span>

                <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary leading-tight">
                  {state.title || <span className="text-text-muted italic">Untitled Draft</span>}
                </h1>

                {state.subtitle && (
                  <p className="text-lg text-text-muted font-light leading-relaxed">
                    {state.subtitle}
                  </p>
                )}

                {/* Author Card info OR Event info */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                  <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center border border-border">
                    <User className="w-5 h-5 text-primary/70" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {state.isEvent ? "Event Schedule" : (state.author || "System Admin")}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {state.isEvent ? (
                        `Date: ${state.eventDate || "TBD"} · Time: ${state.eventStartTime || "TBD"} - ${state.eventEndTime || "TBD"} · Location: ${state.eventLocation || "TBD"}`
                      ) : (
                        `Published Date Preview · ${state.readTime || "5 min read"}`
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cover Image banner */}
              {state.image && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border/60">
                  <img
                    src={resolveCmsUrl(state.image)}
                    alt="Cover Preview"
                    onClick={() => handleImageClick(resolveCmsUrl(state.image as string))}
                    className="w-full h-full object-cover cursor-zoom-in"
                  />
                </div>
              )}

              {/* Post Content & Sections */}
              <div className="space-y-6">
                {state.content && (
                  <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
                    {state.content}
                  </p>
                )}

                {state.sections && state.sections.length > 0 ? (
                  <div className="pt-6 border-t border-border/30">
                    <BlogContentRenderer content={state.sections} onImageClick={handleImageClick} />
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">No body blocks added yet.</p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface-950/40 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2 cursor-pointer"
              >
                Close Preview
              </Button>
            </div>

          </div>
        </div>
      )}

      {isViewerOpen && allImages.length > 0 && (
        <FullscreenImageViewer
          images={allImages}
          initialIndex={activeImageIndex}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
}
