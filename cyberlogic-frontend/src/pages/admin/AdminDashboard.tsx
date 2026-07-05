import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Users,
  Megaphone,
  Calendar,
  MessagesSquare,
  UserPlus,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  FileText,
  Pin,
  Info,
} from "lucide-react";
import { recentAdminActivity } from "../../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../../components/Skeleton";
import { Button } from "../../components/ui";
import { fetchUsers, approveUser, rejectUser } from "../../utils/api";

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
  const [isLoading, setIsLoading] = useState(true);
  const [totalMembersCount, setTotalMembersCount] = useState(150);
  const [pendingMembersCount, setPendingMembersCount] = useState(3);
  const [pendingList, setPendingList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const users = await fetchUsers();
      const approvedCount = users.filter((u) => u.status !== "pending").length;
      const pendingUsers = users.filter((u) => u.status === "pending");

      setTotalMembersCount(approvedCount);
      setPendingMembersCount(pendingUsers.length);

      const mappedPending = pendingUsers.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.first_name}`,
        studentId: u.school_id,
      }));
      setPendingList(mappedPending);
    } catch (e) {
      console.error("Failed to load dashboard statistics:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveUser(id);
      setPendingList((prev) => prev.filter((p) => p.id !== id));
      setPendingMembersCount((prev) => Math.max(0, prev - 1));
      setTotalMembersCount((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || "Failed to approve user registration.");
    }
  };

  const handleReject = async (id: number) => {
    const userToReject = pendingList.find((p) => p.id === id);
    if (!userToReject) return;
    if (confirm(`Are you sure you want to reject and delete ${userToReject.name}'s request?`)) {
      try {
        await rejectUser(id);
        setPendingList((prev) => prev.filter((p) => p.id !== id));
        setPendingMembersCount((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        alert(err.message || "Failed to reject registration request.");
      }
    }
  };

  const statCards = [
    { icon: Users, label: "Total Members", value: totalMembersCount.toString(), change: "Active in database", color: "amber" },
    { icon: UserPlus, label: "Pending Approvals", value: pendingMembersCount.toString(), change: pendingMembersCount > 0 ? "Needs attention" : "All cleared", color: "error" },
    { icon: MessagesSquare, label: "Active Threads", value: "118", change: "+12 this week", color: "primary" },
    { icon: Calendar, label: "Upcoming Events", value: "5", change: "Next: Jul 10", color: "accent" },
  ];

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
          statCards.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl p-4 hover:border-amber-500/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === "amber" ? "bg-amber-500/10 text-amber-500" :
                  stat.color === "error" ? "bg-error/10 text-error" :
                  stat.color === "primary" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                }`}>
                  <stat.icon className="w-5 h-5" />
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

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending Approvals queue */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary font-[family-name:var(--font-heading)]">
                Pending Membership Approvals
              </h2>
              <p className="text-xs text-text-muted mt-0.5">Review and approve new member registration forms.</p>
            </div>
            <Link
              to="/admin/members"
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              Queue Management <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-900/10 animate-pulse">
                    <div className="flex items-center gap-3">
                      <SkeletonCircle className="w-9 h-9 bg-surface-800" />
                      <div className="space-y-1.5">
                        <SkeletonLine widthClass="w-32" heightClass="h-4" />
                        <SkeletonLine widthClass="w-24" heightClass="h-3" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <SkeletonLine widthClass="w-16" heightClass="h-7" />
                      <SkeletonLine widthClass="w-16" heightClass="h-7" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              pendingList.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-900/10 hover:border-amber-500/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-9 h-9 rounded-full bg-surface-700 object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">{member.name}</h4>
                      <p className="text-xs text-text-muted">ID: {member.studentId} · {member.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="success"
                      className="px-3 py-1 text-xs cursor-pointer"
                      onClick={() => handleApprove(member.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-3 py-1 text-xs cursor-pointer"
                      onClick={() => handleReject(member.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}

            {!isLoading && pendingList.length === 0 && (
              <div className="p-6 text-center rounded-xl bg-surface-900/20 border border-border/40 text-xs text-text-muted">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2 opacity-60" />
                All membership requests have been processed!
              </div>
            )}
          </div>
        </div>

        {/* Recent Admin Activities list */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary font-[family-name:var(--font-heading)]">
              Audit Logs
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Recent system actions and logs.</p>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <SkeletonCircle className="w-8 h-8 bg-surface-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine widthClass="w-3/4" heightClass="h-3.5" />
                      <SkeletonLine widthClass="w-1/3" heightClass="h-3" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              recentAdminActivity.map((activity) => {
                const Icon = activityIcons[activity.type] || Info;
                const color = activityColors[activity.type] || "text-text-muted bg-surface-800";

                return (
                  <div key={activity.id} className="flex items-start gap-3 text-xs">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-medium leading-tight">
                        <span className="font-semibold text-text-secondary">{activity.actor}</span>:{" "}
                        {activity.description}
                      </p>
                      <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1 font-mono">
                        <Clock className="w-3 h-3" /> {activity.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
