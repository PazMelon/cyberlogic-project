import { useState, useEffect } from "react";
import {
  User as UserIcon,
  Lock,
  Bell,
  Palette,
  AlertTriangle,
  Save,
  Trash2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { applyGlobalTheme } from "../utils/theme";
import { useDialog } from "../utils/useDialog";

import { useSEO } from "../utils/useSEO";

export default function Settings() {
  useSEO({
    title: "Account Settings",
    description: "Update your profile information, password, notifications, and portal theme settings.",
  });

  const { user, updateProfile, updatePassword } = useAuth();
  const { showAlert, showConfirm } = useDialog();

  // Profile Details Form States
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");

  // Edit status
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notifications Preferences (Saved in LocalStorage for mockup functionality)
  const [emailBroadcasts, setEmailBroadcasts] = useState(true);
  const [emailReplies, setEmailReplies] = useState(true);
  const [emailEvents, setEmailEvents] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  // Theme Preference
  const [theme, setTheme] = useState(() => localStorage.getItem("cl-theme") || "cyberpunk");

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setMiddleName(user.middle_name || "");
      setLastName(user.last_name || "");
      setUsername(user.username || "");
      setYearLevel(user.year_level || "");
      setDepartment(user.department || "");
      setAddress(user.address || "");
      setBirthday(user.birthday ? user.birthday.split("T")[0] : "");
      setBio(user.bio || "");
      setExpertise(user.expertise || "");

      const savedUserTheme = localStorage.getItem(`cl-theme-user-${user.id}`);
      if (savedUserTheme) {
        setTheme(savedUserTheme);
      }
    }
  }, [user]);

  // Load notifications from local storage
  useEffect(() => {
    const notifyPref = localStorage.getItem("cl-notifications");
    if (notifyPref) {
      try {
        const parsed = JSON.parse(notifyPref);
        setEmailBroadcasts(parsed.broadcasts ?? true);
        setEmailReplies(parsed.replies ?? true);
        setEmailEvents(parsed.events ?? false);
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError("First name and Last name are required.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile({
        username: username.trim() || null,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        year_level: yearLevel || null,
        department: department || null,
        address: address || null,
        birthday: birthday || null,
        bio: bio || null,
        expertise: expertise || null,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleNotificationSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifications(true);
    setNotificationSuccess(false);

    setTimeout(() => {
      localStorage.setItem(
        "cl-notifications",
        JSON.stringify({ broadcasts: emailBroadcasts, replies: emailReplies, events: emailEvents })
      );
      setNotificationSuccess(true);
      setIsSavingNotifications(false);
      setTimeout(() => setNotificationSuccess(false), 3000);
    }, 500);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyGlobalTheme(newTheme, user?.id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
          Account Settings
        </h1>
        <p className="text-xs text-text-muted mt-1.5">
          Manage your personal details, notification preferences, security keys, and UI appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Navigation Menu list */}
        <div className="space-y-1">
          <a
            href="#profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-primary transition-all"
          >
            <UserIcon className="w-4 h-4 text-primary" /> Profile Details
          </a>
          <a
            href="#security"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-accent transition-all"
          >
            <Lock className="w-4 h-4 text-accent" /> Security Credentials
          </a>
          <a
            href="#notifications"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-success transition-all"
          >
            <Bell className="w-4 h-4 text-success" /> Notifications
          </a>
          <a
            href="#appearance"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-warning transition-all"
          >
            <Palette className="w-4 h-4 text-warning" /> Theme & Appearance
          </a>
          <a
            href="#danger"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-surface-900/40 hover:bg-white/5 border border-border/40 text-text-primary hover:text-error transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-error" /> Danger Zone
          </a>
        </div>

        {/* Right Forms Content Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* PROFILE SECTION */}
          <div id="profile" className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-5 scroll-mt-20">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" /> Edit Profile Details
            </h2>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium">
                ✓ Personal profile details saved successfully.
              </div>
            )}
            {profileError && (
              <div className="p-3 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium">
                ✗ {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label htmlFor="set-fn" className="text-[10px] font-semibold text-text-secondary uppercase">First Name</label>
                  <input
                    id="set-fn"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="set-mn" className="text-[10px] font-semibold text-text-secondary uppercase">Middle Name</label>
                  <input
                    id="set-mn"
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="set-ln" className="text-[10px] font-semibold text-text-secondary uppercase">Last Name</label>
                  <input
                    id="set-ln"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="set-username" className="text-[10px] font-semibold text-text-secondary uppercase">Username / Nickname (No spaces)</label>
                <input
                  id="set-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                  placeholder="e.g. pazmelon"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  maxLength={50}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="set-email" className="text-[10px] font-semibold text-text-secondary uppercase">Email Address</label>
                  <input
                    id="set-email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800/40 border border-border text-xs text-text-muted cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="set-sid" className="text-[10px] font-semibold text-text-secondary uppercase">Student ID</label>
                  <input
                    id="set-sid"
                    type="text"
                    value={user?.school_id || ""}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800/40 border border-border text-xs text-text-muted cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label htmlFor="set-year" className="text-[10px] font-semibold text-text-secondary uppercase">Year Level</label>
                  <select
                    id="set-year"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="set-dept" className="text-[10px] font-semibold text-text-secondary uppercase">Department</label>
                  <select
                    id="set-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="">Select Dept</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Teacher Education">Teacher Education</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Criminal Justice Education">Criminal Justice Education</option>
                    <option value="Hospitality Management">Hospitality Management</option>
                    <option value="RVM-TTP">RVM-TTP</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="set-bday" className="text-[10px] font-semibold text-text-secondary uppercase">Birthday</label>
                  <input
                    id="set-bday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="set-addr" className="text-[10px] font-semibold text-text-secondary uppercase">Address Details</label>
                <input
                  id="set-addr"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House No, Street, City, Province"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="set-exp" className="text-[10px] font-semibold text-text-secondary uppercase">Expertise & Skills</label>
                <input
                  id="set-exp"
                  type="text"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="Network Security, Ethical Hacking, Python"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="set-bio" className="text-[10px] font-semibold text-text-secondary uppercase">Bio Details</label>
                <textarea
                  id="set-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {isSavingProfile ? "Saving..." : "Save details"}
                </button>
              </div>
            </form>
          </div>

          {/* SECURITY SECTION */}
          <div id="security" className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-5 scroll-mt-20">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" /> Security Credentials
            </h2>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium">
                ✓ Password changed successfully!
              </div>
            )}
            {passwordError && (
              <div className="p-3 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium">
                ✗ {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="set-currpass" className="text-[10px] font-semibold text-text-secondary uppercase">Current Password</label>
                <input
                  id="set-currpass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="set-newpass" className="text-[10px] font-semibold text-text-secondary uppercase">New Password</label>
                  <input
                    id="set-newpass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="set-confpass" className="text-[10px] font-semibold text-text-secondary uppercase">Confirm New Password</label>
                  <input
                    id="set-confpass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary border border-border text-xs font-semibold transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-accent" /> {isChangingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </div>

          {/* NOTIFICATIONS SECTION */}
          <div id="notifications" className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-5 scroll-mt-20">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Bell className="w-4 h-4 text-success" /> Notification Preferences
            </h2>

            {notificationSuccess && (
              <div className="p-3 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium">
                ✓ Notification settings updated successfully.
              </div>
            )}

            <form onSubmit={handleNotificationSave} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailBroadcasts}
                    onChange={(e) => setEmailBroadcasts(e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">Official Announcements</span>
                    <span className="text-[10px] text-text-muted block mt-0.5 leading-normal">
                      Receive instant email alerts whenever a new official broadcast is pinned or published by directors.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailReplies}
                    onChange={(e) => setEmailReplies(e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">Forum replies</span>
                    <span className="text-[10px] text-text-muted block mt-0.5 leading-normal">
                      Notify me via email when another club member replies or comments in a forum thread I created.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEvents}
                    onChange={(e) => setEmailEvents(e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">Event Reminders</span>
                    <span className="text-[10px] text-text-muted block mt-0.5 leading-normal">
                      Send me reminder alerts 24 hours prior to launch for events that I RSVP'd to.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingNotifications}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary border border-border text-xs font-semibold transition-all cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-success" /> {isSavingNotifications ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>

          {/* APPEARANCE SECTION */}
          <div id="appearance" className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-5 scroll-mt-20">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Palette className="w-4 h-4 text-warning" /> Theme & Interface Appearance
            </h2>

            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Choose a visual theme profile that fits your aesthetic. Changes will apply instantly across the session.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Dark Themes */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("cyberpunk")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "cyberpunk"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">👾 Cyberpunk Neon</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Futuristic dark slate, vibrant gradients, and gridlines.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("matrix")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "matrix"
                      ? "border-success bg-success/10"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">📟 Neon Matrix</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Carbon black backgrounds with digital green glows.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("slate")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "slate"
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🌌 Slate Space</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Minimalist deep space navy with silver lines and soft glows.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("glass")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "glass"
                      ? "border-info bg-info/10"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">💎 Glassmorphism</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Rich translucent containers and colorful backgrounds.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("maroon-spider")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "maroon-spider"
                      ? "border-rose-900 bg-rose-950/20 text-rose-800"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🕷️ Maroon Spider (Dark)</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Dark mode. Velvet black surfaces with crimson web lines and deep maroon details.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark-pink")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "dark-pink"
                      ? "border-pink-400 bg-pink-950/20 text-pink-400"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🌺 Dark Pink</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Dark mode. Black-cherry background with hot pink highlights and rose details.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark-orange")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "dark-orange"
                      ? "border-orange-400 bg-orange-950/20 text-orange-400"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🔥 Dark Orange</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Dark mode. Ember charcoal background with glowing orange accents.</span>
                </button>

                {/* Light Themes */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("light-classic")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "light-classic"
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">☀️ Classic Light</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Washed slate surfaces, warm amber accents, and indigo details.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("light-neo")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "light-neo"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">⚡ Neon Light</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Crisp neutral white with electric cyan lines and hot pink glows.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("light-mint")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "light-mint"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🍃 Mint Light</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Soothing mint base, deep forest text, and vibrant emerald accents.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("light-lavender")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "light-lavender"
                      ? "border-purple-500 bg-purple-500/10 text-purple-500"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🦄 Lavender Mist</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Soft purple base, lavender mist cards, and orchid accents.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("light-retro")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "light-retro"
                      ? "border-amber-700 bg-amber-700/10 text-amber-700"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">📜 Sand Retro</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Warm sand cream backgrounds, sepia text, and deep amber highlights.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("maroon-spider-light")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "maroon-spider-light"
                      ? "border-rose-900 bg-rose-50/25 text-rose-850"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🕷️ Maroon Spider (Light)</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Light mode. Soft rose-tinted surfaces with deep maroon outlines and crimson details.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("light-neon-pink")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "light-neon-pink"
                      ? "border-pink-500 bg-pink-500/10 text-pink-500"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">⚡ Neon Pink Light</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Light mode. Crisp neutral white with electric pink lines and hot cyan glows.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("light-pink")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "light-pink"
                      ? "border-pink-500 bg-pink-500/10 text-pink-500"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🌸 Light Pink</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Soft rose light background with warm pink accents and deep burgundy text.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("light-orange")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    theme === "light-orange"
                      ? "border-orange-500 bg-orange-500/10 text-orange-500"
                      : "border-border hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-text-primary block">🍊 Light Orange</span>
                  <span className="text-[9px] text-text-muted mt-0.5 block">Soft orange cream light background with warm citrus highlights and brown text.</span>
                </button>
              </div>
            </div>
          </div>

          {/* DANGER ZONE SECTION */}
          <div id="danger" className="glass rounded-2xl p-5 sm:p-6 border border-error/20 bg-error/5 space-y-4 scroll-mt-20">
            <h2 className="text-base font-bold text-error flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" /> Danger Zone
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Once you terminate your membership, all active event RSVPs, CTF leaderboard scores, and portal forum posts will be permanently unlinked or deleted.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await showConfirm({
                    title: "Deactivate Account",
                    message: "Are you absolutely sure you want to deactivate your Cyberlogic Portal account? This operation is irreversible.",
                    type: "danger",
                    confirmText: "Deactivate",
                  });
                  if (confirmed) {
                    showAlert({
                      title: "Request Submitted",
                      message: "Account deactivation requested. Please coordinate with a Club Administrator to finalize deletion.",
                      type: "info",
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-error hover:bg-error/90 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Deactivate Account
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
