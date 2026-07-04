import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  Calendar,
  Award,
  MessageSquare,
  Heart,
  Save,
  Shield,
  Compass,
  Mail,
  ArrowLeft,
  Bookmark,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forumThreads, forumCategories, directoryMembers } from "../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../components/Skeleton";

export default function Profile() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  // Find targeted member if userId is passed
  const targetedMember = userId
    ? directoryMembers.find((m) => m.id === parseInt(userId, 10))
    : null;

  // Decide if this is the logged-in user's profile
  const isOwnProfile = !userId || (targetedMember ? targetedMember.name === user?.name : false);

  const initialName = isOwnProfile ? (user?.name || "John Doe") : (targetedMember?.name || "");
  const initialBio = isOwnProfile
    ? "Cybersecurity student and CTF enthusiast. Interested in Reverse Engineering, Web Exploitation, and Linux Administration."
    : (targetedMember?.bio || "No biography provided.");
  const initialExpertise = isOwnProfile
    ? "Reverse Engineering, Web Exploitation, Network Analysis"
    : (targetedMember?.expertise.join(", ") || "");

  // Form states for Settings tab
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [expertise, setExpertise] = useState(initialExpertise);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if userId changes
  useEffect(() => {
    setName(initialName);
    setBio(initialBio);
    setExpertise(initialExpertise);
  }, [userId, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [userId]);

  const activeUser = {
    name: isOwnProfile ? name : (targetedMember?.name || "Unknown User"),
    avatar: isOwnProfile ? (user?.avatar || "") : (targetedMember?.avatar || ""),
    role: isOwnProfile ? (user?.role || "Member") : (targetedMember?.role || "Member"),
    email: isOwnProfile ? (user?.email || "") : (targetedMember?.email || ""),
    joinedDate: isOwnProfile ? (user?.joinedDate || "2025-09-01") : (targetedMember?.joinedDate || "2025-09-01"),
  };

  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "saved" | "settings">("overview");

  // Get forum activity posts by the user
  const userPosts = forumThreads.filter((t) => t.author === activeUser.name);

  // Get saved threads
  const savedThreads = forumThreads.slice(1, 3); // mock saved

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const getCategoryColor = (categoryId: string): string => {
    const cat = forumCategories.find((c) => c.id === categoryId);
    const colorMap: Record<string, string> = {
      primary: "bg-primary/10 text-primary border-primary/20",
      accent: "bg-accent/10 text-accent border-accent/20",
      success: "bg-success/10 text-success border-success/20",
      error: "bg-error/10 text-error border-error/20",
      warning: "bg-warning/10 text-warning border-warning/20",
    };
    return colorMap[cat?.color || "primary"] || "bg-surface-700 text-text-secondary border-border/50";
  };

  const getCategoryName = (categoryId: string): string => {
    return forumCategories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Navigation Link for directory member detail profile */}
      {userId && (
        <Link
          to="/app/directory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors bg-surface-900/40 px-3 py-1.5 rounded-lg border border-border"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      )}

      {/* 2-Column Reddit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Navigation Tabs & Tab contents */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          
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
                        <div
                          key={thread.id}
                          className="glass rounded-xl p-4 sm:p-5 hover:border-primary/20 transition-all duration-300 group"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(thread.categoryId)}`}>
                              {getCategoryName(thread.categoryId)}
                            </span>
                            <span className="text-[10px] text-text-muted">Posted {thread.lastActivity}</span>
                          </div>
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors mb-1">
                            {thread.title}
                          </h3>
                          <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                            {thread.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-text-muted">
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" /> {thread.replyCount} replies
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5" /> {thread.likes} likes
                            </span>
                          </div>
                        </div>
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
                          className="px-3 py-1.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary font-medium"
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
                      <div
                        key={thread.id}
                        className="glass rounded-xl p-4 sm:p-5 hover:border-primary/20 transition-all duration-300 group"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(thread.categoryId)}`}>
                            {getCategoryName(thread.categoryId)}
                          </span>
                          <span className="text-[10px] text-text-muted">Posted {thread.lastActivity}</span>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors mb-1">
                          {thread.title}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                          {thread.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> {thread.replyCount} replies
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" /> {thread.likes} likes
                          </span>
                        </div>
                      </div>
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
                      <div
                        key={thread.id}
                        className="glass rounded-xl p-4 sm:p-5 hover:border-primary/20 transition-all duration-300 group"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(thread.categoryId)}`}>
                            {getCategoryName(thread.categoryId)}
                          </span>
                          <span className="text-[10px] text-text-muted">Last Active {thread.lastActivity}</span>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors mb-1">
                          {thread.title}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                          {thread.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> {thread.replyCount} replies
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" /> {thread.likes} likes
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === "settings" && isOwnProfile && (
                <div className="glass rounded-2xl p-5 sm:p-6 space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] mb-1">Profile Details</h2>
                    <p className="text-xs text-text-muted">Update your display information and biography fields.</p>
                  </div>

                  {saveSuccess && (
                    <div className="p-3.5 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium">
                      ✓ Profile details updated successfully!
                    </div>
                  )}

                  <form onSubmit={handleSaveDetails} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="p-name" className="text-xs font-semibold text-text-secondary">Display Name</label>
                        <input
                          id="p-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="p-email" className="text-xs font-semibold text-text-secondary">Email Address</label>
                        <input
                          id="p-email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="w-full px-4 py-2 rounded-xl bg-surface-800/40 border border-border text-sm text-text-muted cursor-not-allowed focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="p-expertise" className="text-xs font-semibold text-text-secondary">Skills & Expertises (comma separated)</label>
                      <input
                        id="p-expertise"
                        type="text"
                        value={expertise}
                        onChange={(e) => setExpertise(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="p-bio" className="text-xs font-semibold text-text-secondary">About Info</label>
                      <textarea
                        id="p-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none text-xs"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
                      >
                        <Save className="w-4 h-4" /> Save Details
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Reddit-style Profile Card */}
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
                  <div className="relative -mt-12 mb-3 inline-block">
                    <img
                      src={activeUser.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
                      alt={activeUser.name}
                      className="w-20 h-20 rounded-full border-4 border-surface-950 bg-surface-800 shadow-lg"
                    />
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success border-2 border-surface-950" />
                  </div>

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
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-text-secondary">{activeUser.role}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-accent" />
                      <span className="text-xs text-text-muted truncate">{activeUser.email || "No email listed"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-success" />
                      <span className="text-xs text-text-muted">Cake Day: {activeUser.joinedDate}</span>
                    </div>
                  </div>

                  {/* Reddit-style Karma metrics */}
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
                    <p className="leading-relaxed bg-surface-900/30 p-2.5 rounded-lg border border-border/40">
                      {bio || "No biography details added yet."}
                    </p>
                  </div>

                  {/* Settings quick shortcut link */}
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="w-full mt-4 py-2 text-center text-xs font-bold bg-surface-800 hover:bg-surface-700 text-text-primary border border-border rounded-xl transition-all"
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
