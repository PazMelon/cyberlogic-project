import { Plus, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type Column } from '../../../components/ui/DataTable';
import type { AdminBlogPost } from '../../types/admin.types';
import { useBlogManagement } from './hooks/useBlogManagement';
import { BlogDetailView } from './components/BlogDetailView';

export default function BlogManagementPage() {
  const navigate = useNavigate();
  const {
    posts,
    loading,
    search,
    perPage,
    sortBy,
    sortDir,
    handleSort,
    handleDelete,
    handleToggleFeatured,
    handleSearchChange,
    setPage,
    setPerPage
  } = useBlogManagement();

  const columns: Column<AdminBlogPost>[] = [
    {
      key: 'title', label: 'Post', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-charcoal truncate max-w-[200px] lg:max-w-[300px]">{p.title}</p>
            <p className="text-[11px] text-muted truncate max-w-[200px]">{p.readTime}</p>
          </div>
        </div>
      )
    },
    {
      key: 'category', label: 'Category', sortable: true, className: 'hidden md:table-cell',
      render: (p) => <span className="text-[10px] font-bold bg-subtle px-2.5 py-1 rounded-full text-muted">{p.category}</span>
    },
    { key: 'author', label: 'Author', sortable: true, className: 'hidden lg:table-cell', render: (p) => <span className="text-sm text-muted">{p.author}</span> },
    { key: 'published_at', label: 'Published', sortable: true, className: 'hidden lg:table-cell', render: (p) => <span className="text-sm text-muted">{p.publishedAt}</span> },
    {
      key: 'featured', label: 'Featured', sortable: true,
      render: (p) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleFeatured(p.id); }}
          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full cursor-pointer transition-colors ${p.featured ? 'bg-brand text-white shadow-sm' : 'bg-subtle text-muted hover:bg-brand/10 hover:text-brand'}`}
        >
          {p.featured ? '★ Featured' : 'Feature'}
        </button>
      )
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/blog/${p.id}/edit`); }} 
            className="px-2.5 py-1 text-[10px] font-bold text-brand hover:bg-brand/5 rounded-lg cursor-pointer"
          >
            Edit
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} 
            className="p-1.5 text-muted hover:text-crimson hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Blog Management</h1>
          <p className="text-sm font-medium text-muted mt-1">{posts.total} published articles</p>
        </div>
        <button onClick={() => navigate('/admin/blog/new')} className="btn-primary flex items-center gap-2 text-sm shadow-sm hover:shadow-md transition-shadow">
          <Plus size={16} /> New Post
        </button>
      </div>

      <DataTable
        columns={columns}
        data={posts.data}
        loading={loading}
        currentPage={posts.current_page}
        totalItems={posts.total}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(limit) => { setPerPage(limit); setPage(1); }}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search post titles..."
        emptyIcon={<FileText size={40} />}
        emptyMessage="No articles found"
        renderDetails={(post) => <BlogDetailView post={post} />}
        renderDetailsActions={(post) => (
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate(`/admin/blog/${post.id}/edit`)}
              className="w-full py-3.5 rounded-2xl bg-charcoal text-white font-bold text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-charcoal/20 hover:bg-charcoal/90 transition-all cursor-pointer"
            >
              <FileText size={18} /> Edit Full Post
            </button>
            <button 
              onClick={() => handleDelete(post.id)}
              className="w-full py-3 rounded-2xl font-bold text-xs text-crimson hover:bg-red-50 transition-colors flex items-center justify-center gap-2 mt-1 opacity-60 hover:opacity-100 cursor-pointer"
            >
              <Trash2 size={14} /> Delete Article
            </button>
          </div>
        )}
      />
    </div>
  );
}

