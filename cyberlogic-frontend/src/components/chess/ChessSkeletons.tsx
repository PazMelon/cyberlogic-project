import { Swords } from 'lucide-react';

/**
 * Base shimmer pulse component
 */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-[var(--cl-surface-800)] via-[var(--cl-surface-700)]/50 to-[var(--cl-surface-800)] animate-pulse rounded-xl ${className}`}
    />
  );
}

/**
 * Skeleton loader for match room cards (2-column grid)
 */
export function MatchRoomsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[var(--cl-surface-950)]/60 border border-[var(--cl-border)]/60 rounded-2xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-5 w-24 rounded-full" />
            <SkeletonBlock className="h-4 w-16 rounded-md" />
          </div>

          <div className="flex items-center justify-between gap-4 py-2 border-y border-[var(--cl-border)]/40">
            <div className="flex items-center gap-2.5">
              <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-2.5 w-16" />
              </div>
            </div>
            <div className="text-center font-bold text-xs text-[var(--cl-text-muted)]">VS</div>
            <div className="flex items-center gap-2.5 flex-row-reverse">
              <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5 text-right">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-2.5 w-16" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <SkeletonBlock className="h-4 w-28 rounded-lg" />
            <SkeletonBlock className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for full Chess Game Room page (/app/chess/game/:gameCode)
 */
export function ChessGameRoomSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)] p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header Bar Skeleton */}
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-24 h-9 rounded-xl" />
          <div className="space-y-2">
            <div className="flex gap-2">
              <SkeletonBlock className="h-4 w-20 rounded-full" />
              <SkeletonBlock className="h-4 w-16 rounded-md" />
            </div>
            <SkeletonBlock className="h-6 w-44 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Main Game Layout Skeleton (Chessboard + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Board + Player Bars */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Player Card */}
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)]/60 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
            </div>
            <SkeletonBlock className="h-8 w-20 rounded-xl" />
          </div>

          {/* 8x8 Chessboard Skeleton */}
          <div className="aspect-square max-w-[600px] mx-auto bg-[var(--cl-surface-900)] border-4 border-[var(--cl-surface-800)] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-8 grid-rows-8 relative">
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isDark = (row + col) % 2 === 1;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-center ${
                    isDark ? 'bg-[var(--cl-surface-800)]/80' : 'bg-[var(--cl-surface-900)]'
                  }`}
                >
                  {/* Subtle placeholder icon in center squares */}
                  {i === 27 || i === 28 || i === 35 || i === 36 ? (
                    <Swords className="w-6 h-6 text-[var(--cl-primary)]/20 animate-pulse" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Bottom Player Card */}
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)]/60 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
            </div>
            <SkeletonBlock className="h-8 w-20 rounded-xl" />
          </div>
        </div>

        {/* Right Column: Move History & Chat Sidebar */}
        <div className="lg:col-span-4 bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl space-y-4 min-h-[500px] flex flex-col">
          <div className="flex gap-2 border-b border-[var(--cl-border)]/60 pb-3">
            <SkeletonBlock className="h-8 flex-1 rounded-xl" />
            <SkeletonBlock className="h-8 flex-1 rounded-xl" />
          </div>
          <div className="space-y-3 flex-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <SkeletonBlock className="h-4 w-12" />
                <SkeletonBlock className="h-6 flex-1 rounded-lg" />
                <SkeletonBlock className="h-6 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="h-10 w-full rounded-xl mt-auto" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for Leaderboard table rows
 */
export function LeaderboardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[var(--cl-surface-950)]/50 border border-[var(--cl-border)]/60 rounded-xl p-3.5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-6 h-6 rounded-lg" />
            <SkeletonBlock className="w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-6 w-20 rounded-lg" />
            <SkeletonBlock className="h-6 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
