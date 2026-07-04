import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminBlogPost, createBlogPost, updateBlogPost } from '../../../api/admin';
import type { BlogEditorState, ContentSection } from '../types/blog-editor.types';
import { INITIAL_EDITOR_STATE, generateId } from '../types/blog-editor.types';
import { useModal } from '../../../../contexts/ModalContext';


const AUTOSAVE_KEY = 'wty_blog_draft';
const AUTOSAVE_INTERVAL = 5000; // 5 seconds

function serializeContent(sections: ContentSection[]): string {
  return JSON.stringify(sections);
}

function deserializeContent(content: string): ContentSection[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Legacy plain-text content — wrap in a single text section
  }
  return [{ type: 'text', id: generateId(), html: content || '' }];
}

export function useBlogEditor(editId: number | null) {
  const { alert } = useModal();
  const navigate = useNavigate();

  const [state, setState] = useState<BlogEditorState>(INITIAL_EDITOR_STATE);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialLoadDone = useRef(false);

  // --- Load existing post for editing ---
  useEffect(() => {
    if (!editId) {
      // Check for auto-saved draft
      const draft = localStorage.getItem(AUTOSAVE_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed && parsed.title !== undefined) {
            setState(parsed);
          }
        } catch { /* ignore corrupt drafts */ }
      }
      initialLoadDone.current = true;
      return;
    }

    async function loadPost() {
      try {
        const post = await fetchAdminBlogPost(editId!);
        setState({
          title: post.title || '',
          excerpt: post.excerpt || '',
          author: post.author || '',
          category: post.category || 'Guides',
          image: post.image || '',
          read_time: post.readTime || '5 min',
          featured: post.featured || false,
          sections: deserializeContent(post.content || ''),
        });
      } catch (err) {
        console.error('Failed to load blog post:', err);
      } finally {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
    loadPost();
  }, [editId]);

  // --- Auto-save to localStorage ---
  useEffect(() => {
    if (!initialLoadDone.current) return;
    // Only auto-save for new posts (not edits)
    if (editId) return;

    setHasUnsavedChanges(true);
    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    }, AUTOSAVE_INTERVAL);

    return () => clearTimeout(timer);
  }, [state, editId]);

  // --- Warn on unload ---
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const updateState = useCallback((updates: Partial<BlogEditorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSections = useCallback((sections: ContentSection[]) => {
    setState(prev => ({ ...prev, sections }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        title: state.title,
        excerpt: state.excerpt,
        content: serializeContent(state.sections),
        author: state.author,
        category: state.category,
        image: state.image,
        read_time: state.read_time,
        featured: state.featured,
        published_at: new Date().toISOString().split('T')[0],
      };

      if (editId) {
        await updateBlogPost(editId, payload);
      } else {
        await createBlogPost(payload);
        // Clear autosave draft on successful publish
        localStorage.removeItem(AUTOSAVE_KEY);
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      navigate('/admin/blog');
    } catch (err) {
      console.error('Failed to save blog post:', err);
      await alert({
        title: 'Save Failed',
        message: 'Something went wrong while saving your post. Please check your connection and try again.',
        type: 'danger'
      });

    } finally {
      setSaving(false);
    }
  }, [state, editId, navigate]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setState(INITIAL_EDITOR_STATE);
    setHasUnsavedChanges(false);
  }, []);

  const isValid = state.title.trim().length > 0 && state.excerpt.trim().length > 0 && state.author.trim().length > 0;

  return {
    state,
    loading,
    saving,
    lastSaved,
    hasUnsavedChanges,
    isValid,
    updateState,
    updateSections,
    save,
    discardDraft,
  };
}
