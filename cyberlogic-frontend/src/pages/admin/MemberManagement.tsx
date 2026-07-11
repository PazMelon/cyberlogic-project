import { useState, useEffect } from "react";
import {
  AlertCircle,
  Shield,
  UserCheck,
  X,
  Mail,
  Award,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchUsers, updateUserRole, approveUser, rejectUser, suspendUser, unsuspendUser, fetchAuditLogs } from "../../utils/api";
import { Button, Card, DataTable } from "../../components/ui";
import { useWebSocket } from "../../context/WebSocketContext";
import { useDialog } from "../../utils/useDialog";
import type { DirectoryMember } from "../../data/mockData";
import type { AuditLogEntry } from "../../utils/api";

const labelToRole = (label: string) => {
  const l = label.toLowerCase();
  if (l === "super admin" || l === "superadmin") return "superadmin";
  if (l === "admin") return "admin";
  return "member";
};

export default function MemberManagement() {
  const { isSuperAdmin } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState<"directory" | "pending" | "suspensions" | "audit">("directory");
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [bannedMembers, setBannedMembers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Selected User Panel State (Inline Split Panel)
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Drawer Form State
  const [editRole, setEditRole] = useState("Member");
  const [banLength, setBanLength] = useState("none");
  const [banReason, setBanReason] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [users, logsResponse] = await Promise.all([
        fetchUsers(),
        fetchAuditLogs({ per_page: 200, entity_type: "User" })
      ]);
      
      const approvedUsers = users.filter((u) => u.status === "approved");
      const pendingUsers = users.filter((u) => u.status === "pending");
      const suspendedUsers = users.filter((u) => u.status === "suspended");

      const mappedMembers: DirectoryMember[] = approvedUsers.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.first_name}`,
        role: u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "Admin" : "Member",
        department: u.department || "Information Technology",
        yearLevel: u.year_level || "1st Year",
        expertise: ["General Tech"],
        badges: [],
        joinedDate: u.joinedDate || new Date().toISOString().split("T")[0],
        status: "offline" as const,
        bio: u.address ? `Located at ${u.address}` : "Registered digital innovation enthusiast.",
        studentId: u.school_id
      }));

      const mappedPending = pendingUsers.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.first_name}`,
        studentId: u.school_id,
        department: u.department || "Information Technology",
        appliedDate: u.joinedDate || new Date().toISOString().split("T")[0]
      }));

      const mappedSuspended = suspendedUsers.map((u) => {
        const banDays = u.suspended_at && u.suspended_until 
          ? Math.round((new Date(u.suspended_until).getTime() - new Date(u.suspended_at).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return {
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
          email: u.email,
          avatar: u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.first_name}`,
          studentId: u.school_id,
          department: u.department || "Computer Science",
          banReason: u.suspension_reason || "Violated club guidelines.",
          banDate: u.suspended_at ? u.suspended_at.split("T")[0] : new Date().toISOString().split("T")[0],
          banDuration: banDays ? `${banDays} Days` : "Permanent"
        };
      });

      const allowedActions = ["registered", "approved", "deleted", "suspended", "unsuspended"];
      const filteredLogs = (logsResponse.data || []).filter(
        (log: any) => allowedActions.includes(log.action) && log.entity_type === "User"
      );

      setMembers(mappedMembers);
      setPending(mappedPending);
      setBannedMembers(mappedSuspended);
      setAuditLogs(filteredLogs);
    } catch (err) {
      console.error("Failed to load members from DB:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const { subscribe } = useWebSocket();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe("admin:member_management", (payload) => {
      if (payload.event === "registration_pending") {
        setPending((prev) => {
          if (prev.some((p) => p.id === payload.user.id)) return prev;
          return [{ ...payload.user, animate: "animate-row-pulse" }, ...prev];
        });
      } else if (payload.event === "registration_approved") {
        setPending((prev) => prev.filter((p) => p.id !== payload.userId));
        setBannedMembers((prev) => prev.filter((b) => b.id !== payload.userId));
        setMembers((prev) => {
          if (prev.some((m) => m.id === payload.userId)) return prev;
          return [{ ...payload.member, animate: "animate-row-pulse" }, ...prev];
        });
      } else if (payload.event === "registration_rejected") {
        setPending((prev) => prev.filter((p) => p.id !== payload.userId));
        setMembers((prev) => prev.filter((m) => m.id !== payload.userId));
      } else if (payload.event === "member_suspended") {
        const u = payload.member;
        setMembers((prev) => prev.filter((m) => m.id !== payload.userId));
        setBannedMembers((prev) => {
          if (prev.some((b) => b.id === payload.userId)) return prev;
          const banDays = u.suspended_at && u.suspended_until 
            ? Math.round((new Date(u.suspended_until).getTime() - new Date(u.suspended_at).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          return [
            {
              id: u.id,
              name: `${u.first_name} ${u.last_name}`,
              email: u.email,
              avatar: u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.first_name}`,
              studentId: u.school_id,
              department: u.department || "Computer Science",
              banReason: u.suspension_reason || "Violated club guidelines.",
              banDate: u.suspended_at ? u.suspended_at.split("T")[0] : new Date().toISOString().split("T")[0],
              banDuration: banDays ? `${banDays} Days` : "Permanent"
            },
            ...prev
          ];
        });
      } else if (payload.event === "member_unsuspended") {
        setBannedMembers((prev) => prev.filter((b) => b.id !== payload.userId));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);



  const statusColors: Record<string, string> = {
    online: "bg-success",
    offline: "bg-text-muted",
    away: "bg-warning",
  };

  const handleApprove = async (id: number) => {
    const userToApprove = pending.find((p) => p.id === id);
    if (!userToApprove) return;

    try {
      await approveUser(id);
      
      // Reload lists and audit logs from database
      await loadData();

      showAlert({
        title: "Registration Approved",
        message: `${userToApprove.name} has been approved successfully.`,
        type: "success",
      });
    } catch (err: any) {
      showAlert({
        title: "Approval Failed",
        message: err.message || "Failed to approve member registration.",
        type: "error",
      });
    }
  };

  const handleReject = async (id: number) => {
    const rejectedUser = pending.find((p) => p.id === id);
    if (!rejectedUser) return;

    const confirmed = await showConfirm({
      title: "Reject Request",
      message: `Are you sure you want to reject and delete ${rejectedUser.name}'s request?`,
      type: "danger",
      confirmText: "Reject",
    });

    if (confirmed) {
      try {
        await rejectUser(id);
        
        // Reload lists and audit logs from database
        await loadData();

        showAlert({
          title: "Registration Rejected",
          message: `${rejectedUser.name} has been rejected and deleted.`,
          type: "success",
        });
      } catch (err: any) {
        showAlert({
          title: "Rejection Failed",
          message: err.message || "Failed to reject registration request.",
          type: "error",
        });
      }
    }
  };

  const handleOpenDrawer = (user: any) => {
    setSelectedUser(user);
    setEditRole(user.role || "Member");
    setBanLength("none");
    setBanReason("");
  };

  const handleSaveModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Check if ban is triggered
    if (banLength !== "none") {
      try {
        await suspendUser(selectedUser.id, banLength, banReason || "Violated club guidelines.");
        
        // Refresh everything to reflect DB change
        await loadData();
        
        showAlert({
          title: "Suspended Successfully",
          message: `${selectedUser.name} has been suspended.`,
          type: "success",
        });
      } catch (err: any) {
        showAlert({
          title: "Suspension Failed",
          message: err.message || "Failed to suspend user.",
          type: "error",
        });
        return;
      }
    } else {
      // Role Update
      try {
        const backendRole = labelToRole(editRole);
        await updateUserRole(selectedUser.id, backendRole);

        // Refresh database state
        await loadData();

        showAlert({
          title: "Role Updated",
          message: `Role of ${selectedUser.name} updated to ${editRole}.`,
          type: "success",
        });
      } catch (err: any) {
        showAlert({
          title: "Role Update Failed",
          message: err.message || "Failed to update member role in backend database.",
          type: "error",
        });
        return;
      }
    }

    setSelectedUser(null);
  };

  const handleUnban = async (id: number) => {
    const unbanned = bannedMembers.find((b) => b.id === id);
    if (!unbanned) return;

    try {
      await unsuspendUser(id);
      
      // Refresh database state
      await loadData();

      showAlert({
        title: "Suspension Lifted",
        message: `Suspension for ${unbanned.name} has been lifted.`,
        type: "success",
      });
    } catch (err: any) {
      showAlert({
        title: "Action Failed",
        message: err.message || "Failed to lift suspension.",
        type: "error",
      });
    }
  };

  const directoryColumns = [
    {
      header: "Member",
      accessor: (member: any) => (
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full bg-surface-700 object-cover border border-border/60" />
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-950 ${statusColors[member.status] || "bg-text-muted"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{member.name}</p>
            <p className="text-xs text-text-muted truncate">{member.email}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "name" as any
    },
    {
      header: "Role",
      accessor: (member: any) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Shield className="w-2.5 h-2.5" /> {member.role}
        </span>
      ),
      sortable: true,
      sortKey: "role" as any,
      className: "hidden md:table-cell"
    },
    {
      header: "Department",
      accessor: (member: any) => <span className="text-sm text-text-secondary">{member.department}</span>,
      sortable: true,
      sortKey: "department" as any,
      className: "hidden lg:table-cell"
    },
    {
      header: "Status",
      accessor: (member: any) => <span className="text-xs text-text-secondary capitalize">{member.status}</span>,
      sortable: true,
      sortKey: "status" as any,
      className: "hidden sm:table-cell"
    },
    {
      header: "Joined Date",
      accessor: (member: any) => <span className="text-xs text-text-muted">{member.joinedDate}</span>,
      sortable: true,
      sortKey: "joinedDate" as any,
      className: "hidden lg:table-cell"
    },
    {
      header: "Action",
      accessor: (member: any) => {
        const isCurrentSelected = selectedUser && selectedUser.id === member.id;
        return (
          <Button
            variant={isCurrentSelected ? "admin" : "secondary"}
            onClick={() => handleOpenDrawer(member)}
            className="px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            Manage
          </Button>
        );
      },
      className: "text-right"
    }
  ];

  const memberFilterGroups = [
    {
      label: "Role",
      field: "role",
      options: [
        { label: "Member", value: "Member" },
        { label: "Tech Lead", value: "Tech Lead" },
        { label: "Events Coordinator", value: "Events Coordinator" },
        { label: "Moderator", value: "Moderator" },
        { label: "Admin", value: "Admin" },
        { label: "Super Admin", value: "Super Admin" }
      ]
    },
    {
      label: "Department",
      field: "department",
      options: [
        { label: "Information Technology", value: "Information Technology" },
        { label: "Teacher Education", value: "Teacher Education" },
        { label: "Business Administration", value: "Business Administration" },
        { label: "Criminal Justice Education", value: "Criminal Justice Education" },
        { label: "Hospitality Management", value: "Hospitality Management" },
        { label: "RVM-TTP", value: "RVM-TTP" }
      ]
    },
    {
      label: "Status",
      field: "status",
      options: [
        { label: "Online", value: "online" },
        { label: "Offline", value: "offline" },
        { label: "Away", value: "away" }
      ]
    }
  ];

  const suspensionsColumns = [
    {
      header: "Suspended Member",
      accessor: (member: any) => (
        <div className="flex items-center gap-3">
          <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full bg-surface-700 object-cover border border-border/60" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
            <p className="text-xs text-text-muted truncate">{member.email}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "name" as any
    },
    {
      header: "Ban Reason",
      accessor: (member: any) => (
        <p className="text-xs text-error/90 line-clamp-1 max-w-xs" title={member.banReason}>
          {member.banReason}
        </p>
      ),
      sortable: true,
      sortKey: "banReason" as any
    },
    {
      header: "Duration",
      accessor: (member: any) => (
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-error/15 text-error border border-error/20">
          {member.banDuration}
        </span>
      ),
      sortable: true,
      sortKey: "banDuration" as any,
      className: "hidden sm:table-cell"
    },
    {
      header: "Ban Date",
      accessor: (member: any) => <span className="text-xs text-text-muted">{member.banDate}</span>,
      sortable: true,
      sortKey: "banDate" as any,
      className: "hidden md:table-cell"
    },
    {
      header: "Action",
      accessor: (member: any) => (
        <Button
          variant="success"
          className="px-3 py-1.5 text-xs font-semibold cursor-pointer"
          onClick={() => handleUnban(member.id)}
        >
          Unban
        </Button>
      ),
      className: "text-right"
    }
  ];

  const auditLogsColumns = [
    {
      header: "Actor",
      accessor: (log: any) => (
        <span className="font-semibold text-text-secondary">{log.user_name || "System"}</span>
      ),
      sortable: true,
      sortKey: "user_name" as any,
    },
    {
      header: "Action Type",
      accessor: (log: any) => {
        let actionColor = "text-text-primary";
        if (log.action === "registered" || log.action === "approved" || log.action === "unsuspended") {
          actionColor = "text-success font-medium";
        } else if (log.action === "suspended" || log.action === "deleted") {
          actionColor = "text-error font-medium";
        }
        return (
          <span className={`capitalize ${actionColor}`}>{log.action}</span>
        );
      },
      sortable: true,
      sortKey: "action" as any,
    },
    {
      header: "Description / Reason",
      accessor: (log: any) => (
        <div>
          <span className="text-xs text-text-primary">
            {log.action === "registered" && `Requested membership registration`}
            {log.action === "approved" && `Approved membership registration`}
            {log.action === "deleted" && `Rejected and deleted registration request`}
            {log.action === "suspended" && `Suspended account`}
            {log.action === "unsuspended" && `Restored/Unsuspended account`}
          </span>
          {log.metadata?.reason && (
            <p className="text-[11px] text-error/70 mt-0.5 italic">
              Reason: "{log.metadata.reason}"
            </p>
          )}
        </div>
      ),
      sortable: true,
      sortKey: "action" as any,
    },
    {
      header: "Target Member",
      accessor: (log: any) => <span className="text-xs text-text-primary">{log.entity_label || "N/A"}</span>,
      sortable: true,
      sortKey: "entity_label" as any,
    },
    {
      header: "Timestamp",
      accessor: (log: any) => (
        <span className="text-xs text-text-muted">
          {new Date(log.created_at).toLocaleString()}
        </span>
      ),
      sortable: true,
      sortKey: "created_at" as any,
    }
  ];

  const renderControlsContent = () => {
    if (!selectedUser) return null;
    return (
      <form onSubmit={handleSaveModeration} className="space-y-4">
        
        {/* Profile Card Summary */}
        <div className="flex gap-3 p-3 rounded-lg border border-border bg-surface-900/30">
          <img src={selectedUser.avatar} alt={selectedUser.name} className="w-12 h-12 rounded-full bg-surface-700 object-cover flex-shrink-0" />
          <div className="text-xs space-y-0.5 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{selectedUser.name}</h3>
            <p className="text-[11px] text-text-muted truncate flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedUser.email}</p>
            <p className="text-[11px] text-text-muted truncate flex items-center gap-1"><Award className="w-3 h-3" /> Dept: {selectedUser.department}</p>
            <p className="text-[11px] text-text-muted truncate flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined: {selectedUser.joinedDate}</p>
          </div>
        </div>

        {/* Role Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Club Access Level (Role)</label>
          <select
            disabled={!isSuperAdmin}
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
            <option value="Super Admin">Super Admin</option>
          </select>
          {!isSuperAdmin && (
            <p className="text-[10px] text-warning flex items-center gap-1 mt-1 font-semibold">
              <AlertCircle className="w-3 h-3" /> Only the Club Moderator (Super Admin) can assign user roles.
            </p>
          )}
        </div>

        {/* Ban Controls Area */}
        <div className="p-3.5 rounded-xl border border-error/20 bg-error/5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-error flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Block Controls
          </h4>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Suspension Duration</label>
            <select
              value={banLength}
              onChange={(e) => setBanLength(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50 transition-all"
            >
              <option value="none">Active (No Suspension)</option>
              <option value="7">7 Days Suspension</option>
              <option value="30">30 Days Suspension</option>
              <option value="perm">Permanent Club Ban</option>
            </select>
          </div>

          {banLength !== "none" && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-text-secondary">Reason for Action *</label>
              <textarea
                rows={2.5}
                required
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Inappropriate behavior..."
                className="w-full p-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-error/50 transition-all resize-none placeholder:text-text-muted"
              />
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSelectedUser(null)}
            className="px-3 py-1.5 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="admin"
            className="px-4 py-1.5 text-xs"
          >
            Save Changes
          </Button>
        </div>

      </form>
    );
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
            {members.length} active · {pending.length} pending · {bannedMembers.length} suspended
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border gap-2 overflow-x-auto whitespace-nowrap no-scrollbar pb-px">
        <button
          type="button"
          onClick={() => {
            setActiveTab("directory");
            setSelectedUser(null);
          }}
          className={`flex-shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "directory"
              ? "border-amber-500 text-amber-400 font-bold"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Active Directory ({members.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("pending");
            setSelectedUser(null);
          }}
          className={`flex-shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-amber-500 text-amber-400 font-bold"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Pending Approvals ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("suspensions");
            setSelectedUser(null);
          }}
          className={`flex-shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "suspensions"
              ? "border-amber-500 text-amber-400 font-bold"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Suspensions ({bannedMembers.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("audit");
            setSelectedUser(null);
          }}
          className={`flex-shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "audit"
              ? "border-amber-500 text-amber-400 font-bold"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* SPLIT LAYOUT: GRID FOR DIRECTORY TABLE + INLINE OPERATION PANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Section: Content lists / Tables */}
        <div className={`space-y-6 ${selectedUser && activeTab === "directory" ? "xl:col-span-8" : "xl:col-span-12"}`}>
          


          {activeTab === "directory" && (
            isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-xs text-text-muted">Loading members from database...</p>
              </div>
            ) : (
              <DataTable
                data={members}
                columns={directoryColumns}
                filterGroups={memberFilterGroups}
                searchPlaceholder="Search by name, email, or Student ID..."
                emptyStateText="No members found matching the criteria."
              />
            )
          )}

          {/* PENDING APPROVALS LIST */}
          {activeTab === "pending" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.length === 0 ? (
                  <div className="col-span-2 p-10 text-center glass rounded-xl border border-border/40 text-sm text-text-muted">
                    <UserCheck className="w-8 h-8 text-success mx-auto mb-2 opacity-60" />
                    All membership registrations have been cleared!
                  </div>
                ) : (
                  pending.map((member) => (
                    <div
                      key={member.id}
                      className={`glass rounded-xl p-5 border border-border/60 hover:border-amber-500/20 transition-all flex flex-col justify-between ${member.animate || ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full bg-surface-700 object-cover" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-text-primary">{member.name}</h3>
                          <p className="text-xs text-text-secondary mt-0.5">{member.email}</p>
                          <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider mt-1">
                            ID: {member.studentId} · {member.department}
                          </p>
                          <div className="mt-3 p-2 rounded-lg bg-surface-900/40 border border-border/40 text-[11px] text-text-secondary leading-relaxed">
                            <span className="text-amber-500 font-bold uppercase tracking-wider">Registry Check</span>: Auto-matches verified student roster registry databases.
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-border/30">
                        <Button
                          type="button"
                          variant="danger"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => handleReject(member.id)}
                        >
                          Reject Request
                        </Button>
                        <Button
                          type="button"
                          variant="success"
                          className="px-4 py-1.5 text-xs"
                          onClick={() => handleApprove(member.id)}
                        >
                          Verify & Approve
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SUSPENSIONS REGISTRY LIST */}
          {activeTab === "suspensions" && (
            <DataTable
              data={bannedMembers}
              columns={suspensionsColumns}
              searchPlaceholder="Search suspended members by name, email..."
              emptyStateText="No suspended members found."
            />
          )}

          {/* AUDIT LOG LIST */}
          {activeTab === "audit" && (
            <DataTable
              data={auditLogs}
              columns={auditLogsColumns}
              searchPlaceholder="Search audit logs by actor, action type, target..."
              emptyStateText="No member management logs found."
            />
          )}

        </div>

        {/* Right Side Section: INLINE USER CONTROLS PANEL (splits grid) */}
        {selectedUser && activeTab === "directory" && (
          <>
            {/* Desktop Version: Inline inside the grid */}
            <div className="hidden xl:block xl:col-span-4 space-y-6 xl:sticky xl:top-24">
              <Card className="p-6 border border-border/80 bg-surface-900/40 relative animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                  <div>
                    <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
                      Manage Controls
                    </h2>
                    <p className="text-[11px] text-text-muted">Adjust status and privilege ranks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                    title="Close Controls"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {renderControlsContent()}
              </Card>
            </div>

            {/* Mobile/Tablet Version: Slide-out Sidebar Drawer */}
            <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
              {/* Backdrop Overlay */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
                onClick={() => setSelectedUser(null)}
              />
              {/* Slide-out Panel */}
              <div className="relative w-full max-w-md h-full bg-surface-950 border-l border-border p-6 overflow-y-auto shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                  <div>
                    <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
                      Manage Controls
                    </h2>
                    <p className="text-[11px] text-text-muted">Adjust status and privilege ranks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                    title="Close Controls"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {renderControlsContent()}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
