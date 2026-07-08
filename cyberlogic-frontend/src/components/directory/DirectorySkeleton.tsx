import { SkeletonCircle, SkeletonLine } from "../Skeleton";

export function DirectorySkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass rounded-2xl p-5 space-y-4 animate-pulse">
          <div className="flex items-center gap-4">
            <SkeletonCircle className="w-14 h-14 bg-surface-800" />
            <div className="space-y-2 flex-1">
              <SkeletonLine widthClass="w-3/4" heightClass="h-4.5" />
              <SkeletonLine widthClass="w-1/2" heightClass="h-3" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <SkeletonLine widthClass="w-full" heightClass="h-3.5" />
            <div className="flex gap-2">
              <SkeletonLine widthClass="w-12" heightClass="h-4" />
              <SkeletonLine widthClass="w-14" heightClass="h-4" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
