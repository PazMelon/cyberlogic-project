import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Eye, EyeOff, FileText,
  Loader2, Clock, User, Tag, Calendar
} from 'lucide-react';
import { useBlogEditor } from './hooks/useBlogEditor';
import BlogMetadataPanel from './components/BlogMetadataPanel';
import ContentSectionEditor from './components/ContentSectionEditor';
import BlogContentRenderer from '../../../components/common/BlogContentRenderer';
import { getImageUrl } from '../../../utils/imageUrl';

import { useModal } from '../../../contexts/ModalContext';

export default function BlogEditorPage() {
  const { confirm } = useModal();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editId = id ? Number(id) : null;
  const [showPreview, setShowPreview] = useState(false);

  const {
    state,
    loading,
    saving,
    hasUnsavedChanges,
    isValid,
    updateState,
    updateSections,
    save,
    discardDraft,
  } = useBlogEditor(editId);

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      const isConfirmed = await confirm({
        title: 'Unsaved Changes',
        message: 'You have modified this post. Are you sure you want to leave? Your changes will be lost.',
        type: 'warning',
        confirmText: 'Leave Page',
        cancelText: 'Stay & Edit'
      });
      if (!isConfirmed) return;
    }
    navigate('/admin/blog');
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 size={32} className="text-brand animate-spin" />
          <p className="text-sm font-bold text-muted">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl border border-border/50 text-muted hover:text-charcoal hover:border-charcoal cursor-pointer transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-charcoal tracking-tight">
              {editId ? 'Edit Post' : 'Create New Post'}
            </h1>
            <p className="text-xs text-muted font-medium mt-0.5">
              {hasUnsavedChanges ? (
                <span className="text-amber-600 font-bold">● Unsaved changes</span>
              ) : (
                <span className="text-success">✓ All changes saved</span>
              )}
              {!editId && (
                <span className="ml-2 text-muted">• Auto-saving drafts</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editId && hasUnsavedChanges && (
            <button
              onClick={discardDraft}
              className="btn-ghost text-xs text-crimson hover:bg-red-50"
            >
              Discard Draft
            </button>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all border ${
              showPreview
                ? 'bg-charcoal text-white border-charcoal shadow-sm'
                : 'bg-white border-border/50 text-charcoal hover:border-charcoal'
            }`}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Editor' : 'Preview'}
          </button>
          <button
            onClick={save}
            disabled={saving || !isValid}
            className="btn-primary flex items-center gap-2 text-sm shadow-sm hover:shadow-md transition-shadow"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : editId ? 'Update Post' : 'Publish Post'}
          </button>
        </div>
      </div>

      {showPreview ? (
        /* ============================================================ */
        /* PREVIEW MODE                                                  */
        /* ============================================================ */
        <div className="max-w-3xl mx-auto animate-scale-in bg-white p-8 md:p-12 rounded-[2.5rem] shadow-elevated border border-border/40">
          {/* Cover Image */}
          {state.image && (
            <div className="relative rounded-3xl overflow-hidden aspect-video mb-10 shadow-lg">
              <img src={getImageUrl(state.image)!} alt={state.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}

          {/* Post Header */}
          <div className="mb-10 text-center">
            {state.category && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand/10 text-brand text-[11px] font-black uppercase tracking-[0.2em] rounded-full mb-6">
                <Tag size={12} /> {state.category}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-charcoal tracking-tight leading-tight mb-6">
              {state.title || 'Untitled Post'}
            </h1>
            <p className="text-xl text-muted leading-relaxed mb-8 max-w-2xl mx-auto font-medium">
              {state.excerpt}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-muted font-black uppercase tracking-widest border-y border-border/40 py-6">
              {state.author && (
                <span className="flex items-center gap-2">
                  <User size={14} className="text-brand" /> {state.author}
                </span>
              )}
              {state.read_time && (
                <span className="flex items-center gap-2">
                  <Clock size={14} className="text-brand" /> {state.read_time}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Calendar size={14} className="text-brand" /> {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Rendered Sections */}
          <div className="mt-12">
            <BlogContentRenderer content={JSON.stringify(state.sections)} />
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* EDITOR MODE                                                    */
        /* ============================================================ */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Content Editor (Main Area) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-brand" />
              <p className="text-[10px] font-black text-charcoal tracking-[0.2em] uppercase">Post Content</p>
            </div>
            <ContentSectionEditor
              sections={state.sections}
              onChange={updateSections}
            />
          </div>

          {/* Metadata Sidebar */}
          <div className="lg:sticky lg:top-[88px]">
            <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-soft">
              <p className="text-[10px] font-black text-charcoal tracking-[0.2em] uppercase mb-5">Post Settings</p>
              <BlogMetadataPanel
                state={state}
                onChange={updateState}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
