import { useState, useEffect } from "react";
import {
  MessageSquare,
  MessagesSquare,
  Users,
  Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchAnnouncements,
  fetchEvents,
  fetchForumCategories,
  fetchForumThreads,
  fetchDashboardStats
} from "../utils/api";
import type {
  ForumCategoryMapped,
  ForumThreadMapped,
  DashboardStats
} from "../utils/api";
import type { Announcement, Event } from "../data/mockData";
import { SkeletonLine, SkeletonBox } from "../components/Skeleton";
import { EventCard, AnnouncementCard } from "../components/ui";
import { WelcomeBanner } from "../components/dashboard/WelcomeBanner";
import { StatCard } from "../components/dashboard/StatCard";
import { DashboardCard } from "../components/dashboard/DashboardCard";
import { ReputationLeaderboard } from "../components/dashboard/ReputationLeaderboard";
import { ForumsActivityHub } from "../components/dashboard/ForumsActivityHub";
import { CategoryNewestCard } from "../components/dashboard/CategoryNewestCard";

export default function Home() {
  const { user } = useAuth();
  const isRegularMember = user?.role === "member";
  const [isLoading, setIsLoading] = useState(true);
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [totalUpcomingCount, setTotalUpcomingCount] = useState(0);
  const [nextEventDateStr, setNextEventDateStr] = useState("None scheduled");
  const [categories, setCategories] = useState<ForumCategoryMapped[]>([]);
  const [threads, setThreads] = useState<ForumThreadMapped[]>([]);
  const [dbStats, setDbStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [annData, evData, catsData, threadsData, statsData] = await Promise.all([
          fetchAnnouncements(),
          fetchEvents(),
          fetchForumCategories(),
          fetchForumThreads(),
          fetchDashboardStats()
        ]);
        setCategories(catsData);
        setThreads(threadsData);
        setDbStats(statsData);

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

  const quickStats = [
    { icon: MessagesSquare, label: "Forum Threads", value: dbStats ? String(dbStats.forum_threads) : "0", change: "Total threads", color: "primary" },
    { icon: MessageSquare, label: "Chat Messages", value: dbStats ? String(dbStats.chat_messages_today) : "0", change: "Sent today", color: "accent" },
    { icon: Users, label: "Active Members", value: dbStats ? String(dbStats.active_members) : "0", change: "Approved members", color: "success" },
    { icon: Calendar, label: "Upcoming Events", value: totalUpcomingCount.toString(), change: nextEventDateStr, color: "warning" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Column (2/3 width): Welcome, Stats, Forum Hub & Category Newest Threads */}
      <div className="lg:col-span-2 space-y-6">
        <WelcomeBanner name={user?.name || "Member"} totalUpcomingCount={totalUpcomingCount} />

        {/* Quick Stats Grid - Hidden for regular members */}
        {!isRegularMember && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-4 space-y-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-surface-800" />
                    <div className="w-8 h-3 rounded bg-surface-800" />
                  </div>
                  <div className="w-1/2 h-7 rounded bg-surface-800" />
                  <div className="w-3/4 h-3 rounded bg-surface-800" />
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
        )}

        {/* Forums Activity Hub (Top Engaged) */}
        {isLoading ? (
          <div className="glass rounded-2xl p-5 h-[390px] animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <ForumsActivityHub />
        )}

        {/* Newest Threads Category Cards Stacked Vertically */}
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-[280px] animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ))
        ) : (
          categories.map((cat) => (
            <CategoryNewestCard key={cat.id} category={cat} threads={threads} />
          ))
        )}
      </div>

      {/* Right Column (1/3 width): sidebar with Events (non-sticky), Announcements (sticky), and Leaderboard (sticky) */}
      <div className="space-y-6 self-stretch">
        {/* Upcoming Events */}
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

        {/* Sticky Sidebar Container for Announcements and Leaderboard */}
        <div className="sticky top-0 space-y-6 flex flex-col lg:h-[calc(100vh-6rem)]">
          {/* Latest Announcements */}
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

          {/* Reputation Leaderboard */}
          {isLoading ? (
            <div className="glass rounded-2xl p-5 flex-1 min-h-[300px] animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <ReputationLeaderboard className="flex-1 min-h-[300px]" />
          )}
        </div>
      </div>
    </div>
  );
}
