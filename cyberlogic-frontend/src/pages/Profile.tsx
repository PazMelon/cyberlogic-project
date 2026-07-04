import { useState } from "react";
import {
  Calendar,
  Award,
  MessageSquare,
  Heart,
  Save,
  Shield,
  Compass,
  Bookmark,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forumThreads, forumCategories } from "../data/mockData";

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "saved" | "settings">("overview");

  // Form states for Settings tab
  const [name, setName] = useState(user?.name || "John Doe");
  const [bio, setBio] = useState(
    "Cybersecurity student and CTF enthusiast. Interested in Reverse Engineering, Web Exploitation, and Linux Administration."
  );
  const [expertise, setExpertise] = useState<string>("Reverse Engineering, Web Exploitation, Network Analysis");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reddit u/ handle generation
  const username = `u/${name.toLowerCase().replace(/\s+/g, "_")}`;

  // Mock user posts
  const userPosts = forumThreads.filter((t) => t.author === user?.name || t.id === 1 || t.id === 3);

  // Mock saved posts
  const savedPosts = forumThreads.filter((t) => t.id === 2 || t.id === 4);

  const getCategoryColor = (categoryId: string): string => {
    const cat = forumCategories.find((c) => c.id === categoryId);
    const colorMap: Record<string, string> = {
      primary: "bg-primary/10 text-primary",
      accent: "bg-accent/10 text-accent",
      success: "bg-success/10 text-success",
      error: "bg-error/10 text-error",
      warning: "bg-warning/10 text-warning",
    };
    return colorMap[cat?.color || "primary"] || "bg-surface-700 text-text-secondary";
  };

  const getCategoryName = (categoryId: string): string => {
    return forumCategories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 2-Column Reddit Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Feed, Posts, Saved & Settings */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          {/* Navigation Tabs */}
          <div className="flex border-b border-border bg-surface-900/40 rounded-xl p-1">
            {(["overview", "posts", "saved", "settings"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-surface-800 border border-border text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Areas */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Profile Bio summary for mobile/tablet where sidebar is at the bottom */}
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
                </div>
              </div>

              {/* Expertise Skills inside Overview */}
              <div className="glass rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Expertises & Fields
                </h2>
                <div className="flex flex-wrap gap-2">
                  {expertise.split(",").map((s) => s.trim()).filter(Boolean).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-lg bg-surface-800 border border-border text-[11px] text-text-primary font-medium hover:border-primary/30 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-text-primary">Posted Threads ({userPosts.length})</h2>
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
                      <span className="text-[10px] text-text-muted">{thread.lastActivity}</span>
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

          {activeTab === "saved" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-primary" /> Saved Threads
              </h2>
              <div className="space-y-3">
                {savedPosts.map((thread) => (
                  <div
                    key={thread.id}
                    className="glass rounded-xl p-4 sm:p-5 hover:border-primary/20 transition-all duration-300 group"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(thread.categoryId)}`}>
                        {getCategoryName(thread.categoryId)}
                      </span>
                      <span className="text-[10px] text-text-muted">by {thread.author}</span>
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

          {activeTab === "settings" && (
            <div className="glass rounded-2xl p-6">
              <form onSubmit={handleSave} className="space-y-5">
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">
                  Profile Settings
                </h2>

                {saveSuccess && (
                  <div className="p-3 rounded-lg bg-success/15 border border-success/30 text-success text-xs flex items-center gap-2">
                    <span>✓ Changes saved successfully (Mock action).</span>
                  </div>
                )}

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
              {/* Avatar position overlapping banner */}
              <div className="relative -mt-12 mb-3 inline-block">
                <img
                  src={user?.avatar}
                  alt={name}
                  className="w-20 h-20 rounded-full border-4 border-surface-950 bg-surface-800 shadow-lg"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success border-2 border-surface-950" />
              </div>

              {/* Identity */}
              <div>
                <h3 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] leading-tight">
                  {name}
                </h3>
                <p className="text-xs text-text-muted font-mono mt-0.5">{username}</p>
              </div>

              {/* Shield Badge */}
              <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 border border-border text-xs font-medium text-text-secondary">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">
                  {user?.role === "admin" || user?.role === "superadmin" ? "Officer / Admin" : "Member Portal"}
                </span>
              </div>

              {/* Bio description */}
              <p className="text-xs text-text-secondary mt-3 leading-relaxed border-b border-border pb-3">
                {bio}
              </p>

              {/* Karma & Stats */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-border">
                <div>
                  <p className="text-xs font-bold text-text-primary">1,420</p>
                  <p className="text-[10px] text-text-muted">Post Points</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">842</p>
                  <p className="text-[10px] text-text-muted">Replies Received</p>
                </div>
              </div>

              {/* Join Date Cake Day */}
              <div className="flex items-center gap-2 py-3 text-xs text-text-secondary">
                <Calendar className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted">Cake Day</span>
                  <span className="text-xs font-semibold">
                    {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "July 4, 2025"}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 mt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary text-xs font-semibold border border-border transition-all"
                >
                  Edit Profile Card
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
