import { useState, useEffect } from "react";
import {
  MessageSquare,
  MessagesSquare,
  Users,
  Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forumThreads } from "../data/mockData";
import { fetchAnnouncements, fetchEvents } from "../utils/api";
import type { Announcement, Event } from "../data/mockData";
import { SkeletonBox, SkeletonLine, SkeletonCircle } from "../components/Skeleton";
import { ForumThreadCard, EventCard, AnnouncementCard } from "../components/ui";
import { WelcomeBanner } from "../components/dashboard/WelcomeBanner";
import { StatCard } from "../components/dashboard/StatCard";
import { DashboardCard } from "../components/dashboard/DashboardCard";

export default function Home() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [totalUpcomingCount, setTotalUpcomingCount] = useState(0);
  const [nextEventDateStr, setNextEventDateStr] = useState("None scheduled");

  useEffect(() => {
    async function loadData() {
      try {
        const [annData, evData] = await Promise.all([
          fetchAnnouncements(),
          fetchEvents()
        ]);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const upcoming = evData.filter((e) => e.date >= todayStr);
        const sortedUpcoming = [...upcoming].sort((a, b) => a.date.localeCompare(b.date));
        
        setLatestAnnouncements(annData.slice(0, 2));
        setUpcomingEvents(sortedUpcoming.slice(0, 1));
        setTotalUpcomingCount(upcoming.length);

        if (sortedUpcoming.length > 0) {
          const nextDate = new Date(sortedUpcoming[0].date);
          const formattedDate = nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          setNextEventDateStr(`Next: ${formattedDate}`);
        } else {
          setNextEventDateStr("No events scheduled");
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const recentThreads = forumThreads.slice(0, 4);

  const quickStats = [
    { icon: MessagesSquare, label: "Forum Threads", value: "118", change: "+12 this week", color: "primary" },
    { icon: MessageSquare, label: "Chat Messages", value: "1.2k", change: "+89 today", color: "accent" },
    { icon: Users, label: "Active Members", value: "94", change: "62% online", color: "success" },
    { icon: Calendar, label: "Upcoming Events", value: totalUpcomingCount.toString(), change: nextEventDateStr, color: "warning" },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner name={user?.name || "Member"} totalUpcomingCount={totalUpcomingCount} />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <SkeletonCircle className="w-10 h-10 bg-surface-800" />
                <SkeletonLine widthClass="w-8" heightClass="h-3" />
              </div>
              <SkeletonLine widthClass="w-1/2" heightClass="h-7" />
              <SkeletonLine widthClass="w-3/4" heightClass="h-3" />
            </div>
          ))
        ) : (
          quickStats.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              color={stat.color}
            />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Forum Activity - 2 columns */}
        <div className="lg:col-span-2">
          <DashboardCard
            title="Recent Forum Activity"
            viewAllPath="/app/forums"
            isLoading={isLoading}
            className="h-full"
            skeletonCount={4}
            renderSkeleton={() => (
              <div className="flex items-start gap-3 p-3 rounded-xl animate-pulse">
                <SkeletonCircle className="w-9 h-9 bg-surface-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine widthClass="w-3/4" heightClass="h-4" />
                  <SkeletonLine widthClass="w-1/3" heightClass="h-3" />
                </div>
              </div>
            )}
            isEmpty={recentThreads.length === 0}
            renderEmpty={() => (
              <div className="text-center py-6 px-4">
                <p className="text-xs text-text-muted font-medium">No recent forum activity found.</p>
              </div>
            )}
          >
            {recentThreads.map((thread) => (
              <ForumThreadCard key={thread.id} thread={thread} mode="compact" />
            ))}
          </DashboardCard>
        </div>

        {/* Right Column: Events and Announcements */}
        <div className="space-y-6">
          <DashboardCard
            title="Upcoming Events"
            viewAllPath="/app/events"
            viewAllLabel="All"
            accentColor="accent"
            isLoading={isLoading}
            skeletonCount={1}
            renderSkeleton={() => (
              <div className="flex items-start gap-3 p-2 rounded-lg animate-pulse">
                <SkeletonBox className="w-11 h-11 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine widthClass="w-3/4" heightClass="h-4" />
                  <SkeletonLine widthClass="w-1/2" heightClass="h-3" />
                </div>
              </div>
            )}
            isEmpty={upcomingEvents.length === 0}
            renderEmpty={() => (
              <div className="text-center py-6 px-4 rounded-xl border border-border/40 bg-surface-900/10 animate-fadeIn">
                <Calendar className="w-8 h-8 text-text-muted/50 mx-auto mb-2" />
                <p className="text-xs text-text-muted font-medium">No upcoming events scheduled.</p>
                <p className="text-[10px] text-text-muted/70 mt-0.5">Check back later for workshops & bootcamps!</p>
              </div>
            )}
          >
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} layout="compact" />
            ))}
          </DashboardCard>

          <DashboardCard
            title="Announcements"
            viewAllPath="/app/announcements"
            viewAllLabel="All"
            isLoading={isLoading}
            skeletonCount={2}
            renderSkeleton={() => (
              <div className="p-2 space-y-2 animate-pulse">
                <SkeletonLine widthClass="w-3/4" heightClass="h-4" />
                <SkeletonLine widthClass="w-5/6" heightClass="h-3" />
              </div>
            )}
            isEmpty={latestAnnouncements.length === 0}
            renderEmpty={() => (
              <div className="text-center py-6 px-4">
                <p className="text-xs text-text-muted font-medium">No announcements found.</p>
              </div>
            )}
          >
            {latestAnnouncements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} layout="compact" />
            ))}
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
