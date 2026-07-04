import { Link } from "react-router";
import {
  MessageSquare,
  MessagesSquare,
  Users,
  Calendar,
  Megaphone,
  ArrowRight,
  Clock,
  Eye,
  Heart,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { announcements, events, forumThreads } from "../data/mockData";

export default function Home() {
  const { user } = useAuth();
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
        {quickStats.map((stat) => (
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
        ))}
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
            {recentThreads.map((thread) => (
              <Link
                key={thread.id}
                to={`/app/forums/thread/${thread.id}`}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <img
                  src={thread.authorAvatar}
                  alt={thread.author}
                  className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate">
                    {thread.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {thread.author} · {thread.lastActivity}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted flex-shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {thread.replyCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {thread.likes}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {thread.views}
                  </span>
                </div>
              </Link>
            ))}
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
              {upcomingEvents.map((event) => {
                const d = new Date(event.date);
                return (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold uppercase text-accent leading-none">
                        {d.toLocaleString("default", { month: "short" })}
                      </span>
                      <span className="text-sm font-bold text-text-primary leading-none">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-text-primary truncate">{event.title}</h3>
                      <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {event.time}
                      </p>
                    </div>
                  </div>
                );
              })}
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
              {latestAnnouncements.map((a) => (
                <div key={a.id} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="w-3 h-3 text-primary" />
                    <h3 className="text-sm font-medium text-text-primary truncate flex-1">{a.title}</h3>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1 ml-5">{a.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
