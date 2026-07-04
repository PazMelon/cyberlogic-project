import { useState } from "react";
import {
  Search,
  MoreVertical,
  AlertCircle,
  Shield,
} from "lucide-react";
import { directoryMembers, pendingMembers } from "../../data/mockData";


export default function MemberManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [showPending, setShowPending] = useState(true);

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
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              Dismiss
            </button>
          </div>
          <div className="space-y-2">
            {pendingMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-800/50">
                <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{m.name}</p>
                  <p className="text-xs text-text-muted">{m.email} · {m.studentId} · {m.department}</p>
                </div>
                <span className="text-xs text-text-muted hidden sm:inline">Applied {m.appliedDate}</span>
                <div className="flex gap-1.5">
                  <button type="button" className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors">
                    Approve
                  </button>
                  <button type="button" className="px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-medium hover:bg-error/20 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
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
              {filtered.map((member) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
