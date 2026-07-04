import { User, Calendar, Clock, Star, FileText } from 'lucide-react';
import type { AdminBlogPost } from '../../../types/admin.types';
import { getImageUrl } from '../../../../utils/imageUrl';

interface BlogDetailViewProps {
  post: AdminBlogPost;
}

export function BlogDetailView({ post }: BlogDetailViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cover Image */}
      <div className="relative group">
        <div className="w-full h-48 rounded-2xl overflow-hidden shadow-lg border-b border-border/20 bg-subtle">
          <img 
            src={getImageUrl(post.image)!} 
            alt={post.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        </div>
        {post.featured && (
          <div className="absolute top-4 right-4 bg-brand text-white px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
            <Star size={12} className="fill-white" /> Featured
          </div>
        )}
      </div>

      {/* Header Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-brand-light text-brand text-[9px] font-black uppercase rounded tracking-widest border border-brand/10">
            {post.category}
          </span>
          <span className="text-muted text-[10px]">•</span>
          <div className="flex items-center gap-1 text-muted text-[10px] font-bold">
            <Clock size={12} /> {post.readTime}
          </div>
        </div>
        <h3 className="text-xl font-black text-charcoal leading-tight tracking-tight">
          {post.title}
        </h3>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-subtle/30 rounded-xl p-3 border border-border/50">
          <div className="flex items-center gap-2 mb-1.5 opacity-60">
            <User size={12} className="text-muted" />
            <span className="text-[9px] font-black uppercase tracking-wider">Author</span>
          </div>
          <p className="text-xs font-bold text-charcoal">{post.author}</p>
        </div>
        <div className="bg-subtle/30 rounded-xl p-3 border border-border/50">
          <div className="flex items-center gap-2 mb-1.5 opacity-60">
            <Calendar size={12} className="text-muted" />
            <span className="text-[9px] font-black uppercase tracking-wider">Published</span>
          </div>
          <p className="text-xs font-bold text-charcoal">{post.publishedAt}</p>
        </div>
      </div>

      {/* Excerpt */}
      <div className="bg-white rounded-xl p-4 border border-border/50 shadow-sm">
        <div className="flex items-center gap-2 mb-2 opacity-60">
          <FileText size={14} className="text-muted" />
          <span className="text-[10px] font-black uppercase tracking-wider">Excerpt Preview</span>
        </div>
        <p className="text-sm font-medium text-charcoal leading-relaxed">
          {post.excerpt}
        </p>
      </div>

      <p className="text-[10px] text-muted text-center font-medium italic mt-8 px-4">
        Click the "Edit" button in the table to modify the full content of this post.
      </p>
    </div>
  );
}
