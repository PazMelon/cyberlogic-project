import { useState, useEffect } from "react";
import { Search, MoreVertical, AlertCircle, Shield } from "lucide-react";
import { directoryMembers, pendingMembers } from "../../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../../components/Skeleton";

export default function MemberManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [showPending, setShowPending] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filtered = directoryMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const statusColors: Record<string, string> = {
    online: "bg-success",
    offline: "bg-text-muted",
    away: "bg-warning",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Member Management
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {directoryMembers.length} total members · {pendingMembers.length} pending approval
          </p>
        </div>
      </div>

      {/* Pending Approvals */}
      {showPending && pendingMembers.length > 0 && (
        <div className="glass rounded-xl p-5 border-l-4 border-l-warning">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              Pending Approvals ({pendingMembers.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowPending(false)}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-900/40 border border-border animate-pulse">
                    <div className="flex items-center gap-3">
                      <SkeletonCircle className="w-8 h-8 bg-surface-800" />
                      <div className="space-y-1">
                        <SkeletonLine widthClass="w-24" heightClass="h-3.5" />
                        <SkeletonLine widthClass="w-32" heightClass="h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-900/40 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full bg-surface-700"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary">{member.name}</h4>
                      <p className="text-[10px] text-text-muted">{member.studentId} · {member.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-success/20 hover:bg-success/35 text-success text-[10px] font-semibold border border-success/30 transition-all"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-error/20 hover:bg-error/35 text-error text-[10px] font-semibold border border-error/30 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Member", "Alumni"] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                roleFilter === role
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-border bg-surface-800 text-text-muted hover:border-amber-500/20"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Department</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <SkeletonCircle className="w-9 h-9 bg-surface-800" />
                          <div className="space-y-1.5 flex-1">
                            <SkeletonLine widthClass="w-24" heightClass="h-3.5" />
                            <SkeletonLine widthClass="w-32" heightClass="h-3" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <SkeletonLine widthClass="w-16" heightClass="h-4" />
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <SkeletonLine widthClass="w-20" heightClass="h-4" />
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <SkeletonLine widthClass="w-12" heightClass="h-3.5" />
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <SkeletonLine widthClass="w-16" heightClass="h-3.5" />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <SkeletonCircle className="w-8 h-8 ml-auto bg-surface-800" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full bg-surface-700" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-900 ${statusColors[member.status]}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                          <p className="text-xs text-text-muted truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400">
                        <Shield className="w-2.5 h-2.5" /> {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">{member.department}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize ${
                        member.status === "online" ? "text-success" :
                        member.status === "away" ? "text-warning" : "text-text-muted"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[member.status]}`} />
                        {member.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-text-muted">
                        {new Date(member.joinedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
