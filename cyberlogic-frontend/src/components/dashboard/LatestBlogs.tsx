import { Link } from "react-router";
import { BookOpen } from "lucide-react";
import type { BlogPost } from "../../utils/api";

interface LatestBlogsProps {
  blogs: BlogPost[];
  isLoading: boolean;
}

export default function LatestBlogs({ blogs, isLoading }: LatestBlogsProps) {
  return (
    <div className="glass rounded-2xl p-5 border border-border flex flex-col h-[340px]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          Latest Blogs
        </h2>
        <Link to="/app/blogs" className="text-xs font-semibold text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin">
        {isLoading ? (
          <div className="flex-1 h-full flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-xs text-text-muted italic py-6 text-center">No published blog posts found.</p>
        ) : (
          blogs.map((blog) => (
            <Link
              key={blog.id}
              to={`/app/blogs/${blog.id}`}
              className="block p-3 rounded-xl hover:bg-white/5 border border-border/30 hover:border-border transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] font-bold text-accent uppercase tracking-wide">{blog.category}</span>
                <span className="text-[9px] text-text-muted">
                  {new Date(blog.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
              <h3 className="text-xs font-bold text-text-primary line-clamp-1 hover:text-primary transition-colors">
                {blog.title}
              </h3>
              <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">{blog.excerpt}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
