import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  MessageSquare,
  MessagesSquare,
  Users,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { announcements, events, forumThreads } from "../data/mockData";
import { SkeletonBox, SkeletonLine, SkeletonCircle } from "../components/Skeleton";
import { ForumThreadCard, EventCard, AnnouncementCard } from "../components/ui";

export default function Home() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const latestAnnouncements = announcements.slice(0, 3);
  const upcomingEvents = events.slice(0, 3);
  const recentThreads = forumThreads.slice(0, 4);

  const quickStats = [
    { icon: MessagesSquare, label: "Forum Threads", value: "118", change: "+12 this week", color: "primary" },
    { icon: MessageSquare, label: "Chat Messages", value: "1.2k", change: "+89 today", color: "accent" },
    { icon: Users, label: "Active Members", value: "94", change: "62% online", color: "success" },
    { icon: Calendar, label: "Upcoming Events", value: "5", change: "Next: Jul 10", color: "warning" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-border p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-2">
            Welcome back, <span className="text-gradient">{user?.name || "Member"}</span>!
          </h1>
          <p className="text-sm text-text-muted max-w-lg">
            Stay updated with the latest from Cyberlogic. You have{" "}
            <span className="text-primary font-medium">3 unread messages</span> and{" "}
            <span className="text-accent font-medium">2 upcoming events</span> this week.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-xl p-4 space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <SkeletonCircle className="w-10 h-10 bg-surface-800" />
                  <SkeletonLine widthClass="w-8" heightClass="h-3" />
                </div>
                <SkeletonLine widthClass="w-1/2" heightClass="h-7" />
                <SkeletonLine widthClass="w-3/4" heightClass="h-3" />
              </div>
            ))}
          </>
        ) : (
          quickStats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl p-4 hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-success opacity-60" />
              </div>
              <div className="text-2xl font-bold text-text-primary font-[family-name:var(--font-heading)]">
                {stat.value}
              </div>
              <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
              <div className="text-[10px] text-text-muted mt-1 opacity-70">{stat.change}</div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Forum Activity — 2 columns */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)]">
              Recent Forum Activity
            </h2>
            <Link
              to="/app/forums"
              className="text-xs font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl animate-pulse">
                    <SkeletonCircle className="w-9 h-9 bg-surface-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine widthClass="w-3/4" heightClass="h-4" />
                      <SkeletonLine widthClass="w-1/3" heightClass="h-3" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              recentThreads.map((thread) => (
              <ForumThreadCard key={thread.id} thread={thread} mode="compact" />
            ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)]">
                Upcoming Events
              </h2>
              <Link
                to="/app/events"
                className="text-xs font-medium text-accent hover:text-accent-light transition-colors flex items-center gap-1"
              >
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg animate-pulse">
                      <SkeletonBox className="w-11 h-11 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <SkeletonLine widthClass="w-3/4" heightClass="h-4" />
                        <SkeletonLine widthClass="w-1/2" heightClass="h-3" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} layout="compact" />
                ))
              )}
            </div>
          </div>

          {/* Latest Announcements */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)]">
                Announcements
              </h2>
              <Link
                to="/app/announcements"
                className="text-xs font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-1"
              >
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-2 space-y-2 animate-pulse">
                      <SkeletonLine widthClass="w-3/4" heightClass="h-4" />
                      <SkeletonLine widthClass="w-5/6" heightClass="h-3" />
                    </div>
                  ))}
                </>
              ) : (
                latestAnnouncements.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} layout="compact" />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
