import { Link } from "react-router";
import { FileText, Download } from "lucide-react";
import type { ResourceMapped } from "../../utils/api";

interface LatestResourcesProps {
  resources: ResourceMapped[];
  isLoading: boolean;
}

export default function LatestResources({ resources, isLoading }: LatestResourcesProps) {
  return (
    <div className="glass rounded-2xl p-5 border border-border flex flex-col h-[340px]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-success" />
          Latest Resources
        </h2>
        <Link to="/app/resources" className="text-xs font-semibold text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin">
        {isLoading ? (
          <div className="flex-1 h-full flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <p className="text-xs text-text-muted italic py-6 text-center">No approved resource items found.</p>
        ) : (
          resources.map((resource) => (
            <Link
              key={resource.id}
              to={`/app/resources/${resource.id}`}
              className="block p-3 rounded-xl hover:bg-white/5 border border-border/30 hover:border-border transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] font-bold text-success uppercase tracking-wide">{resource.category}</span>
                <span className="text-[9px] text-text-muted flex items-center gap-1">
                  <Download className="w-2.5 h-2.5" /> {resource.downloadCount}
                </span>
              </div>
              <h3 className="text-xs font-bold text-text-primary line-clamp-1 hover:text-primary transition-colors">
                {resource.title}
              </h3>
              <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">{resource.description}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
