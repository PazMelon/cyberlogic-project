import { useState } from 'react';
import { Star, Clock, Tag, User, PlusCircle } from 'lucide-react';
import type { BlogEditorState } from '../types/blog-editor.types';
import { CATEGORIES } from '../types/blog-editor.types';
import Select from '../../../../components/ui/Select';
import ImageUploadZone from './ImageUploadZone';

interface BlogMetadataPanelProps {
  state: BlogEditorState;
  onChange: (updates: Partial<BlogEditorState>) => void;
}

export default function BlogMetadataPanel({ state, onChange }: BlogMetadataPanelProps) {
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const allCategories = CATEGORIES.includes(state.category) || state.category === ''
    ? CATEGORIES
    : [...CATEGORIES, state.category];

  const handleCustomCategorySubmit = () => {
    const trimmed = customCategory.trim();
    if (trimmed && !CATEGORIES.includes(trimmed)) {
      onChange({ category: trimmed });
      setCustomCategory('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-1.5">Title</label>
        <input
          value={state.title}
          onChange={e => onChange({ title: e.target.value })}
          className="input-field text-sm font-bold"
          placeholder="Your post title..."
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-1.5">Excerpt</label>
        <textarea
          value={state.excerpt}
          onChange={e => onChange({ excerpt: e.target.value })}
          className="input-field text-sm h-20 resize-none font-medium"
          placeholder="Brief summary for previews..."
          maxLength={500}
        />
        <p className="text-[10px] text-muted mt-1 text-right">{state.excerpt.length}/500</p>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-1.5">Cover Image</label>
        <ImageUploadZone
          value={state.image}
          onChange={(url) => onChange({ image: url })}
          aspectHint="16:9 aspect ratio"
          resolutionHint="1200×630px, JPG/PNG/WebP"
        />
      </div>

      {/* Author & Read Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1">
            <User size={10} /> Author
          </label>
          <input
            value={state.author}
            onChange={e => onChange({ author: e.target.value })}
            className="input-field text-sm font-medium"
            placeholder="Author name"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1">
            <Clock size={10} /> Read Time
          </label>
          <input
            value={state.read_time}
            onChange={e => onChange({ read_time: e.target.value })}
            className="input-field text-sm font-medium"
            placeholder="5 min"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1">
          <Tag size={10} /> Category
        </label>
        {showCustomInput ? (
          <div className="flex gap-2">
            <input
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomCategorySubmit()}
              className="input-field text-sm font-medium flex-1"
              placeholder="Custom category..."
              autoFocus
            />
            <button
              onClick={handleCustomCategorySubmit}
              disabled={!customCategory.trim()}
              className="btn-primary text-xs px-3 py-2"
            >
              Add
            </button>
            <button
              onClick={() => setShowCustomInput(false)}
              className="btn-ghost text-xs px-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-start">
            <Select
              value={state.category}
              onChange={(val: string) => onChange({ category: val })}
              options={allCategories.map(c => ({ value: c, label: c }))}
              fullWidth
              size="sm"
            />
            <button
              onClick={() => setShowCustomInput(true)}
              className="shrink-0 p-2.5 rounded-xl border border-border/50 text-muted hover:text-brand hover:border-brand/40 cursor-pointer transition-colors"
              title="Add custom category"
            >
              <PlusCircle size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Featured Toggle */}
      <label className="flex items-center gap-3 cursor-pointer p-3 bg-subtle/30 rounded-xl hover:bg-subtle/50 transition-colors">
        <input
          type="checkbox"
          checked={state.featured}
          onChange={e => onChange({ featured: e.target.checked })}
          className="w-4 h-4 rounded border-border text-brand focus:ring-brand/30 cursor-pointer"
        />
        <div className="flex items-center gap-2">
          <Star size={14} className={state.featured ? 'text-brand fill-brand' : 'text-muted'} />
          <span className="text-sm font-bold text-charcoal">Featured Post</span>
        </div>
      </label>
    </div>
  );
}
