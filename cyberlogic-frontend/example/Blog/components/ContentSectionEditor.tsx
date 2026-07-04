import { Plus, Trash2, ChevronUp, ChevronDown, Type, Image, Quote, Minus, GripVertical } from 'lucide-react';
import type { ContentSection, ImageTemplate, SectionType } from '../types/blog-editor.types';
import { getTemplateImageCount, generateId } from '../types/blog-editor.types';
import RichTextEditor from './RichTextEditor';
import ImageTemplateSelector from './ImageTemplateSelector';
import ImageUploadZone from './ImageUploadZone';

interface ContentSectionEditorProps {
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
}

const SECTION_TYPES: { type: SectionType; label: string; icon: React.ElementType }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'image', label: 'Images', icon: Image },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'divider', label: 'Divider', icon: Minus },
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

export default function ContentSectionEditor({ sections, onChange }: ContentSectionEditorProps) {

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    onChange(sections.map(s => s.id === id ? { ...s, ...updates } as ContentSection : s));
  };

  const removeSection = (id: string) => {
    if (sections.length <= 1) return;
    onChange(sections.filter(s => s.id !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if (direction === 'up' && idx > 0) {
      const next = [...sections];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      onChange(next);
    }
    if (direction === 'down' && idx < sections.length - 1) {
      const next = [...sections];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      onChange(next);
    }
  };

  const addSection = (type: SectionType, afterId?: string) => {
    const newSection = createSection(type);
    if (afterId) {
      const idx = sections.findIndex(s => s.id === afterId);
      const next = [...sections];
      next.splice(idx + 1, 0, newSection);
      onChange(next);
    } else {
      onChange([...sections, newSection]);
    }
  };

  const handleTemplateChange = (id: string, template: ImageTemplate) => {
    const section = sections.find(s => s.id === id);
    if (!section || section.type !== 'image') return;

    const requiredCount = getTemplateImageCount(template);
    const currentImages = section.images;
    const images = Array.from({ length: requiredCount }, (_, i) =>
      currentImages[i] || { url: '', alt: '' }
    );

    updateSection(id, { template, images } as Partial<ContentSection>);
  };

  const updateImage = (sectionId: string, imageIdx: number, url: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || section.type !== 'image') return;

    const images = [...section.images];
    images[imageIdx] = { ...images[imageIdx], url };
    updateSection(sectionId, { images } as Partial<ContentSection>);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-charcoal tracking-[0.2em] uppercase">Content Sections</p>
        <span className="text-[10px] text-muted font-bold">{sections.length} block{sections.length !== 1 ? 's' : ''}</span>
      </div>

      {sections.map((section, idx) => (
        <div key={section.id} className="group relative">
          {/* Section Card */}
          <div className="bg-white border border-border/50 rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-shadow">
            {/* Section Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-subtle/20 border-b border-border/30">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-muted/40" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                  {section.type === 'text' && 'Text Block'}
                  {section.type === 'image' && 'Image Block'}
                  {section.type === 'quote' && 'Blockquote'}
                  {section.type === 'divider' && 'Divider'}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => moveSection(section.id, 'up')} disabled={idx === 0}
                  className="p-1.5 rounded-lg text-muted hover:text-charcoal hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveSection(section.id, 'down')} disabled={idx === sections.length - 1}
                  className="p-1.5 rounded-lg text-muted hover:text-charcoal hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => removeSection(section.id)} disabled={sections.length <= 1}
                  className="p-1.5 rounded-lg text-muted hover:text-crimson hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors ml-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div className="p-4">
              {section.type === 'text' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Header / Title</label>
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => updateSection(section.id, { title: e.target.value } as Partial<ContentSection>)}
                        placeholder="e.g. The Perfect Noodle"
                        className="input-field text-sm py-2.5 font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Sub-header / Subtitle</label>
                      <input
                        type="text"
                        value={section.subtitle || ''}
                        onChange={(e) => updateSection(section.id, { subtitle: e.target.value } as Partial<ContentSection>)}
                        placeholder="e.g. A deep dive into regional variations"
                        className="input-field text-sm py-2.5 font-medium"
                      />
                    </div>
                  </div>
                  <div className="border-t border-border/30 pt-4">
                    <RichTextEditor
                      value={section.html}
                      onChange={(html) => updateSection(section.id, { html } as Partial<ContentSection>)}
                      placeholder="Write your content here..."
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
                  <div className={`grid gap-2 ${
                    section.template === 'single' || section.template === 'banner' ? 'grid-cols-1' :
                    section.template === 'side-by-side' ? 'grid-cols-2' :
                    section.template === 'bento-3' ? 'grid-cols-3' :
                    section.template === 'bento-4' ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}>
                    {section.images.map((img, imgIdx) => (
                      <ImageUploadZone
                        key={imgIdx}
                        value={img.url}
                        onChange={(url) => updateImage(section.id, imgIdx, url)}
                        aspectHint={section.template === 'banner' ? '21:9 aspect ratio' : '16:9 aspect ratio'}
                        resolutionHint={section.template === 'banner' ? '1920×400px' : '800×450px'}
                        compact
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={section.caption || ''}
                    onChange={(e) => updateSection(section.id, { caption: e.target.value } as Partial<ContentSection>)}
                    placeholder="Optional caption..."
                    className="input-field text-xs py-2"
                  />
                </div>
              )}

              {section.type === 'quote' && (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-full" />
                    <textarea
                      value={section.text}
                      onChange={(e) => updateSection(section.id, { text: e.target.value } as Partial<ContentSection>)}
                      className="input-field text-sm font-medium italic pl-5 resize-none h-24 border-none shadow-none"
                      placeholder="Enter quote text..."
                    />
                  </div>
                  <input
                    type="text"
                    value={section.attribution || ''}
                    onChange={(e) => updateSection(section.id, { attribution: e.target.value } as Partial<ContentSection>)}
                    className="input-field text-xs py-2"
                    placeholder="— Attribution (optional)"
                  />
                </div>
              )}

              {section.type === 'divider' && (
                <div className="py-4 flex items-center justify-center">
                  <div className="w-full border-t-2 border-border/40 border-dashed" />
                </div>
              )}
            </div>
          </div>

          {/* Add Section Button (between sections) */}
          <div className="flex justify-center my-1">
            <div className="relative group/add">
              <button className="p-1.5 rounded-full border border-border/40 bg-white text-muted hover:text-brand hover:border-brand/40 hover:bg-brand/5 cursor-pointer transition-all shadow-sm">
                <Plus size={14} />
              </button>
              {/* Dropdown */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 invisible group-hover/add:opacity-100 group-hover/add:visible transition-all duration-200 z-50">
                <div className="bg-white border border-border/50 rounded-xl shadow-elevated p-1 flex gap-0.5 whitespace-nowrap">
                  {SECTION_TYPES.map(st => (
                    <button
                      key={st.type}
                      onClick={() => addSection(st.type, section.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-charcoal hover:bg-brand hover:text-white cursor-pointer transition-colors"
                    >
                      <st.icon size={12} /> {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Add First Section (if empty unlikely but safeguard) */}
      {sections.length === 0 && (
        <div className="flex justify-center gap-2 py-8">
          {SECTION_TYPES.map(st => (
            <button
              key={st.type}
              onClick={() => addSection(st.type)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 text-sm font-bold text-charcoal hover:border-brand hover:text-brand cursor-pointer transition-colors"
            >
              <st.icon size={16} /> {st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
