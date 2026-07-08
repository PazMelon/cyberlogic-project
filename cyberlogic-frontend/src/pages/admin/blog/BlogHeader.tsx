
import { Link } from "react-router";
import { ArrowLeft, FileText } from "lucide-react";

interface BlogHeaderProps {
  title: string;
  description: string;
  backTo?: string;
}

export function BlogHeader({ title, description, backTo = "/admin/blogs" }: BlogHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Link
        to={backTo}
        className="p-2 rounded-xl bg-surface-800 border border-border/80 text-text-muted hover:text-text-primary transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> {title}
        </h1>
        <p className="text-sm text-text-muted mt-1">{description}</p>
      </div>
    </div>
  );
}
