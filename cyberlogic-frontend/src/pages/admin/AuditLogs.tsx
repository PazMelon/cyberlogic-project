import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Shield,
  SlidersHorizontal,
  Terminal,
  FileText,
  Key,
  LogIn,
  LogOut,
  UserCheck,
  PlusCircle,
  Edit,
  Trash2,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Pin,
  Lock,
  CheckCircle,
} from "lucide-react";
import { fetchAuditLogs, fetchAuditLogStats } from "../../utils/api";
import type { AuditLogEntry, AuditLogStats } from "../../utils/api";
import { Button, Card, Badge } from "../../components/ui";
import { useWebSocket } from "../../context/WebSocketContext";

const actionIcons: Record<string, any> = {
  created: PlusCircle,
  updated: Edit,
  deleted: Trash2,
  login: LogIn,
  logout: LogOut,
  approved: UserCheck,
  rejected: Trash2,
  registered: Bookmark,
  unregistered: Trash2,
  role_changed: Shield,
  password_changed: Key,
  uploaded: FileText,
  pinned: Pin,
  unpinned: Pin,
  closed: Lock,
  reopened: Lock,
  solved: CheckCircle,
  unsolved: CheckCircle,
  voted: ThumbsUp,
  reacted: MessageSquare,
  reordered: SlidersHorizontal,
};

const actionColors: Record<string, string> = {
  created: "text-success bg-success/10 border-success/20",
  updated: "text-info bg-info/10 border-info/20",
  deleted: "text-error bg-error/10 border-error/20",
  login: "text-primary bg-primary/10 border-primary/20",
  logout: "text-warning bg-warning/10 border-warning/20",
  approved: "text-success bg-success/10 border-success/20",
  rejected: "text-error bg-error/10 border-error/20",
  registered: "text-accent bg-accent/10 border-accent/20",
  role_changed: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  password_changed: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  uploaded: "text-info bg-info/10 border-info/20",
  pinned: "text-warning bg-warning/10 border-warning/20",
  closed: "text-error bg-error/10 border-error/20",
  solved: "text-success bg-success/10 border-success/20",
  voted: "text-accent bg-accent/10 border-accent/20",
  reacted: "text-primary bg-primary/10 border-primary/20",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Active filter triggers
  const [triggerFetch, setTriggerFetch] = useState(0);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAuditLogs({
        page,
        per_page: perPage,
        action,
        entity_type: entityType,
        date_from: dateFrom,
        date_to: dateTo,
        search,
      });
      setLogs(response.data);
      setTotalPages(response.last_page);
      setTotalLogs(response.total);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    setIsStatsLoading(true);
    try {
      const statData = await fetchAuditLogStats();
      setStats(statData);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const { subscribe } = useWebSocket();

  useEffect(() => {
    loadLogs();
  }, [page, triggerFetch]);

  useEffect(() => {
    loadStats();
  }, [triggerFetch]);

  useEffect(() => {
    const unsubscribe = subscribe("admin:audit_logs", (payload) => {
      if (payload.event === "log_created") {
        setLogs((prev) => {
          if (prev.some((l) => l.id === payload.log.id)) return prev;
          return [{ ...payload.log, animate: "animate-message-arrive" }, ...prev.slice(0, perPage - 1)];
        });
        setTotalLogs((prev) => prev + 1);
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            total_logs: prev.total_logs + 1,
            logs_today: prev.logs_today + 1,
          };
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setTriggerFetch((p) => p + 1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setAction("");
    setEntityType("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setTriggerFetch((p) => p + 1);
  };

  const formatMetadata = (meta: any) => {
    if (!meta) return null;
    try {
      return JSON.stringify(meta, null, 2);
    } catch (e) {
      return String(meta);
    }
  };

  const getActionDescription = (log: AuditLogEntry) => {
    const actionLabel = log.action.replace("_", " ");
    const typeLabel = log.entity_type.replace(/([A-Z])/g, " $1").trim();
    const target = log.entity_label ? `"${log.entity_label}"` : `#${log.entity_id || ""}`;
    
    if (log.action === "login") return "Logged in securely";
    if (log.action === "logout") return "Logged out from system";
    if (log.action === "password_changed") return "Updated account password";
    
    return `${actionLabel} ${typeLabel} ${target}`.trim();
  };

  const getRoleBadgeVariant = (role: string): "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral" => {
    if (role === "superadmin") return "error";
    if (role === "admin") return "warning";
    if (role === "system") return "neutral";
    return "primary";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary flex items-center gap-2">
            <Terminal className="w-6 h-6 text-amber-500" />
            Audit Logs
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Browse and search real-time records of every action and security event in the system.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="px-4 py-2 flex items-center gap-2 self-start sm:self-center"
          onClick={() => setTriggerFetch((p) => p + 1)}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Stream
        </Button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs text-text-muted">Total Security Logs</span>
          {isStatsLoading ? (
            <div className="h-8 w-16 bg-surface-800 animate-pulse rounded mt-2" />
          ) : (
            <span className="text-2xl font-bold text-text-primary font-[family-name:var(--font-heading)] mt-1">
              {stats?.total_logs ?? 0}
            </span>
          )}
          <span className="text-[10px] text-text-muted mt-1">All-time entries recorded</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs text-text-muted">Logged Today</span>
          {isStatsLoading ? (
            <div className="h-8 w-16 bg-surface-800 animate-pulse rounded mt-2" />
          ) : (
            <span className="text-2xl font-bold text-amber-500 font-[family-name:var(--font-heading)] mt-1">
              {stats?.logs_today ?? 0}
            </span>
          )}
          <span className="text-[10px] text-text-muted mt-1">Actions in the last 24h</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs text-text-muted">Most Active Actor</span>
          {isStatsLoading ? (
            <div className="h-8 w-32 bg-surface-800 animate-pulse rounded mt-2" />
          ) : (
            <span className="text-base font-bold text-text-secondary truncate mt-1">
              {stats?.top_actor ?? "System"}
            </span>
          )}
          <span className="text-[10px] text-text-muted mt-1">
            {stats?.top_actor_count ? `${stats.top_actor_count} actions total` : "No actors logged"}
          </span>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs text-text-muted">Top Action Mode</span>
          {isStatsLoading ? (
            <div className="h-8 w-24 bg-surface-800 animate-pulse rounded mt-2" />
          ) : (
            <span className="text-base font-bold text-accent capitalize mt-1">
              {stats?.action_summary?.[0]?.action ?? "N/A"}
            </span>
          )}
          <span className="text-[10px] text-text-muted mt-1">
            {stats?.action_summary?.[0]?.total ? `${stats.action_summary[0].total} occurrences` : "No actions logged"}
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search actor, target entity, IP address, or action keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-surface-950 border border-border rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all text-text-primary"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:w-auto">
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="px-3 py-2 text-xs bg-surface-950 border border-border rounded-xl focus:border-amber-500 transition-all text-text-secondary"
              >
                <option value="">All Actions</option>
                <option value="created">created</option>
                <option value="updated">updated</option>
                <option value="deleted">deleted</option>
                <option value="login">login</option>
                <option value="logout">logout</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="registered">registered</option>
                <option value="unregistered">unregistered</option>
                <option value="role_changed">role_changed</option>
                <option value="password_changed">password_changed</option>
                <option value="uploaded">uploaded</option>
                <option value="pinned">pinned</option>
                <option value="unpinned">unpinned</option>
                <option value="closed">closed</option>
                <option value="reopened">reopened</option>
                <option value="solved">solved</option>
                <option value="unsolved">unsolved</option>
                <option value="voted">voted</option>
                <option value="reacted">reacted</option>
                <option value="reordered">reordered</option>
              </select>

              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="px-3 py-2 text-xs bg-surface-950 border border-border rounded-xl focus:border-amber-500 transition-all text-text-secondary"
              >
                <option value="">All Types</option>
                <option value="User">User</option>
                <option value="Announcement">Announcement</option>
                <option value="BlogPost">BlogPost</option>
                <option value="Event">Event</option>
                <option value="ForumThread">ForumThread</option>
                <option value="ForumComment">ForumComment</option>
                <option value="ForumCategory">ForumCategory</option>
                <option value="ChatChannel">ChatChannel</option>
                <option value="ChatMessage">ChatMessage</option>
                <option value="SiteSetting">SiteSetting</option>
                <option value="EventRegistration">EventRegistration</option>
              </select>

              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                  className="w-full px-3 py-2 text-xs bg-surface-950 border border-border rounded-xl focus:border-amber-500 text-text-secondary"
                />
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To"
                  className="w-full px-3 py-2 text-xs bg-surface-950 border border-border rounded-xl focus:border-amber-500 text-text-secondary"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs"
            >
              Reset Filters
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-5 py-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold"
            >
              Apply Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Audit Log Table Section */}
      <Card className="overflow-hidden border border-border bg-surface-900/10">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-950/60 font-semibold text-text-muted">
                <th className="p-4 w-12 text-center">Action</th>
                <th className="p-4 w-52">Actor</th>
                <th className="p-4">Description</th>
                <th className="p-4 w-32">IP Address</th>
                <th className="p-4 w-36">Timestamp</th>
                <th className="p-4 w-20 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4">
                      <div className="w-8 h-8 rounded-lg bg-surface-800 mx-auto" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 w-32 bg-surface-800 rounded" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 w-3/4 bg-surface-800 rounded" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 w-20 bg-surface-800 rounded" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 w-24 bg-surface-800 rounded" />
                    </td>
                    <td className="p-4">
                      <div className="h-6 w-12 bg-surface-800 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-muted">
                    <Clock className="w-10 h-10 text-text-muted/40 mx-auto mb-3" />
                    <p className="font-semibold text-sm">No Audit Logs Found</p>
                    <p className="text-xs mt-1">Try resetting your filters or adjusting your date range.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = actionIcons[log.action] || SlidersHorizontal;
                  const colorClass = actionColors[log.action] || "text-text-muted bg-surface-800 border-border";
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-white/[0.02] transition-colors ${log.animate || ""}`}>
                        <td className="p-4 text-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border mx-auto ${colorClass}`} title={log.action}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-primary truncate max-w-[160px]" title={log.user_name}>
                                {log.user_name}
                              </span>
                              <div className="mt-0.5">
                                <Badge variant={getRoleBadgeVariant(log.user_role)} size="xs" uppercase={true}>
                                  {log.user_role}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-text-primary font-medium leading-relaxed">
                          {getActionDescription(log)}
                        </td>
                        <td className="p-4 font-mono text-text-muted select-all">
                          {log.ip_address || "127.0.0.1"}
                        </td>
                        <td className="p-4 text-text-muted whitespace-nowrap">
                          <div className="flex items-center gap-1.5" title={new Date(log.created_at).toLocaleString()}>
                            <Clock className="w-3.5 h-3.5 opacity-60" />
                            <span>{new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="px-2 py-1 text-[10px] tracking-wide cursor-pointer"
                          >
                            {isExpanded ? "Hide" : "Inspect"}
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-surface-950/40">
                          <td colSpan={6} className="p-4 border-t border-b border-border/40">
                            <div className="rounded-xl border border-border/60 bg-surface-950 p-4 space-y-3 font-mono text-[11px] leading-relaxed">
                              <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-2">
                                <span className="text-text-muted font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                  <Terminal className="w-3.5 h-3.5 text-amber-500" />
                                  Log # {log.id} Payload Detail
                                </span>
                                <span className="text-text-muted text-[10px] select-all">IP: {log.ip_address || "127.0.0.1"}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <div className="flex gap-2">
                                    <span className="text-text-muted font-bold w-24 flex-shrink-0">Action:</span>
                                    <span className="text-amber-500 font-semibold">{log.action}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-text-muted font-bold w-24 flex-shrink-0">Entity Type:</span>
                                    <span className="text-accent font-semibold">{log.entity_type}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-text-muted font-bold w-24 flex-shrink-0">Entity ID:</span>
                                    <span className="text-text-primary">{log.entity_id || "null"}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-text-muted font-bold w-24 flex-shrink-0">Entity Label:</span>
                                    <span className="text-text-primary break-all">{log.entity_label || "null"}</span>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="text-text-muted font-bold mb-1">Metadata:</div>
                                  {log.metadata ? (
                                    <pre className="bg-surface-900 border border-border/40 p-2.5 rounded-lg text-text-secondary max-h-48 overflow-y-auto whitespace-pre-wrap select-all font-mono leading-relaxed">
                                      {formatMetadata(log.metadata)}
                                    </pre>
                                  ) : (
                                    <span className="text-text-muted italic">No extra metadata payload captured</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-surface-950/60 p-4">
            <div className="text-[11px] text-text-muted">
              Showing page <span className="font-semibold text-text-secondary">{page}</span> of{" "}
              <span className="font-semibold text-text-secondary">{totalPages}</span> (
              <span className="font-semibold text-text-secondary">{totalLogs}</span> entries total)
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
