import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import {
  Calendar,
  Award,
  Save,
  Shield,
  Compass,
  Mail,
  ArrowLeft,
  MessageSquare,
  Bookmark,
  User as UserIcon,
  Lock,
  MapPin,
  Cake,
  GraduationCap,
  Camera
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forumThreads } from "../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../components/Skeleton";
import { ForumThreadCard } from "../components/ui";
import { optimizeAndConvertToWebP } from "../utils/imageOptimizer";
import { uploadAvatar, fetchDirectoryMemberById, type DirectoryMember } from "../utils/api";

export default function Profile() {
  const { user, updateProfile, updatePassword, updateUser } = useAuth();
  const { userId } = useParams();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<DirectoryMember | null>(null);

  // Decide if this is the logged-in user's profile
  const isOwnProfile = !userId || parseInt(userId, 10) === user?.id;

  // Form states for Settings tab
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");

  // Edit details status
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Change password status
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Avatar upload status
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      // 1. Client-side compress and WebP convert (skips GIF canvas step automatically)
      const result = await optimizeAndConvertToWebP(file);

      // 2. Convert base64 dataURL back into a File object for multipart upload
      const secureName = file.name.substring(0, file.name.lastIndexOf('.')) || "avatar";
      const fileExt = file.type === "image/gif" ? "gif" : "webp";
      
      const dataURLtoFile = (dataurl: string, filename: string) => {
        const arr = dataurl.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/webp";
        const bstr = atob(arr[arr.length - 1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      };

      const processedFile = dataURLtoFile(result.dataUrl, `${secureName}.${fileExt}`);

      // 3. Upload WebP/GIF payload securely to backend
      const response = await uploadAvatar(processedFile);
      
      // Update auth context state
      updateUser(response.user);
    } catch (err: any) {
      console.error("Failed to upload profile picture:", err);
      setAvatarError(err.message || "Failed to upload profile picture.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Fetch targeted member details if not own profile
  useEffect(() => {
    const initProfile = async () => {
      setIsLoading(true);
      if (!isOwnProfile && userId) {
        try {
          const data = await fetchDirectoryMemberById(parseInt(userId, 10));
          setTargetUser(data);
        } catch (err) {
          console.error("Failed to load target user details:", err);
          setTargetUser(null);
        }
      } else {
        setTargetUser(null);
      }
      setIsLoading(false);
    };
    initProfile();
  }, [userId, isOwnProfile]);

  // Sync form state if user or targetUser changes
  useEffect(() => {
    if (isOwnProfile && user) {
      setFirstName(user.first_name || "");
      setMiddleName(user.middle_name || "");
      setLastName(user.last_name || "");
      setYearLevel(user.year_level || "");
      setDepartment(user.department || "");
      setAddress(user.address || "");
      setBirthday(user.birthday ? user.birthday.split("T")[0] : "");
      setBio(user.bio || "");
      setExpertise(user.expertise || "");
    } else if (targetUser) {
      const parts = targetUser.name.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setBio(targetUser.bio || "No biography provided.");
      setExpertise(targetUser.expertise ? targetUser.expertise.join(", ") : "");
      setYearLevel(targetUser.yearLevel || "");
      setDepartment(targetUser.department || "");
      setAddress(targetUser.address || "");
      setBirthday(targetUser.birthday ? targetUser.birthday.split("T")[0] : "");
    }
  }, [userId, user, isOwnProfile, targetUser]);

  const activeUser = {
    name: isOwnProfile 
      ? trimFullName(firstName, middleName, lastName) 
      : (targetUser?.name || "Unknown User"),
    avatar: isOwnProfile ? (user?.avatar || "") : (targetUser?.avatar || ""),
    role: isOwnProfile ? (user?.role || "Member") : (targetUser?.role || "Member"),
    email: isOwnProfile ? (user?.email || "") : (targetUser?.email || ""),
    joinedDate: isOwnProfile ? (user?.joinedDate || "2025-09-01") : (targetUser?.joinedDate || "2025-09-01"),
    yearLevel: isOwnProfile ? yearLevel : (targetUser?.yearLevel || ""),
    department: isOwnProfile ? department : (targetUser?.department || ""),
    address: isOwnProfile ? address : (targetUser?.address || ""),
    birthday: isOwnProfile ? birthday : (targetUser?.birthday || ""),
  };

  function trimFullName(f: string, m: string, l: string) {
    return `${f} ${m ? m + " " : ""}${l}`.trim() || "John Doe";
  }

  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "saved" | "settings">("overview");

  // Sync tab status with URL query parameter
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tabParam = query.get("tab");
    if (tabParam === "settings" && isOwnProfile) {
      setActiveTab("settings");
    } else if (tabParam === "saved" && isOwnProfile) {
      setActiveTab("saved");
    } else if (tabParam === "posts") {
      setActiveTab("posts");
    } else {
      setActiveTab("overview");
    }
  }, [location.search, isOwnProfile]);

  // Get forum activity posts by the user
  const userPosts = forumThreads.filter((t) => t.author === activeUser.name);

  // Get saved threads
  const savedThreads = forumThreads.slice(1, 3); // mock saved

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setSaveError("First Name and Last Name are required.");
      return;
    }

    setIsSavingDetails(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
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
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error("Failed to update profile details:", err);
      setSaveError(err.message || "Failed to update profile details.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
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
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error("Failed to change password:", err);
      setPasswordError(err.message || "Failed to change password. Double check current password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Navigation Link for directory member detail profile */}
      {userId && (
        <Link
          to="/app/directory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors bg-surface-900/40 px-3 py-1.5 rounded-lg border border-border"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Navigation Tabs & Tab contents */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1 animate-fadeIn">
          
          {/* Tabs header */}
          <div className="flex bg-surface-900/30 p-1.5 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                activeTab === "overview"
                  ? "bg-surface-800 border border-border text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                activeTab === "posts"
                  ? "bg-surface-800 border border-border text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              posts
            </button>
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("saved")}
                  className={`flex-1 py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                    activeTab === "saved"
                      ? "bg-surface-800 border border-border text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  saved
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                    activeTab === "settings"
                      ? "bg-surface-800 border border-border text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  settings
                </button>
              </>
            )}
          </div>

          {/* Tab Content Areas */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="glass rounded-xl p-5 space-y-4">
                <SkeletonLine widthClass="w-1/4" heightClass="h-4.5" />
                <div className="space-y-2 pt-2">
                  <SkeletonLine widthClass="w-full" heightClass="h-4" />
                  <SkeletonLine widthClass="w-5/6" heightClass="h-4" />
                </div>
              </div>
              <div className="glass rounded-xl p-5 space-y-4">
                <SkeletonLine widthClass="w-1/3" heightClass="h-4.5" />
                <SkeletonLine widthClass="w-full" heightClass="h-20" />
              </div>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Profile Bio summary for mobile/tablet */}
                  <div className="lg:hidden glass rounded-2xl p-5 space-y-3">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">About</h2>
                    <p className="text-xs text-text-secondary leading-relaxed">{bio}</p>
                  </div>

                  {/* Recent Posts Feed in Overview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <Compass className="w-4 h-4 text-primary" /> Overview Activity
                      </h2>
                    </div>
                    
                    <div className="space-y-3">
                      {userPosts.slice(0, 2).map((thread) => (
                        <ForumThreadCard key={thread.id} thread={thread} mode="compact" />
                      ))}
                      {userPosts.length === 0 && (
                        <div className="glass rounded-xl p-6 text-center text-text-muted text-xs">
                          No forum activities posted by this member.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expertise Skills inside Overview */}
                  <div className="glass rounded-2xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" /> Expertises & Fields
                    </h2>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {expertise.split(",").map((exp) => exp.trim()).filter(Boolean).map((exp) => (
                        <span
                          key={exp}
                          className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary font-medium animate-fadeIn"
                        >
                          {exp}
                        </span>
                      ))}
                      {!expertise.trim() && (
                        <span className="text-xs text-text-muted">No expertise listed.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* POSTS TAB */}
              {activeTab === "posts" && (
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Forum Threads Created
                  </h2>
                  <div className="space-y-3">
                    {userPosts.map((thread) => (
                      <ForumThreadCard key={thread.id} thread={thread} />
                    ))}
                    {userPosts.length === 0 && (
                      <div className="glass rounded-xl p-6 text-center text-text-muted text-xs">
                        No forum threads created by this member.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SAVED THREADS TAB */}
              {activeTab === "saved" && isOwnProfile && (
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-primary" /> Bookmarked Threads
                  </h2>
                  <div className="space-y-3">
                    {savedThreads.map((thread) => (
                      <ForumThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === "settings" && isOwnProfile && (
                <div className="space-y-6">
                  
                  {/* Profile Details Form */}
                  <div className="glass rounded-2xl p-5 sm:p-6 space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] mb-1 flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4 text-primary" /> Profile Details
                      </h2>
                      <p className="text-xs text-text-muted">Update your display information, course details, and biography fields.</p>
                    </div>

                    {saveSuccess && (
                      <div className="p-3.5 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium animate-fadeIn">
                        ✓ Profile details updated successfully!
                      </div>
                    )}
                    
                    {saveError && (
                      <div className="p-3.5 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
                        ✗ {saveError}
                      </div>
                    )}

                    <form onSubmit={handleSaveDetails} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="p-first-name" className="text-xs font-semibold text-text-secondary">First Name</label>
                          <input
                            id="p-first-name"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="p-middle-name" className="text-xs font-semibold text-text-secondary">Middle Name</label>
                          <input
                            id="p-middle-name"
                            type="text"
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="p-last-name" className="text-xs font-semibold text-text-secondary">Last Name</label>
                          <input
                            id="p-last-name"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="p-email" className="text-xs font-semibold text-text-secondary">Email Address</label>
                          <input
                            id="p-email"
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-4 py-2 rounded-xl bg-surface-800/40 border border-border text-sm text-text-muted cursor-not-allowed focus:outline-none text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="p-school-id" className="text-xs font-semibold text-text-secondary">School Student ID</label>
                          <input
                            id="p-school-id"
                            type="text"
                            value={user?.school_id || ""}
                            disabled
                            className="w-full px-4 py-2 rounded-xl bg-surface-800/40 border border-border text-sm text-text-muted cursor-not-allowed focus:outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="p-year-level" className="text-xs font-semibold text-text-secondary">Year Level</label>
                          <select
                            id="p-year-level"
                            value={yearLevel}
                            onChange={(e) => setYearLevel(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
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
                        <div className="space-y-1.5">
                          <label htmlFor="p-dept" className="text-xs font-semibold text-text-secondary">Course / Department</label>
                          <select
                            id="p-dept"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                          >
                            <option value="">Select Department</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Computer Engineering">Computer Engineering</option>
                            <option value="Information Systems">Information Systems</option>
                            <option value="Other">Other Major</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="p-birthday" className="text-xs font-semibold text-text-secondary">Birthday</label>
                          <input
                            id="p-birthday"
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="p-address" className="text-xs font-semibold text-text-secondary">Address Details</label>
                        <input
                          id="p-address"
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="House No, Street, City, Province"
                          className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="p-expertise" className="text-xs font-semibold text-text-secondary">Skills & Expertises (comma separated)</label>
                        <input
                          id="p-expertise"
                          type="text"
                          value={expertise}
                          onChange={(e) => setExpertise(e.target.value)}
                          placeholder="e.g. Penetration Testing, Python, Crypto"
                          className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="p-bio" className="text-xs font-semibold text-text-secondary">About Info</label>
                        <textarea
                          id="p-bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          placeholder="Tell members about yourself..."
                          className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none text-xs"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSavingDetails}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" /> 
                          {isSavingDetails ? "Saving..." : "Save Details"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Account Security Change Password Form */}
                  <div className="glass rounded-2xl p-5 sm:p-6 space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] mb-1 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-accent" /> Change Password
                      </h2>
                      <p className="text-xs text-text-muted">Ensure your account is protected by updating your security key credentials.</p>
                    </div>

                    {passwordSuccess && (
                      <div className="p-3.5 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium animate-fadeIn">
                        ✓ Password updated successfully!
                      </div>
                    )}

                    {passwordError && (
                      <div className="p-3.5 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
                        ✗ {passwordError}
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="sec-curr" className="text-xs font-semibold text-text-secondary">Current Password</label>
                        <input
                          id="sec-curr"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="sec-new" className="text-xs font-semibold text-text-secondary">New Password</label>
                          <input
                            id="sec-new"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="sec-conf" className="text-xs font-semibold text-text-secondary">Confirm New Password</label>
                          <input
                            id="sec-conf"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary border border-border text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Lock className="w-4 h-4 text-accent" />
                          {isChangingPassword ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
          <div className="glass rounded-2xl overflow-hidden border border-border sticky top-20">
            {/* Banner Background */}
            <div className="h-24 bg-gradient-to-r from-primary/45 to-accent/35 relative">
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Content Body */}
            <div className="px-5 pb-5 pt-0 relative">
              {isLoading ? (
                <div className="space-y-4 animate-pulse relative">
                  <div className="relative -mt-12 mb-3 inline-block">
                    <SkeletonCircle className="w-20 h-20 border-4 border-surface-950 bg-surface-800" />
                  </div>
                  <SkeletonLine widthClass="w-2/3" heightClass="h-4.5" />
                  <SkeletonLine widthClass="w-1/3" heightClass="h-3" />
                  <SkeletonLine widthClass="w-full" heightClass="h-3" />
                  <SkeletonLine widthClass="w-full" heightClass="h-3" />
                </div>
              ) : (
                <>
                  {/* Avatar position overlapping banner */}
                  <div className="relative -mt-12 mb-3 inline-block group">
                    <img
                      src={activeUser.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${activeUser.name}`}
                      alt={activeUser.name}
                      className={`w-20 h-20 rounded-full border-4 border-surface-950 bg-surface-800 shadow-lg object-cover transition-opacity duration-200 ${
                        isUploadingAvatar ? "opacity-40 animate-pulse" : ""
                      }`}
                    />
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success border-2 border-surface-950" />
                    
                    {/* Upload overlay (own profile only) */}
                    {isOwnProfile && (
                      <label 
                        className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10"
                        title="Upload Profile Picture"
                      >
                        {isUploadingAvatar ? (
                          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-5 h-5 text-white" />
                            <span className="text-[9px] text-white/90 font-semibold mt-0.5">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleAvatarUpload}
                          disabled={isUploadingAvatar}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  {avatarError && (
                    <div className="text-[10px] text-error font-medium mt-1 mb-2 text-center max-w-[200px]">
                      ✗ {avatarError}
                    </div>
                  )}

                  {/* Identity */}
                  <div>
                    <h3 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] leading-tight">
                      {activeUser.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      u/{activeUser.name.toLowerCase().replace(/\s+/g, "")}
                    </p>
                  </div>

                  {/* Status roles and details */}
                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs font-semibold text-text-secondary capitalize">{activeUser.role}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-xs text-text-muted truncate">{activeUser.email || "No email listed"}</span>
                    </div>

                    {activeUser.department && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-warning flex-shrink-0" />
                        <span className="text-xs text-text-muted truncate">
                          {activeUser.yearLevel ? `${activeUser.yearLevel} — ` : ""}{activeUser.department}
                        </span>
                      </div>
                    )}

                    {activeUser.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-error flex-shrink-0" />
                        <span className="text-xs text-text-muted truncate">{activeUser.address}</span>
                      </div>
                    )}

                    {activeUser.birthday && (
                      <div className="flex items-center gap-2">
                        <Cake className="w-4 h-4 text-info flex-shrink-0" />
                        <span className="text-xs text-text-muted">Born: {activeUser.birthday}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-xs text-text-muted">Joined: {activeUser.joinedDate}</span>
                    </div>
                  </div>

                  {/* Karma metrics */}
                  <div className="grid grid-cols-2 gap-4 py-3 my-4 border-y border-border">
                    <div>
                      <span className="text-[10px] text-text-muted block font-semibold uppercase">Reputation</span>
                      <span className="text-sm font-bold text-text-primary">1,482 points</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block font-semibold uppercase">Engagement</span>
                      <span className="text-sm font-bold text-text-primary">Top 5%</span>
                    </div>
                  </div>

                  {/* About Bio snippet on card */}
                  <div className="space-y-1.5 pt-1.5 text-xs text-text-secondary">
                    <p className="font-semibold text-text-primary uppercase text-[9px] tracking-wide">Bio</p>
                    <p className="leading-relaxed bg-surface-900/30 p-2.5 rounded-lg border border-border/40 whitespace-pre-wrap">
                      {bio || "No biography details added yet."}
                    </p>
                  </div>

                  {/* Settings quick shortcut link */}
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="w-full mt-4 py-2 text-center text-xs font-bold bg-surface-800 hover:bg-surface-700 text-text-primary border border-border rounded-xl transition-all cursor-pointer"
                    >
                      Edit Profile Info
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
