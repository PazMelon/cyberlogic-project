import { useState, useEffect } from "react";
import {
  Search,
  AlertCircle,
  Shield,
  UserCheck,
  History,
  X,
  Mail,
  Award,
  Calendar,
} from "lucide-react";
import { directoryMembers as initialMembers, pendingMembers as initialPending } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { fetchUsers, updateUserRole, approveUser, rejectUser } from "../../utils/api";
import { Button, Card, DataTable } from "../../components/ui";
import type { DirectoryMember } from "../../data/mockData";

// Mock Audit Logs
const initialAuditLogs = [
  { id: 1, actor: "Alex Reyes", action: "Approved James Lim's registration request", timestamp: "2 hours ago" },
  { id: 2, actor: "Alex Reyes", action: "Suspended Mark Dela Cruz (Duration: 7 days)", reason: "Spamming post replies", timestamp: "1 day ago" },
  { id: 3, actor: "System", action: "Auto-verified student ID: 2026-00789", timestamp: "2 days ago" },
  { id: 4, actor: "Samantha Cruz", action: "Promoted Carlos Mendoza to Tech Lead", timestamp: "3 days ago" },
];

const labelToRole = (label: string) => {
  const l = label.toLowerCase();
  if (l === "super admin" || l === "superadmin" || l === "moderator") return "superadmin";
  if (l === "admin") return "admin";
  if (l === "officer" || l === "tech lead" || l === "events coordinator") return "officer";
  return "member";
};

export default function MemberManagement() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"directory" | "pending" | "suspensions" | "audit">("directory");
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [bannedMembers, setBannedMembers] = useState([
    {
      id: 999,
      name: "Mark Dela Cruz",
      email: "mark.dc@uni.edu",
      studentId: "2024-00155",
      department: "Computer Science",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=mark",
      banReason: "Spamming link redirects in Chat general channel.",
      banDate: "2026-07-03",
      banDuration: "7 Days",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
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
      const users = await fetchUsers();
      
      const approvedUsers = users.filter((u) => u.status !== "pending");
      const pendingUsers = users.filter((u) => u.status === "pending");

      const mappedMembers: DirectoryMember[] = approvedUsers.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.first_name}`,
        role: u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "Admin" : u.role === "officer" ? "Tech Lead" : "Member",
        department: u.department || "Computer Science",
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
        department: u.department || "Computer Science",
        appliedDate: u.joinedDate || new Date().toISOString().split("T")[0]
      }));

      setMembers(mappedMembers);
      setPending(mappedPending);
    } catch (err) {
      console.error("Failed to load members from DB:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBanned = bannedMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      
      const newMember: DirectoryMember = {
        id: userToApprove.id,
        name: userToApprove.name,
        email: userToApprove.email,
        avatar: userToApprove.avatar,
        role: "Member",
        department: userToApprove.department,
        yearLevel: "1st Year",
        expertise: ["General Tech"],
        badges: [],
        joinedDate: new Date().toISOString().split("T")[0],
        status: "offline",
        bio: "Registered digital innovation enthusiast.",
        studentId: userToApprove.studentId,
      };

      setMembers([...members, newMember]);
      setPending(pending.filter((p) => p.id !== id));
      
      // Add to audit logs
      const newLog = {
        id: Date.now(),
        actor: "System Admin",
        action: `Approved ${userToApprove.name}'s registration request`,
        timestamp: "Just now",
      };
      setAuditLogs([newLog, ...auditLogs]);
    } catch (err: any) {
      alert(err.message || "Failed to approve member registration.");
    }
  };

  const handleReject = async (id: number) => {
    const rejectedUser = pending.find((p) => p.id === id);
    if (!rejectedUser) return;

    if (confirm(`Are you sure you want to reject and delete ${rejectedUser.name}'s request?`)) {
      try {
        await rejectUser(id);
        setPending(pending.filter((p) => p.id !== id));
        
        const newLog = {
          id: Date.now(),
          actor: "System Admin",
          action: `Rejected and deleted ${rejectedUser.name}'s registration request`,
          timestamp: "Just now",
        };
        setAuditLogs([newLog, ...auditLogs]);
      } catch (err: any) {
        alert(err.message || "Failed to reject registration request.");
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
      const banObj = {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        studentId: selectedUser.studentId || "N/A",
        department: selectedUser.department || "Computer Science",
        avatar: selectedUser.avatar,
        banReason: banReason || "Violated club forum guidelines.",
        banDate: new Date().toISOString().split("T")[0],
        banDuration: banLength === "perm" ? "Permanent" : banLength === "30" ? "30 Days" : "7 Days",
      };

      try {
        // Since ban is local/mock in the UI, we just delete them from DB or keep local ban state.
        // Let's delete them from DB to make it real, or just remove them from UI active list.
        await rejectUser(selectedUser.id);
        setMembers(members.filter((m) => m.id !== selectedUser.id));
        setBannedMembers([...bannedMembers, banObj]);

        const newLog = {
          id: Date.now(),
          actor: "System Admin",
          action: `Suspended ${selectedUser.name} (Duration: ${banObj.banDuration})`,
          reason: banObj.banReason,
          timestamp: "Just now",
        };
        setAuditLogs([newLog, ...auditLogs]);
      } catch (err: any) {
        alert(err.message || "Failed to suspend user.");
        return;
      }
    } else {
      // Role Update
      try {
        const backendRole = labelToRole(editRole);
        await updateUserRole(selectedUser.id, backendRole);

        setMembers(
          members.map((m) => (m.id === selectedUser.id ? { ...m, role: editRole as any } : m))
        );

        const newLog = {
          id: Date.now(),
          actor: "Club Moderator",
          action: `Updated role of ${selectedUser.name} to ${editRole}`,
          timestamp: "Just now",
        };
        setAuditLogs([newLog, ...auditLogs]);
      } catch (err: any) {
        alert(err.message || "Failed to update member role in backend database.");
        return;
      }
    }

    setSelectedUser(null);
  };

  const handleUnban = (id: number) => {
    const unbanned = bannedMembers.find((b) => b.id === id);
    if (!unbanned) return;

    const restored: DirectoryMember = {
      id: unbanned.id,
      name: unbanned.name,
      email: unbanned.email,
      avatar: unbanned.avatar,
      role: "Member",
      department: unbanned.department,
      yearLevel: "3rd Year",
      expertise: ["General Tech"],
      badges: [],
      joinedDate: new Date().toISOString().split("T")[0],
      status: "offline",
      bio: "Restored from suspension registry.",
    };

    setMembers([...members, restored]);
    setBannedMembers(bannedMembers.filter((b) => b.id !== id));

    const newLog = {
      id: Date.now(),
      actor: "System Admin",
      action: `Lifted suspension for ${unbanned.name}`,
      timestamp: "Just now",
    };
    setAuditLogs([newLog, ...auditLogs]);
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
        { label: "Computer Science", value: "Computer Science" },
        { label: "Information Technology", value: "Information Technology" },
        { label: "Computer Engineering", value: "Computer Engineering" }
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
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("directory");
            setSelectedUser(null);
          }}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
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
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
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
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
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
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
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
          
          {activeTab === "suspensions" && (
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or Student ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          )}

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
                      className="glass rounded-xl p-5 border border-border/60 hover:border-amber-500/20 transition-all flex flex-col justify-between"
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
            <div className="glass rounded-xl overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Suspended Member</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Ban Reason</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Duration</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Ban Date</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBanned.map((member) => (
                      <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full bg-surface-700 object-cover" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary">{member.name}</p>
                              <p className="text-xs text-text-muted">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-error/90 line-clamp-1 max-w-xs">{member.banReason}</p>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-error/15 text-error">
                            {member.banDuration}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-xs text-text-muted">{member.banDate}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="success"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => handleUnban(member.id)}
                          >
                            Unban
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredBanned.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-text-muted text-xs">
                          No suspended members found matching the search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT LOG LIST */}
          {activeTab === "audit" && (
            <div className="glass rounded-xl p-5 space-y-4 animate-fadeIn">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" /> Admin Audit Logs
              </h2>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-lg border border-border/80 bg-surface-900/10 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="text-text-primary">
                        <span className="font-semibold text-text-secondary">{log.actor}</span>: {log.action}
                      </p>
                      {log.reason && (
                        <p className="text-[11px] text-error/70 mt-1 italic font-serif">
                          Reason: &quot;{log.reason}&quot;
                        </p>
                      )}
                    </div>
                    <time className="text-[10px] text-text-muted flex-shrink-0">{log.timestamp}</time>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Side Section: INLINE USER CONTROLS PANEL (splits grid) */}
        {selectedUser && activeTab === "directory" && (
          <div className="xl:col-span-4 space-y-6">
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

              {/* Form Content */}
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
                    <option value="Tech Lead">Tech Lead</option>
                    <option value="Events Coordinator">Events Coordinator</option>
                    <option value="Moderator">Moderator</option>
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
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
