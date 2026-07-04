import { useState, useEffect, useCallback } from 'react';
import { fetchAdminBlogPosts, createBlogPost, updateBlogPost, toggleBlogFeatured, deleteBlogPost, fetchAdminBlogPost } from '../../../api/admin';
import type { AdminBlogPost } from '../../../types/admin.types';

export interface BlogFormState {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image: string;
  read_time: string;
  featured: boolean;
  [key: string]: any;
}

const INITIAL_FORM: BlogFormState = {
  title: '',
  excerpt: '',
  content: '',
  author: '',
  category: 'Guides',
  image: '',
  read_time: '5 min',
  featured: false
};

import { useModal } from '../../../../contexts/ModalContext';

export function useBlogManagement() {
  const { confirm } = useModal();
  const [posts, setPosts] = useState<{ data: AdminBlogPost[]; total: number; current_page: number; last_page: number }>({ 
    data: [], total: 0, current_page: 1, last_page: 1 
  });

  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BlogFormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // DataTable State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState('published_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await fetchAdminBlogPosts({ 
        search, page, per_page: perPage, sort_by: sortBy, sort_dir: sortDir 
      }));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [search, page, perPage, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleEdit = async (id: number) => {
    try {
      const post = await fetchAdminBlogPost(id);
      setForm({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content || '',
        author: post.author,
        category: post.category,
        image: post.image || '',
        read_time: post.readTime, // Note: backend might use read_time or readTime mapping
        featured: post.featured,
      });
      setEditingId(id);
      setShowForm(true);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateBlogPost(editingId, form);
      } else {
        await createBlogPost({ 
          ...form, 
          published_at: new Date().toISOString().split('T')[0] 
        });
      }
      resetForm();
      await load();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Delete Blog Post?',
      message: 'Are you sure you want to delete this blog post? This will permanently remove the content. This action cannot be undone.',
      type: 'danger',
      confirmText: 'Yes, Delete',
      cancelText: 'Keep Post'
    });

    if (!isConfirmed) return;

    try { 
      await deleteBlogPost(id); 
      await load(); 
    } catch (err) { console.error(err); }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      await toggleBlogFeatured(id);
      await load();
    } catch (err) { console.error(err); }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return {
    posts,
    loading,
    search,
    page,
    perPage,
    sortBy,
    sortDir,
    showForm,
    editingId,
    form,
    saving,
    setForm,
    setShowForm,
    handleSort,
    handleEdit,
    handleSave,
    handleDelete,
    handleToggleFeatured,
    handleSearchChange,
    resetForm,
    setPage,
    setPerPage,
    refresh: load
  };
}
