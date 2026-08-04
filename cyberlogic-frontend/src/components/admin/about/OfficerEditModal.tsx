import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, UserCheck, Shield, Search, Check, Building2, GraduationCap, Code2, Globe } from "lucide-react";
import { fetchMentionSuggestions, uploadOfficerAvatar } from "../../../utils/api";
import type { Officer } from "../../../utils/api";
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
  const [users, setUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [useProfileInfo, setUseProfileInfo] = useState(true);

  // Custom overrides / display states
  const [displayName, setDisplayName] = useState("");
  const [displayRole, setDisplayRole] = useState("");
  const [displayDepartment, setDisplayDepartment] = useState("");
  const [displayYearLevel, setDisplayYearLevel] = useState("");
  const [displayBio, setDisplayBio] = useState("");
  const [displayAvatar, setDisplayAvatar] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");

  // Digital Presence States
  const [displayGithub, setDisplayGithub] = useState("");
  const [displayLinkedin, setDisplayLinkedin] = useState("");
  const [displayFacebook, setDisplayFacebook] = useState("");
  const [displayInstagram, setDisplayInstagram] = useState("");
  const [displayWechat, setDisplayWechat] = useState("");
  const [displayTiktok, setDisplayTiktok] = useState("");
  const [displayTwitter, setDisplayTwitter] = useState(""); // X
  const [displayReddit, setDisplayReddit] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Load members directory for officer account linking
      const loadUsers = async () => {
        try {
          setIsLoadingUsers(true);
          const data = await fetchMentionSuggestions();
          setUsers(data || []);
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
        setDisplayDepartment(officer.display_department || "");
        setDisplayYearLevel(officer.display_year_level || "");
        setDisplayBio(officer.display_bio || "");
        setDisplayAvatar(officer.display_avatar || "");
        setDisplayEmail(officer.display_email || "");
        setDisplayGithub(officer.display_github || "");
        setDisplayLinkedin(officer.display_linkedin || "");
        setDisplayFacebook(officer.display_facebook || "");
        setDisplayInstagram(officer.display_instagram || "");
        setDisplayWechat(officer.display_wechat || "");
        setDisplayTiktok(officer.display_tiktok || "");
        setDisplayTwitter(officer.display_twitter || "");
        setDisplayReddit(officer.display_reddit || "");
      } else {
        // Reset form for creating
        setUserId(null);
        setUseProfileInfo(true);
        setDisplayName("");
        setDisplayRole("");
        setDisplayDepartment("");
        setDisplayYearLevel("");
        setDisplayBio("");
        setDisplayAvatar("");
        setDisplayEmail("");
        setDisplayGithub("");
        setDisplayLinkedin("");
        setDisplayFacebook("");
        setDisplayInstagram("");
        setDisplayWechat("");
        setDisplayTiktok("");
        setDisplayTwitter("");
        setDisplayReddit("");
      }
      setSearchQuery("");
      setIsDropdownOpen(false);
    }
  }, [isOpen, officer]);

  // Click outside listener for user autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.year_level?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  if (!isOpen) return null;

  // Find currently selected user to show profile preview when useProfileInfo is active
  const selectedUser = users.find((u) => u.id === userId);

  const handleSelectUser = (u: any) => {
    setUserId(u.id);
    setUseProfileInfo(true);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handleClearUser = () => {
    setUserId(null);
    setUseProfileInfo(false);
    setSearchQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Partial<Officer> = {
      user_id: userId,
      use_profile_info: useProfileInfo,
      display_name: useProfileInfo ? null : displayName.trim() || null,
      display_role: useProfileInfo ? null : displayRole.trim() || null,
      display_department: useProfileInfo ? null : displayDepartment.trim() || null,
      display_year_level: useProfileInfo ? null : displayYearLevel.trim() || null,
      display_bio: useProfileInfo ? null : displayBio.trim() || null,
      display_avatar: displayAvatar.trim() || null,
      display_email: useProfileInfo ? null : displayEmail.trim() || null,
      display_github: displayGithub.trim() || null,
      display_linkedin: displayLinkedin.trim() || null,
      display_facebook: displayFacebook.trim() || null,
      display_instagram: displayInstagram.trim() || null,
      display_wechat: displayWechat.trim() || null,
      display_tiktok: displayTiktok.trim() || null,
      display_twitter: displayTwitter.trim() || null,
      display_reddit: displayReddit.trim() || null,
    };

    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-surface-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl glass rounded-3xl border border-border/80 shadow-2xl overflow-hidden animate-fadeIn my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/40 flex justify-between items-center bg-surface-900/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-lg font-bold text-text-primary">
              {officer ? "Configure Officer Profile & Digital Presence" : "Add New Officer"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-800 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Search & Link Member Account Section */}
          <div className="space-y-4 bg-surface-900/40 p-4 rounded-2xl border border-border/30">
            <div>
              <h3 className="text-xs font-bold text-text-primary">Link to Registered Member Account (Searchable)</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Search and select a member to automatically sync their avatar, role position, department/course, year level, bio, and core technical skills.
              </p>
            </div>

            <div className="relative space-y-2" ref={dropdownRef}>
              <label className="text-[10px] font-semibold text-text-secondary block">Search Member Account</label>
              
              {selectedUser ? (
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-primary/30 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-text-primary truncate">{selectedUser.name}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-primary/20 text-primary uppercase tracking-wider">
                            {selectedUser.admin_position || selectedUser.role || "Officer"}
                          </span>
                        </div>
                        <span className="text-xs text-primary font-medium block truncate">{selectedUser.email}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearUser}
                      className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
                      title="Unlink Member Account"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Automatically Fetched Profile Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-primary/20">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="font-semibold text-text-muted">Department/Course:</span>
                      <span className="text-text-primary font-medium truncate">{selectedUser.department || "Not specified"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="font-semibold text-text-muted">Year Standing:</span>
                      <span className="text-text-primary font-medium truncate">{selectedUser.year_level || "Not specified"}</span>
                    </div>
                  </div>

                  {/* Biography */}
                  {selectedUser.bio && (
                    <div className="text-[11px] text-text-muted italic bg-surface-900/60 p-2.5 rounded-xl border border-border/40 line-clamp-2">
                      "{selectedUser.bio}"
                    </div>
                  )}

                  {/* Core Technical Skills */}
                  {Array.isArray(selectedUser.expertise) && selectedUser.expertise.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <Code2 className="w-3 h-3 text-emerald-400" />
                        Core Technical Skills
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedUser.expertise.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    placeholder={isLoadingUsers ? "Loading members directory..." : "Search member by name, email, department, or year..."}
                    disabled={isLoadingUsers}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  />

                  {/* Autocomplete Search Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto bg-surface-900 border border-border/80 rounded-2xl shadow-xl z-20 space-y-1 p-1">
                      {filteredUsers.length === 0 ? (
                        <div className="py-4 text-center text-xs text-text-muted">
                          No member found matching "{searchQuery}".
                        </div>
                      ) : (
                        filteredUsers.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectUser(u)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-800 transition-colors text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-border/60 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors block truncate">
                                  {u.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-text-muted truncate">
                                  <span>{u.email}</span>
                                  {u.department && <span className="text-accent font-medium">• {u.department}</span>}
                                  {u.year_level && <span>({u.year_level})</span>}
                                </div>
                              </div>
                            </div>
                            <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {userId && (
                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-text-secondary select-none">
                    <input
                      type="checkbox"
                      checked={useProfileInfo}
                      onChange={(e) => setUseProfileInfo(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary bg-surface-900 focus:ring-primary/20 cursor-pointer"
                    />
                    Automatically sync member profile information (Avatar, Role, Department, Year, Bio, Skills)
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Custom Overrides & Details Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-text-primary">
                Configure Officer Details & Custom Overrides
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Set custom display details including role position, department, year level, bio, and picture override.
              </p>
            </div>

            {/* Avatar Upload (Admin Picture Override) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <ImageUploadZone
                  value={displayAvatar || (useProfileInfo && selectedUser ? selectedUser.avatar : "")}
                  onChange={(url) => setDisplayAvatar(url)}
                  uploadFn={uploadOfficerAvatar}
                  aspectHint="Square avatar: 1:1 ratio"
                  label="Display Picture (Admin Override)"
                />
                {displayAvatar && (
                  <button
                    type="button"
                    onClick={() => setDisplayAvatar("")}
                    className="w-full text-center text-[10px] font-semibold text-rose-400 hover:underline cursor-pointer"
                  >
                    Reset picture to synced member avatar
                  </button>
                )}
                {useProfileInfo && !!userId && !displayAvatar && (
                  <span className="text-[10px] text-emerald-400 font-medium block text-center">
                    ✓ Currently showing synced member profile picture. Upload above to override.
                  </span>
                )}
              </div>

              <div className={`md:col-span-2 space-y-4 transition-opacity duration-300 ${useProfileInfo && userId ? "opacity-60 pointer-events-none select-none" : ""}`}>
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

                {/* Department & Year Level Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-text-secondary flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-primary" />
                      <span>Department / Course</span>
                    </label>
                    <input
                      type="text"
                      disabled={useProfileInfo && !!userId}
                      value={useProfileInfo && selectedUser ? (selectedUser.department || "") : displayDepartment}
                      onChange={(e) => setDisplayDepartment(e.target.value)}
                      placeholder="e.g. Computer Studies (BSCS)"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-text-secondary flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-amber-400" />
                      <span>Year Level / Standing</span>
                    </label>
                    <select
                      disabled={useProfileInfo && !!userId}
                      value={useProfileInfo && selectedUser ? (selectedUser.year_level || "") : displayYearLevel}
                      onChange={(e) => setDisplayYearLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Select Year Level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
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
          </div>

          {/* Digital Presence / Social Links Section */}
          <div className="space-y-4 border-t border-border/30 pt-4">
            <div>
              <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-accent" />
                <span>Digital Presence & Social Profiles</span>
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Configure officer links for Facebook, Instagram, WeChat, TikTok, X (Twitter), Reddit, GitHub, and LinkedIn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-secondary block">Facebook</label>
                <input
                  type="text"
                  value={displayFacebook}
                  onChange={(e) => setDisplayFacebook(e.target.value)}
                  placeholder="facebook.com/username"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-secondary block">Instagram</label>
                <input
                  type="text"
                  value={displayInstagram}
                  onChange={(e) => setDisplayInstagram(e.target.value)}
                  placeholder="instagram.com/username"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-secondary block">WeChat</label>
                <input
                  type="text"
                  value={displayWechat}
                  onChange={(e) => setDisplayWechat(e.target.value)}
                  placeholder="WeChat ID or link"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-secondary block">TikTok</label>
                <input
                  type="text"
                  value={displayTiktok}
                  onChange={(e) => setDisplayTiktok(e.target.value)}
                  placeholder="tiktok.com/@username"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-secondary block">X (Twitter)</label>
                <input
                  type="text"
                  value={displayTwitter}
                  onChange={(e) => setDisplayTwitter(e.target.value)}
                  placeholder="x.com/username"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-secondary block">Reddit</label>
                <input
                  type="text"
                  value={displayReddit}
                  onChange={(e) => setDisplayReddit(e.target.value)}
                  placeholder="reddit.com/user/username"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-secondary block">GitHub</label>
                <input
                  type="text"
                  value={displayGithub}
                  onChange={(e) => setDisplayGithub(e.target.value)}
                  placeholder="github.com/username"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-secondary block">LinkedIn</label>
                <input
                  type="text"
                  value={displayLinkedin}
                  onChange={(e) => setDisplayLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-900 border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-all"
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
