import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Calendar, ChevronRight } from "lucide-react";
import { fetchEvents } from "../../utils/api";
import type { Event } from "../../data/mockData";
import { SkeletonBox, SkeletonLine } from "../Skeleton";
import { EventCard } from "../ui";

export function UpcomingEvents({ isLoading }: { isLoading: boolean }) {
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchEvents();
        const sorted = [...data].sort((a, b) => b.id - a.id);
        setUpcoming(sorted.slice(0, 4));
      } catch (err) {
        console.error("Failed to load landing events:", err);
      } finally {
        setLocalLoading(false);
      }
    }
    load();
  }, []);

  const activeLoading = isLoading || localLoading;

  return (
    <section className="py-20 lg:py-28 bg-surface-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              Don&apos;t Miss Out
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Upcoming Events
            </h2>
          </div>
          <Link
            to="/events"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-light transition-colors"
          >
            All events <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-2xl p-6 flex gap-5 animate-pulse">
                  <SkeletonBox className="w-16 h-16 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLine widthClass="w-1/4" heightClass="h-4" />
                    <SkeletonLine widthClass="w-3/4" heightClass="h-5" />
                    <SkeletonLine widthClass="w-full" heightClass="h-4" />
                  </div>
                </div>
              ))}
            </>
          ) : upcoming.length > 0 ? (
            upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 glass rounded-2xl p-8 border border-border/80 bg-surface-900/20 text-center space-y-4 max-w-lg mx-auto animate-fadeIn relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-50" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto border border-accent/20 animate-pulse-glow">
                  <Calendar className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)]">Upcoming Events Offline</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    We are currently organizing our upcoming workshops, seminars, and hands-on activities. Stay tuned for future announcements!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
