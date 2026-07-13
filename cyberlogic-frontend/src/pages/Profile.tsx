import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import {
  ArrowLeft,
  Bookmark
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { SkeletonLine } from "../components/Skeleton";
import { ForumThreadCard } from "../components/ui";
import {
  uploadAvatar,
  fetchDirectoryMemberById,
  fetchDirectoryMemberByUsername,
  fetchForumThreads,
  fetchUserActivity,
  fetchUserProjects,
  fetchUserGallery,
  type DirectoryMember,
  type ForumThreadMapped,
  type UserProject,
  type UserGalleryPhoto
} from "../utils/api";
import { useSEO } from "../utils/useSEO";

// Extracted Components
import {
  ProfileCard,
  ProfileOverviewTab,
  ProfilePostsTab,
  ProjectShowcaseTab,
  PhotoGalleryTab
} from "../components/profile";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { onlineUsers } = useWebSocket();

  const { userId, username: urlUsername } = useParams();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<DirectoryMember | null>(null);

  const isOwnProfile = !!((!userId && !urlUsername) ||
                       (userId && parseInt(userId, 10) === user?.id) ||
                       (urlUsername && user?.username && urlUsername.toLowerCase() === user.username.toLowerCase()));

  useSEO({
    title: targetUser ? `${targetUser.name}'s Profile` : isOwnProfile ? "My Profile" : "User Profile",
    description: targetUser ? targetUser.bio : undefined,
    image: targetUser ? targetUser.avatar : undefined,
  });

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



  // Avatar upload status
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "showcase" | "gallery" | "saved" | "settings">("overview");
  const [userPosts, setUserPosts] = useState<ForumThreadMapped[]>([]);
  const [savedThreads, setSavedThreads] = useState<ForumThreadMapped[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Showcase state
  const [showcaseProjects, setShowcaseProjects] = useState<UserProject[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(true);
  const [galleryPhotos, setGalleryPhotos] = useState<UserGalleryPhoto[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  // Fetch targeted member details if not own profile
  useEffect(() => {
    const initProfile = async () => {
      setIsLoading(true);
      if (!isOwnProfile) {
        try {
          let data = null;
          if (userId) {
            data = await fetchDirectoryMemberById(parseInt(userId, 10));
          } else if (urlUsername) {
            data = await fetchDirectoryMemberByUsername(urlUsername);
          }
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
  }, [userId, urlUsername, isOwnProfile]);

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
    username: isOwnProfile ? (user?.username || "") : (targetUser?.username || ""),
    avatar: isOwnProfile ? (user?.avatar || "") : (targetUser?.avatar || ""),
    role: isOwnProfile ? (user?.role || "Member") : (targetUser?.role || "Member"),
    email: isOwnProfile ? (user?.email || "") : (targetUser?.email || ""),
    joinedDate: isOwnProfile ? (user?.joinedDate || "2025-09-01") : (targetUser?.joinedDate || "2025-09-01"),
    yearLevel: isOwnProfile ? yearLevel : (targetUser?.yearLevel || ""),
    department: isOwnProfile ? department : (targetUser?.department || ""),
    address: isOwnProfile ? address : (targetUser?.address || ""),
    birthday: isOwnProfile ? birthday : (targetUser?.birthday || ""),
    reputation: isOwnProfile ? user?.reputation : targetUser?.reputation,
  };

  const getMemberStatus = () => {
    if (isOwnProfile) return "online";
    const targetId = targetUser?.id || (userId ? parseInt(userId, 10) : null);
    if (!targetId) return "offline";
    const active = onlineUsers.find((u) => u.id === targetId);
    return active ? (active.status || "online") : "offline";
  };

  const status = getMemberStatus();

  function trimFullName(f: string, m: string, l: string) {
    return `${f} ${m ? m + " " : ""}${l}`.trim() || "John Doe";
  }

  // Sync tab status with URL query parameter
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tabParam = query.get("tab");
    if (tabParam === "saved" && isOwnProfile) {
      setActiveTab("saved");
    } else if (tabParam === "posts") {
      setActiveTab("posts");
    } else if (tabParam === "showcase") {
      setActiveTab("showcase");
    } else if (tabParam === "gallery") {
      setActiveTab("gallery");
    } else {
      setActiveTab("overview");
    }
  }, [location.search, isOwnProfile]);

  const profileUserId = isOwnProfile ? user?.id : (userId ? parseInt(userId, 10) : targetUser?.id);

  // Load user threads dynamically from database
  useEffect(() => {
    const loadUserThreads = async () => {
      if (!profileUserId) return;
      try {
        const threadsData = await fetchForumThreads({ userId: profileUserId });
        setUserPosts(threadsData);
      } catch (err) {
        console.error("Failed to load user threads:", err);
      }
    };
    loadUserThreads();
  }, [profileUserId]);

  // Load user activities dynamically from database
  useEffect(() => {
    const loadUserActivities = async () => {
      if (!profileUserId) return;
      try {
        setActivitiesLoading(true);
        const data = await fetchUserActivity(profileUserId);
        setUserActivities(data);
      } catch (err) {
        console.error("Failed to load user activity:", err);
      } finally {
        setActivitiesLoading(false);
      }
    };
    loadUserActivities();
  }, [profileUserId]);

  // Load projects and gallery for overview
  useEffect(() => {
    const loadShowcaseDetails = async () => {
      if (!profileUserId) return;
      setShowcaseLoading(true);
      setGalleryLoading(true);
      try {
        const [proj, gall] = await Promise.all([
          fetchUserProjects(profileUserId),
          fetchUserGallery(profileUserId)
        ]);
        setShowcaseProjects(proj);
        setGalleryPhotos(gall);
      } catch (err) {
        console.error("Failed to load overview showcase details:", err);
      } finally {
        setShowcaseLoading(false);
        setGalleryLoading(false);
      }
    };
    loadShowcaseDetails();
  }, [profileUserId]);

  // Load saved threads from localStorage
  useEffect(() => {
    if (!user) return;
    const saved = JSON.parse(localStorage.getItem(`cl-saved-threads-${user.id}`) || "[]");
    setSavedThreads(saved);
  }, [user, activeTab]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      const response = await uploadAvatar(file);
      updateUser(response.user);
    } catch (err: any) {
      console.error("Failed to upload profile picture:", err);
      setAvatarError(err.message || "Failed to upload profile picture.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };



  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      {/* Navigation Link for directory member detail profile */}
      {(userId || urlUsername) && (
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
          <div className="flex flex-wrap bg-surface-900/30 p-1.5 rounded-xl border border-border gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex-1 min-w-[70px] py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
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
              className={`flex-1 min-w-[70px] py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                activeTab === "posts"
                  ? "bg-surface-800 border border-border text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              posts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("showcase")}
              className={`flex-1 min-w-[70px] py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                activeTab === "showcase"
                  ? "bg-surface-800 border border-border text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              showcase
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={`flex-1 min-w-[70px] py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                activeTab === "gallery"
                  ? "bg-surface-800 border border-border text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              gallery
            </button>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={`flex-1 min-w-[70px] py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                  activeTab === "saved"
                    ? "bg-surface-800 border border-border text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                saved
              </button>
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
                <ProfileOverviewTab
                  userActivities={userActivities}
                  activitiesLoading={activitiesLoading}
                  projects={showcaseProjects}
                  projectsLoading={showcaseLoading}
                  gallery={galleryPhotos}
                  galleryLoading={galleryLoading}
                  onGoToTab={setActiveTab}
                />
              )}

              {activeTab === "posts" && (
                <ProfilePostsTab userPosts={userPosts} />
              )}

              {activeTab === "showcase" && profileUserId && (
                <ProjectShowcaseTab
                  userId={profileUserId}
                  isOwnProfile={isOwnProfile}
                />
              )}

              {activeTab === "gallery" && profileUserId && (
                <PhotoGalleryTab
                  userId={profileUserId}
                  isOwnProfile={isOwnProfile}
                />
              )}

              {activeTab === "saved" && isOwnProfile && (
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-primary" /> Bookmarked Threads
                  </h2>
                  <div className="space-y-3">
                    {savedThreads.map((thread) => (
                      <ForumThreadCard key={thread.id} thread={thread} />
                    ))}
                    {savedThreads.length === 0 && (
                      <div className="glass rounded-xl p-6 text-center text-text-muted text-xs">
                        No bookmarked threads.
                      </div>
                    )}
                  </div>
                </div>
              )}


            </>
          )}
        </div>

        {/* Right Column: Profile Identity Details Card */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <ProfileCard
            activeUser={activeUser as any}
            status={status}
            bio={bio}
            expertise={expertise}
            isOwnProfile={isOwnProfile}
            isLoading={isLoading}
            isUploadingAvatar={isUploadingAvatar}
            avatarError={avatarError}
            onAvatarUpload={handleAvatarUpload}
          />
        </div>

      </div>
    </div>
  );
};
