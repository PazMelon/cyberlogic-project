
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

export function SkeletonAnnouncementCard() {
  return (
    <div className="glass rounded-2xl p-6 flex flex-col justify-between h-full border border-border/20 animate-pulse min-h-[220px]">
      <div>
        <div className="flex gap-2 mb-4">
          <SkeletonLine widthClass="w-16" heightClass="h-5" />
        </div>
        <div className="space-y-2">
          <SkeletonLine widthClass="w-3/4" heightClass="h-6" />
          <SkeletonLine widthClass="w-full" heightClass="h-4" />
          <SkeletonLine widthClass="w-5/6" heightClass="h-4" />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border/40">
        <SkeletonCircle className="w-8 h-8" />
        <div className="space-y-1.5 flex-1">
          <SkeletonLine widthClass="w-1/4" heightClass="h-3" />
          <SkeletonLine widthClass="w-1/6" heightClass="h-2.5" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonBlogCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-border/20 flex flex-col justify-between h-full animate-pulse">
      <div>
        {/* Cover image area */}
        <SkeletonBox className="aspect-[16/9] w-full rounded-none" />
        <div className="p-5 space-y-4">
          <SkeletonLine widthClass="w-16" heightClass="h-5" />
          <div className="space-y-2">
            <SkeletonLine widthClass="w-3/4" heightClass="h-5" />
            <SkeletonLine widthClass="w-full" heightClass="h-3.5" />
            <SkeletonLine widthClass="w-5/6" heightClass="h-3.5" />
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-3 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonCircle className="w-6 h-6" />
          <SkeletonLine widthClass="w-16" heightClass="h-3" />
        </div>
        <SkeletonLine widthClass="w-12" heightClass="h-2.5" />
      </div>
    </div>
  );
}

export function SkeletonEventCard() {
  return (
    <div className="glass rounded-2xl p-6 flex gap-5 animate-pulse border border-border/20">
      {/* Date badge placeholder */}
      <SkeletonBox className="w-16 h-16 rounded-xl flex-shrink-0" />
      {/* Content */}
      <div className="flex-1 space-y-3 min-w-0">
        <SkeletonLine widthClass="w-16" heightClass="h-5" />
        <SkeletonLine widthClass="w-2/3" heightClass="h-5" />
        <SkeletonLine widthClass="w-full" heightClass="h-3.5" />
        <div className="flex gap-4 pt-1">
          <SkeletonLine widthClass="w-16" heightClass="h-3" />
          <SkeletonLine widthClass="w-16" heightClass="h-3" />
          <SkeletonLine widthClass="w-12" heightClass="h-3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonResourceCard() {
  return (
    <div className="glass rounded-2xl p-5 border border-border/20 flex flex-col justify-between h-full animate-pulse min-h-[200px]">
      <div className="space-y-4">
        <SkeletonBox className="w-10 h-10 rounded-lg animate-pulse" />
        <SkeletonLine widthClass="w-12" heightClass="h-3" />
        <div className="space-y-2">
          <SkeletonLine widthClass="w-2/3" heightClass="h-5" />
          <SkeletonLine widthClass="w-full" heightClass="h-3.5" />
          <SkeletonLine widthClass="w-5/6" heightClass="h-3.5" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-4">
        <SkeletonLine widthClass="w-8" heightClass="h-3.5" />
        <SkeletonLine widthClass="w-10" heightClass="h-3.5" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="glass rounded-xl p-4 flex flex-col justify-between border border-border/40 animate-pulse space-y-3">
      <SkeletonLine widthClass="w-24" heightClass="h-3" />
      <SkeletonLine widthClass="w-28" heightClass="h-7" />
      <SkeletonLine widthClass="w-32" heightClass="h-2.5" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse border-b border-border/40">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-5 py-4">
          <SkeletonLine
            widthClass={idx === 0 ? "w-8" : idx === 1 ? "w-32" : idx === 2 ? "w-3/4" : idx === 3 ? "w-24" : "w-16"}
            heightClass="h-4"
          />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass rounded-xl overflow-hidden shadow-lg border border-border/80 animate-pulse">
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <SkeletonLine widthClass="w-48" heightClass="h-8" />
        <SkeletonLine widthClass="w-24" heightClass="h-8" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-950/30">
              {Array.from({ length: columns }).map((_, idx) => (
                <th key={idx} className="px-5 py-3.5 text-left">
                  <SkeletonLine widthClass="w-20" heightClass="h-3" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <SkeletonTableRow key={rIdx} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


