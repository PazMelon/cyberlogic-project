
interface SkeletonProps {
  className?: string;
}

export function SkeletonCircle({ className = "w-10 h-10" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-surface-800/60 rounded-full border border-border/10 ${className}`} />
  );
}

interface SkeletonLineProps extends SkeletonProps {
  widthClass?: string;
  heightClass?: string;
}

export function SkeletonLine({
  className = "",
  widthClass = "w-full",
  heightClass = "h-4"
}: SkeletonLineProps) {
  return (
    <div
      className={`animate-pulse bg-surface-800/60 rounded-lg border border-border/10 ${heightClass} ${widthClass} ${className}`}
    />
  );
}

export function SkeletonBox({ className = "w-full h-32" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-surface-800/50 rounded-xl border border-border/15 shadow-inner ${className}`} />
  );
}

/**
 * Shimmer Card with glassmorphic style
 */
export function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5 space-y-4 border border-border/20 relative overflow-hidden animate-pulse">
      <div className="flex items-center gap-3">
        <SkeletonCircle className="w-10 h-10 bg-surface-800/80" />
        <div className="space-y-2 flex-1">
          <SkeletonLine widthClass="w-1/3" heightClass="h-4" />
          <SkeletonLine widthClass="w-1/4" heightClass="h-3" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <SkeletonLine widthClass="w-full" heightClass="h-3" />
        <SkeletonLine widthClass="w-5/6" heightClass="h-3" />
        <SkeletonLine widthClass="w-2/3" heightClass="h-3" />
      </div>
    </div>
  );
}
