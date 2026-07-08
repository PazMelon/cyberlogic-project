import { useState, useEffect } from "react";
import { X, UserCheck, Shield, Upload } from "lucide-react";
import { fetchUsers, uploadOfficerAvatar } from "../../../utils/api";
import type { DbUser, Officer } from "../../../utils/api";
import ImageUploadZone from "../../ui/cms/ImageUploadZone";

interface OfficerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Officer>) => void;
  officer: Officer | null;
}

export default function OfficerEditModal({
  isOpen,
  onClose,
  onSave,
  officer,
}: OfficerEditModalProps) {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [useProfileInfo, setUseProfileInfo] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [displayRole, setDisplayRole] = useState("");
  const [displayBio, setDisplayBio] = useState("");
  const [displayAvatar, setDisplayAvatar] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [displayGithub, setDisplayGithub] = useState("");
  const [displayLinkedin, setDisplayLinkedin] = useState("");

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load users
      const loadUsers = async () => {
        try {
          setIsLoadingUsers(true);
          const data = await fetchUsers();
          setUsers(data.filter((u) => u.status === "approved"));
        } catch (err) {
          console.error("Failed to load users for officer linking", err);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      loadUsers();

      // Populate form if editing
      if (officer) {
        setUserId(officer.user_id);
        setUseProfileInfo(officer.use_profile_info);
        setDisplayName(officer.display_name || "");
        setDisplayRole(officer.display_role || "");
        setDisplayBio(officer.display_bio || "");
        setDisplayAvatar(officer.display_avatar || "");
        setDisplayEmail(officer.display_email || "");
        setDisplayGithub(officer.display_github || "");
        setDisplayLinkedin(officer.display_linkedin || "");
      } else {
        // Reset form for creating
        setUserId(null);
        setUseProfileInfo(true);
        setDisplayName("");
        setDisplayRole("");
        setDisplayBio("");
        setDisplayAvatar("");
        setDisplayEmail("");
        setDisplayGithub("");
        setDisplayLinkedin("");
      }
    }
  }, [isOpen, officer]);

  if (!isOpen) return null;

  // Find currently selected user to show profile preview when useProfileInfo is active
  const selectedUser = users.find((u) => u.id === userId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Partial<Officer> = {
      user_id: userId,
      use_profile_info: useProfileInfo,
      display_name: useProfileInfo ? null : displayName.trim() || null,
      display_role: useProfileInfo ? null : displayRole.trim() || null,
      display_bio: useProfileInfo ? null : displayBio.trim() || null,
      display_avatar: useProfileInfo ? null : displayAvatar.trim() || null,
      display_email: useProfileInfo ? null : displayEmail.trim() || null,
      display_github: useProfileInfo ? null : displayGithub.trim() || null,
      display_linkedin: useProfileInfo ? null : displayLinkedin.trim() || null,
    };

    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-surface-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl glass rounded-3xl border border-border/80 shadow-2xl overflow-hidden animate-fadeIn my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/40 flex justify-between items-center bg-surface-900/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-lg font-bold text-text-primary">
              {officer ? "Configure Officer Details" : "Add New Officer"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-800 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* User Account Link Section */}
          <div className="space-y-4 bg-surface-900/40 p-4 rounded-2xl border border-border/30">
            <div>
              <h3 className="text-xs font-bold text-text-primary">Link to Member Account (Optional)</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Connecting an officer to a user account allows their avatar, role, and details to pull directly from their registered profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-text-secondary block">Select Account</label>
                <select
                  value={userId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUserId(val ? Number(val) : null);
                    if (!val) {
                      setUseProfileInfo(false); // If no account selected, we MUST use custom overrides
                    }
                  }}
                  disabled={isLoadingUsers}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="">-- Standalone (No User Account Link) --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {userId && (
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-text-secondary select-none">
                    <input
                      type="checkbox"
                      checked={useProfileInfo}
                      onChange={(e) => setUseProfileInfo(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary bg-surface-900 focus:ring-primary/20 cursor-pointer"
                    />
                    Use account profile information
                  </label>
                </div>
              )}
            </div>

            {useProfileInfo && selectedUser && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3 animate-fadeIn">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full object-cover border border-primary/25"
                />
                <div>
                  <span className="text-xs font-bold text-text-primary block">{selectedUser.name}</span>
                  <span className="text-[10px] text-primary font-semibold tracking-wider uppercase block">
                    {selectedUser.admin_position || "Officer"}
                  </span>
                  <span className="text-[10px] text-text-muted block max-w-md line-clamp-1">{selectedUser.bio || "No bio set on profile."}</span>
                </div>
              </div>
            )}
          </div>

          {/* Overrides / Custom Profile Section */}
          <div className={`space-y-4 transition-opacity duration-300 ${useProfileInfo && userId ? "opacity-45 pointer-events-none select-none" : ""}`}>
            <div>
              <h3 className="text-xs font-bold text-text-primary">
                {useProfileInfo && userId ? "Landing Page Information (Controlled by Profile)" : "Configure Landing Page Information"}
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Set custom values to display on the landing page about section. These override the linked account profile.
              </p>
            </div>

            {/* Avatar Upload */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <ImageUploadZone
                  value={useProfileInfo && selectedUser ? selectedUser.avatar : displayAvatar}
                  onChange={(url) => setDisplayAvatar(url)}
                  uploadFn={uploadOfficerAvatar}
                  aspectHint="Square avatar: 1:1 ratio"
                  label="Display Picture"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-text-secondary block">Display Name</label>
                    <input
                      type="text"
                      required={!useProfileInfo}
                      disabled={useProfileInfo && !!userId}
                      value={useProfileInfo && selectedUser ? selectedUser.name : displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Reyes"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-text-secondary block">Display Role / Position</label>
                    <input
                      type="text"
                      required={!useProfileInfo}
                      disabled={useProfileInfo && !!userId}
                      value={useProfileInfo && selectedUser ? (selectedUser.admin_position || "Officer") : displayRole}
                      onChange={(e) => setDisplayRole(e.target.value)}
                      placeholder="e.g. Club President"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-text-secondary block">Biography</label>
                  <textarea
                    rows={3}
                    disabled={useProfileInfo && !!userId}
                    value={useProfileInfo && selectedUser ? (selectedUser.bio || "") : displayBio}
                    onChange={(e) => setDisplayBio(e.target.value)}
                    placeholder="Provide a short description of the officer..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Social Links Overrides */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/30 pt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-text-secondary block">Contact Email</label>
                <input
                  type="email"
                  disabled={useProfileInfo && !!userId}
                  value={useProfileInfo && selectedUser ? selectedUser.email : displayEmail}
                  onChange={(e) => setDisplayEmail(e.target.value)}
                  placeholder="e.g. alex@srcb.edu.ph"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-text-secondary block">GitHub URL / Handle</label>
                <input
                  type="text"
                  disabled={useProfileInfo && !!userId}
                  value={useProfileInfo && selectedUser ? `github.com/${selectedUser.name.toLowerCase().replace(/\s+/g, "")}` : displayGithub}
                  onChange={(e) => setDisplayGithub(e.target.value)}
                  placeholder="github.com/handle"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-text-secondary block">LinkedIn URL / Handle</label>
                <input
                  type="text"
                  disabled={useProfileInfo && !!userId}
                  value={useProfileInfo && selectedUser ? `linkedin.com/in/${selectedUser.name.toLowerCase().replace(/\s+/g, "")}` : displayLinkedin}
                  onChange={(e) => setDisplayLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/handle"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 bg-surface-900/10 -mx-6 -mb-6 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-800 border border-border hover:bg-surface-750 transition-all cursor-pointer text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {officer ? "Save Officer" : "Add Officer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
