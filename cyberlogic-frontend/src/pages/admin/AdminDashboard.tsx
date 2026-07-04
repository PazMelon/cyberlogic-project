import { Link } from "react-router";
import {
  Users,
  Megaphone,
  Calendar,
  BookOpen,
  MessagesSquare,
  UserPlus,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Pin,
} from "lucide-react";
import {
  pendingMembers,
  recentAdminActivity,
} from "../../data/mockData";

const statCards = [
  { icon: Users, label: "Total Members", value: "150", change: "+8 this month", color: "amber" },
  { icon: UserPlus, label: "Pending Approvals", value: "3", change: "Needs attention", color: "error" },
  { icon: MessagesSquare, label: "Active Threads", value: "118", change: "+12 this week", color: "primary" },
  { icon: Calendar, label: "Upcoming Events", value: "5", change: "Next: Jul 10", color: "accent" },
];

const activityIcons: Record<string, typeof Users> = {
  member_joined: UserPlus,
  announcement_created: Megaphone,
  event_created: Calendar,
  thread_pinned: Pin,
  member_approved: CheckCircle,
  resource_added: FileText,
};

const activityColors: Record<string, string> = {
  member_joined: "text-success bg-success/10",
  announcement_created: "text-primary bg-primary/10",
  event_created: "text-accent bg-accent/10",
  thread_pinned: "text-warning bg-warning/10",
  member_approved: "text-success bg-success/10",
  resource_added: "text-info bg-info/10",
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
          Admin Dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Overview of club activity and management tools.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 hover:border-amber-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === "amber" ? "bg-amber-500/10" :
                stat.color === "error" ? "bg-error/10" :
                stat.color === "primary" ? "bg-primary/10" :
                "bg-accent/10"
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === "amber" ? "text-amber-400" :
                  stat.color === "error" ? "text-error" :
                  stat.color === "primary" ? "text-primary" :
                  "text-accent"
                }`} />
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/announcements"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:-translate-y-0.5"
        >
          <Megaphone className="w-4 h-4" /> Create Announcement
        </Link>
        <Link
          to="/admin/events"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm font-medium hover:border-amber-500/30 transition-all"
        >
          <Calendar className="w-4 h-4" /> Create Event
        </Link>
        <Link
          to="/admin/resources"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm font-medium hover:border-amber-500/30 transition-all"
        >
          <BookOpen className="w-4 h-4" /> Add Resource
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)]">
              Pending Approvals
            </h2>
            <Link
              to="/admin/members"
              className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                  <p className="text-xs text-text-muted">{member.department}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-success/10 text-success hover:bg-success/20 flex items-center justify-center transition-colors"
                    title="Approve"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-error/10 text-error hover:bg-error/20 flex items-center justify-center transition-colors"
                    title="Reject"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity — 2 columns */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)] mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentAdminActivity.map((activity) => {
              const Icon = activityIcons[activity.type] || AlertCircle;
              const colorClasses = activityColors[activity.type] || "text-text-muted bg-surface-700";

              return (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{activity.actor}</span>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {activity.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
