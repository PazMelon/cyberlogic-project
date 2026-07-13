import { useRef, useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Shield, Mail, MapPin, Cake, GraduationCap, Calendar, Camera
} from "lucide-react";
import { BottomSheet, FullscreenImageViewer } from "../ui";
import { SkeletonCircle, SkeletonLine } from "../Skeleton";

interface ProfileCardProps {
  activeUser: {
    name: string;
    username: string;
    avatar: string;
    role: string;
    email: string;
    joinedDate: string;
    yearLevel: string;
    department: string;
    address: string;
    birthday: string;
    reputation: any;
  };
  status: string;
  bio: string;
  expertise: string;
  isOwnProfile: boolean;
  isLoading: boolean;
  isUploadingAvatar: boolean;
  avatarError: string | null;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileCard({
  activeUser,
  status,
  bio,
  expertise,
  isOwnProfile,
  isLoading,
  isUploadingAvatar,
  avatarError,
  onAvatarUpload,
}: ProfileCardProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const closeDropdown = () => setIsDropdownOpen(false);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, [isDropdownOpen]);

  const avatarSrc = activeUser.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${activeUser.name}`;

  return (
    <>
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
              {/* Avatar with dropdown / bottom sheet / fullscreen */}
              <div className="relative -mt-12 mb-3 inline-block">
                <div
                  onClick={(e) => {
                    if (isUploadingAvatar) return;
                    if (!isOwnProfile) {
                      setIsFullscreenOpen(true);
                    } else {
                      e.stopPropagation();
                      if (isMobile) {
                        setIsBottomSheetOpen(true);
                      } else {
                        setIsDropdownOpen((prev) => !prev);
                      }
                    }
                  }}
                  className={`relative group cursor-pointer ${!isOwnProfile ? "hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200" : ""}`}
                >
                  <img
                    src={avatarSrc}
                    alt={activeUser.name}
                    className={`w-20 h-20 rounded-full border-4 border-surface-950 bg-surface-800 shadow-lg object-cover transition-opacity duration-200 ${
                      isUploadingAvatar ? "opacity-40 animate-pulse" : ""
                    }`}
                  />
                  <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface-950 ${
                    status === "online" ? "bg-success" : status === "away" ? "bg-warning" : "bg-text-muted"
                  }`} />

                  <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10">
                    {isUploadingAvatar ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-white" />
                        <span className="text-[9px] text-white/90 font-semibold mt-0.5">
                          {isOwnProfile ? "Options" : "View"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isOwnProfile && isDropdownOpen && !isMobile && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 mt-2 w-48 rounded-xl bg-surface-900 border border-border/80 shadow-2xl glass p-1.5 z-40 animate-fadeIn"
                  >
                    <button
                      type="button"
                      onClick={() => { setIsFullscreenOpen(true); setIsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      View Profile Picture
                    </button>
                    <button
                      type="button"
                      onClick={() => { fileInputRef.current?.click(); setIsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Change Profile Picture
                    </button>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={onAvatarUpload} disabled={isUploadingAvatar} className="hidden" />

              {avatarError && (
                <div className="text-[10px] text-error font-medium mt-1 mb-2 text-center max-w-[200px]">✗ {avatarError}</div>
              )}

              {/* Identity */}
              <div>
                <h3 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] leading-tight flex items-center justify-center gap-1.5">
                  {activeUser.name}
                  <span className={`w-2 h-2 rounded-full inline-block ${
                    status === "online" ? "bg-success" : status === "away" ? "bg-warning" : "bg-text-muted"
                  }`} title={status} />
                </h3>
                {activeUser.username && (
                  <p className="text-xs text-text-muted mt-0.5 font-mono">u/{activeUser.username}</p>
                )}
              </div>

              {/* Status, role, and details */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    status === "online" ? "bg-success" : status === "away" ? "bg-warning" : "bg-text-muted"
                  }`} />
                  <span className="text-xs font-semibold text-text-secondary capitalize">
                    {status === "online" ? "Online" : status === "away" ? "Away" : "Offline"}
                  </span>
                </div>
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
                  <span className="text-sm font-bold text-text-primary">
                    {((activeUser.reputation as any)?.allTime ?? 0).toLocaleString()} points
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block font-semibold uppercase">Engagement</span>
                  <span className="text-sm font-bold text-text-primary">Top 5%</span>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5 pt-1.5 text-xs text-text-secondary">
                <p className="font-semibold text-text-primary uppercase text-[9px] tracking-wide">Bio</p>
                <p className="leading-relaxed bg-surface-900/30 p-2.5 rounded-lg border border-border/40 whitespace-pre-wrap">
                  {bio || "No biography details added yet."}
                </p>
              </div>

              {/* Expertise */}
              <div className="space-y-1.5 pt-2 text-xs text-text-secondary">
                <p className="font-semibold text-text-primary uppercase text-[9px] tracking-wide">Expertises & Fields</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {expertise.split(",").map((exp) => exp.trim()).filter(Boolean).map((exp) => (
                    <span key={exp} className="px-2.5 py-1 rounded-lg bg-surface-900/40 border border-border text-[10px] text-text-primary font-medium">
                      {exp}
                    </span>
                  ))}
                  {!expertise.trim() && (
                    <span className="text-[10px] text-text-muted">No expertise listed.</span>
                  )}
                </div>
              </div>

              {/* Edit shortcut */}
              {isOwnProfile && (
                <Link
                  to="/app/settings"
                  className="w-full mt-4 py-2 text-center text-xs font-bold bg-surface-800 hover:bg-surface-700 text-text-primary border border-border rounded-xl transition-all cursor-pointer block"
                >
                  Edit Profile Info
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet for avatar */}
      {isOwnProfile && (
        <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)} title="Profile Picture Options">
          <div className="space-y-2 py-2">
            <button
              type="button"
              onClick={() => { setIsFullscreenOpen(true); setIsBottomSheetOpen(false); }}
              className="w-full text-center py-3.5 rounded-xl bg-surface-800 border border-border hover:bg-surface-700 text-xs font-bold text-text-primary transition-all cursor-pointer block"
            >
              View Profile Picture
            </button>
            <button
              type="button"
              onClick={() => { setIsBottomSheetOpen(false); setTimeout(() => fileInputRef.current?.click(), 100); }}
              className="w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20 text-xs font-bold text-white transition-all cursor-pointer block"
            >
              Change Profile Picture
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Fullscreen avatar viewer */}
      <FullscreenImageViewer
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        imageUrl={avatarSrc}
        alt={activeUser.name}
        caption={activeUser.name}
        subcaption="Profile Picture"
      />
    </>
  );
}
