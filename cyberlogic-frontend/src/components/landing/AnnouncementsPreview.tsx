import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ChevronRight, Rocket } from "lucide-react";
import { fetchAnnouncements } from "../../utils/api";
import type { Announcement } from "../../data/mockData";
import { SkeletonCard } from "../Skeleton";
import { AnnouncementCard } from "../ui";

export function AnnouncementsPreview({ isLoading }: { isLoading: boolean }) {
  const [latest, setLatest] = useState<Announcement[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAnnouncements();
        setLatest(data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load landing announcements:", err);
      } finally {
        setLocalLoading(false);
      }
    }
    load();
  }, []);

  const activeLoading = isLoading || localLoading;

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Stay Updated
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Latest Announcements
            </h2>
          </div>
          <Link
            to="/announcements"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : latest.length > 0 ? (
            latest.map((item, idx) => (
              <AnnouncementCard key={item.id} announcement={item} index={idx} />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 glass rounded-2xl p-8 border border-border/80 bg-surface-900/20 text-center space-y-4 max-w-lg mx-auto animate-fadeIn relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20 animate-pulse-glow">
                  <Rocket className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)]">No Broadcasts Found</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    All communication systems nominal. No announcements have been published yet. Check back soon for fresh updates!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile "View All" */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/announcements"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            View all announcements <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
