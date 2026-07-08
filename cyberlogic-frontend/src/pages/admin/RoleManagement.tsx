import {
  Shield,
  Users,
  ShieldCheck,
  Award,
  Check,
  Save,
  Loader2,
  AlertCircle,
  ChevronRight,
  Info,
  User,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  fetchUsers,
  fetchPermissions,
  updateUserPosition,
  updateUserPermissions,
  type Permission,
} from "../../utils/api";
import { Button, Card, Badge } from "../../components/ui";

const POSITION_OPTIONS = [
  "President",
  "Vice President",
  "Secretary",
  "Auditor",
  "Treasurer",
  "PIO",
  "1st Year Representative",
  "2nd Year Representative",
  "3rd Year Representative",
  "4th Year Representative",
];

export default function RoleManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userPermissions, setUserPermissions] = useState<number[]>([]);
  const [userPosition, setUserPosition] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allUsers, allPermissions] = await Promise.all([
        fetchUsers(),
        fetchPermissions(),
      ]);
      // Filter to only show admins (exclude superadmin because superadmin has bypass and can't be customized)
      const adminUsers = allUsers.filter(
        (u: any) => u.role === "admin" && u.status === "approved"
      );
      setUsers(adminUsers);
      setPermissions(allPermissions);

      if (adminUsers.length > 0) {
        selectUser(adminUsers[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setUserPosition(user.admin_position || "");
    
    // Find permission IDs for the selected user
    // The user's permission_keys lists the key strings, we need to map them to permission IDs
    const permIds = permissions
      .filter((p) => user.permission_keys?.includes(p.key))
      .map((p) => p.id);
    
    setUserPermissions(permIds);
    setSuccessMessage(null);
    setError(null);
  };

  const handleTogglePermission = (permissionId: number) => {
    setUserPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const applyPreset = (presetName: string) => {
    if (!selectedUser) return;
    
    let keysToGrant: string[] = [];

    switch (presetName) {
      case "President":
        keysToGrant = permissions.map((p) => p.key);
        setUserPosition("President");
        break;
      case "Vice President":
        // Everything except manage_users
        keysToGrant = permissions
          .filter((p) => p.key !== "manage_users")
          .map((p) => p.key);
        setUserPosition("Vice President");
        break;
      case "Content Manager":
        // Announcements, blogs, events, resources
        keysToGrant = [
          "view_admin_dashboard",
          "manage_announcements",
          "manage_blogs",
          "manage_events",
          "manage_resources",
        ];
        break;
      case "Moderator":
        // Forums, Chat channels
        keysToGrant = [
          "view_admin_dashboard",
          "manage_forums",
          "manage_chat",
        ];
        break;
      default:
        break;
    }

    const ids = permissions.filter((p) => keysToGrant.includes(p.key)).map((p) => p.id);
    setUserPermissions(ids);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Save Position
      await updateUserPosition(selectedUser.id, userPosition || null);
      // 2. Save Permissions
      await updateUserPermissions(selectedUser.id, userPermissions);

      setSuccessMessage(`Successfully updated role & permissions for ${selectedUser.name}!`);
      
      // Update local users array state to reflect changes without a full page reload
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === selectedUser.id) {
            const updatedKeys = permissions
              .filter((p) => userPermissions.includes(p.id))
              .map((p) => p.key);
            return {
              ...u,
              admin_position: userPosition || null,
              permission_keys: updatedKeys,
            };
          }
          return u;
        })
      );

      // Also update selectedUser reference
      setSelectedUser((prev: any) => ({
        ...prev,
        admin_position: userPosition || null,
        permission_keys: permissions
          .filter((p) => userPermissions.includes(p.id))
          .map((p) => p.key),
      }));

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Group permissions by category/group
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.group]) {
      acc[perm.group] = [];
    }
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-text-secondary">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wider animate-pulse">
          INITIALIZING RBAC OVERVIEW...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            Role & Permissions Manager
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Configure custom admin positions and granular system access rights.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-error/20 bg-error/5 text-error text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Operation Error:</span> {error}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-success/20 bg-success/5 text-success text-sm flex items-start gap-2.5 animate-fadeIn">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 font-medium">{successMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Admins list */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 border border-border/80 bg-surface-900/60 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/55">
              <Users className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Admin Officer Roster ({users.length})
              </h2>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <User className="w-8 h-8 mx-auto text-text-muted/40" />
                <p className="text-xs text-text-muted">No admin users found.</p>
                <p className="text-[10px] text-text-muted/65 leading-relaxed max-w-[200px] mx-auto">
                  Assign a user the "Admin" role in Member Management first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                      selectedUser?.id === user.id
                        ? "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/40 text-text-primary"
                        : "bg-surface-800/45 border-transparent hover:border-border/50 text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full bg-surface-700 object-cover flex-shrink-0 border border-border/80"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                          {user.admin_position || "No Position Assigned"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        selectedUser?.id === user.id
                          ? "translate-x-0.5 text-amber-400"
                          : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Selected Admin customizer */}
        <div className="lg:col-span-8 space-y-6">
          {selectedUser ? (
            <Card className="p-5 border border-border/80 bg-surface-900/60 backdrop-blur-md space-y-6">
              {/* Selected User Header Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-surface-950/40">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-full border-2 border-amber-500/30 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-bold text-text-primary truncate">
                      {selectedUser.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="accent" className="text-[10px] tracking-wide py-0.5 uppercase">
                        Admin
                      </Badge>
                      <span className="text-xs text-text-muted truncate">
                        {selectedUser.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-text-muted">
                    Granted Permissions:
                  </span>
                  <Badge variant="neutral" className="border-amber-500/30 text-amber-400 text-xs font-bold">
                    {userPermissions.length} / {permissions.length}
                  </Badge>
                </div>
              </div>

              {/* Position and Presets Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Admin Position Title
                  </label>
                  <select
                    value={userPosition}
                    onChange={(e) => setUserPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-850 border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                  >
                    <option value="">-- No Position Title --</option>
                    {POSITION_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Apply Access Preset
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset("President")}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 transition-all cursor-pointer"
                    >
                      President
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("Vice President")}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 transition-all cursor-pointer"
                    >
                      VP
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("Content Manager")}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-border bg-surface-800 hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                    >
                      Content
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("Moderator")}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-border bg-surface-800 hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                    >
                      Mod
                    </button>
                  </div>
                </div>
              </div>

              {/* Permission Settings Matrix */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Custom Permissions Matrix
                  </h4>
                </div>

                <div className="space-y-5">
                  {Object.entries(groupedPermissions).map(([group, perms]) => (
                    <div key={group} className="space-y-2.5 p-3.5 rounded-xl border border-border/40 bg-surface-950/20">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-text-muted/75">
                        {group} Permissions
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map((p) => {
                          const isGranted = userPermissions.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleTogglePermission(p.id)}
                              className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all text-left ${
                                isGranted
                                  ? "bg-amber-500/5 border-amber-500/25 hover:border-amber-500/40 text-text-primary"
                                  : "bg-surface-850/40 border-border/30 hover:border-border/60 text-text-muted hover:text-text-secondary"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-all ${
                                  isGranted
                                    ? "bg-amber-500 border-amber-500 text-surface-950"
                                    : "border-border"
                                }`}
                              >
                                {isGranted && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold">{p.label}</p>
                                {p.description && (
                                  <p className="text-[10px] text-text-muted leading-relaxed">
                                    {p.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end pt-4 border-t border-border/35">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  variant="primary"
                  className="gap-2 cursor-pointer shadow-md shadow-amber-500/5 hover:shadow-amber-500/10"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Applying Configuration...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Access System Changes
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[30vh] border border-dashed border-border rounded-xl p-8 text-center text-text-muted">
              <Info className="w-8 h-8 text-text-muted/50 mb-2" />
              <p className="text-sm font-semibold">No Officer Selected</p>
              <p className="text-xs max-w-sm leading-relaxed mt-1">
                Select an officer from the list on the left to customize their permissions and roles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
