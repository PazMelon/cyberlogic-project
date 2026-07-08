import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
  LayoutDashboard,
  MessagesSquare,
  MessageSquare,
  Users,
  X,
  Shield,
  Crown,
  ArrowLeft,
  Megaphone,
  Calendar,
  BookOpen,
  Newspaper,
  Palette,
  ScrollText,
  KeyRound,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import GlobalSearch from "./search/GlobalSearch";

const memberNavSections = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
      { icon: Megaphone, label: "Announcements", path: "/app/announcements" },
    ],
  },
  {
    title: "Community",
    items: [
      { icon: MessagesSquare, label: "Forums", path: "/app/forums" },
      { icon: MessageSquare, label: "Chat", path: "/app/chat" },
      { icon: Users, label: "Directory", path: "/app/directory" },
      { icon: Newspaper, label: "Blog", path: "/app/blogs" },
    ],
  },
  {
    title: "Explore",
    items: [
      { icon: Calendar, label: "Events", path: "/app/events" },
      { icon: BookOpen, label: "Resources", path: "/app/resources" },
    ],
  },
];

const adminNavSections = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin", permission: "view_admin_dashboard" },
    ],
  },
  {
    title: "Management",
    items: [
      { icon: Users, label: "Members", path: "/admin/members", badge: 3, permission: "manage_users" },
      { icon: MessagesSquare, label: "Forums", path: "/admin/forums", permission: "manage_forums" },
      { icon: MessageSquare, label: "Chat Channels", path: "/admin/chat", permission: "manage_chat" },
      { icon: Megaphone, label: "Announcements", path: "/admin/announcements", permission: "manage_announcements" },
      { icon: FileText, label: "Blog Posts", path: "/admin/blogs", permission: "manage_blogs" },
      { icon: Calendar, label: "Events", path: "/admin/events", permission: "manage_events" },
      { icon: BookOpen, label: "Resources", path: "/admin/resources", permission: "manage_resources" },
    ],
  },
  {
    title: "System",
    items: [
      { icon: Palette, label: "Site Settings", path: "/admin/settings", permission: "manage_settings" },
      { icon: ScrollText, label: "Audit Logs", path: "/admin/audit-logs", permission: "view_audit_logs" },
      { icon: KeyRound, label: "Roles & Permissions", path: "/admin/roles", superAdminOnly: true },
    ],
  },
];

export default function Topbar() {
  const { user, logout, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const { myStatus, updateMyStatus } = useWebSocket();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

  const isActive = (path: string) => {
    if (path === "/app" || path === "/admin") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 glass border-b border-border flex items-center px-4 sm:px-6 gap-4">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo */}
        <Link to="/app" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold font-[family-name:var(--font-heading)]">
            <span className="text-gradient">Cyber</span><span className="text-text-primary">logic</span>
          </span>
        </Link>

        {/* Search */}
        <div className="hidden sm:block flex-1 max-w-md">
          <GlobalSearch />
        </div>

        <div className="flex-1" />

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <img
              src={user?.avatar || ""}
              alt={user?.name || "User"}
              className="w-8 h-8 rounded-full bg-surface-700"
            />
            <span className="hidden sm:block text-sm font-medium text-text-primary">
              {user?.name || "User"}
            </span>
            <ChevronDown className="hidden sm:block w-4 h-4 text-text-muted" />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl border border-border shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
                
                {/* Status Toggle */}
                <div className="px-4 py-2 border-b border-border flex items-center justify-between gap-2">
                  <span className="text-xs text-text-muted font-medium">Status</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateMyStatus('online')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        myStatus === 'online'
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-surface-800 border-border text-text-muted hover:border-success/20'
                      }`}
                    >
                      Online
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMyStatus('away')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        myStatus === 'away'
                          ? 'bg-warning/10 border-warning/30 text-warning'
                          : 'bg-surface-800 border-border text-text-muted hover:border-warning/20'
                      }`}
                    >
                      Away
                    </button>
                  </div>
                </div>

                <Link
                  to="/app/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <User className="w-4 h-4" /> Profile
                </Link>
                <Link
                  to="#"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:text-error hover:bg-error/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-72 z-50 bg-surface-900 border-r border-border flex flex-col animate-slide-in-left overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-border flex-shrink-0">
              <Link
                to={isAdminRoute ? "/admin" : "/app"}
                className="flex items-center gap-2"
                onClick={() => setShowMobileMenu(false)}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
                    isAdminRoute ? "from-amber-500 to-orange-600" : "from-primary to-accent"
                  }`}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold font-[family-name:var(--font-heading)] tracking-tight text-text-primary">
                    {isAdminRoute ? "Admin Panel" : "Cyberlogic"}
                  </span>
                  {isAdminRoute && (
                    <span className="text-[9px] text-text-muted -mt-1">Cyberlogic Club</span>
                  )}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
              {isAdminRoute
                ? adminNavSections.map((section) => {
                    const visibleItems = section.items.filter((item) => {
                      if (item.superAdminOnly) return isSuperAdmin;
                      if (item.permission) return hasPermission(item.permission);
                      return true;
                    });

                    if (visibleItems.length === 0) return null;

                    return (
                      <div key={section.title} className="space-y-2">
                        <span className="text-[10px] font-bold text-text-muted/50 uppercase tracking-widest px-3 block">
                          {section.title}
                        </span>
                        <div className="space-y-1">
                          {visibleItems.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setShowMobileMenu(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${
                                isActive(item.path)
                                  ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-text-primary border-amber-500/25 shadow-sm shadow-amber-500/5"
                                  : "text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
                              }`}
                            >
                              <item.icon
                                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                  isActive(item.path) ? "text-amber-400" : "text-text-muted group-hover:text-text-secondary"
                                }`}
                              />
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.badge && (
                                <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                                  {item.badge}
                                </span>
                              )}
                              {isActive(item.path) && !item.badge && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })
                : memberNavSections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <span className="text-[10px] font-bold text-text-muted/50 uppercase tracking-widest px-3 block">
                        {section.title}
                      </span>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setShowMobileMenu(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${
                              isActive(item.path)
                                ? "bg-gradient-to-r from-primary/15 to-primary/5 text-text-primary border-primary/25 shadow-sm shadow-primary/5"
                                : "text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
                            }`}
                          >
                            <item.icon
                              className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                isActive(item.path) ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                            {isActive(item.path) && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-border/60 p-4 space-y-4 bg-surface-950/20 flex-shrink-0">
              {/* Profile Info */}
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar || ""}
                  alt={user?.name || "User"}
                  className="w-9 h-9 rounded-full border border-border bg-surface-800 object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate" title={user?.name}>
                    {user?.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                        isAdminRoute
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isAdminRoute ? user?.admin_position || user?.role : user?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between gap-1">
                {isAdminRoute ? (
                  <Link
                    to="/app"
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all flex items-center justify-center"
                    title="Member Portal"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </Link>
                ) : (
                  isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className="p-2 rounded-lg text-text-muted hover:text-amber-400 hover:bg-amber-500/10 transition-all flex items-center justify-center"
                      title="Admin Panel"
                    >
                      <Crown className="w-4.5 h-4.5" />
                    </Link>
                  )
                )}
                <Link
                  to="/app/settings"
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all flex items-center justify-center"
                  title="Settings"
                >
                  <Settings className="w-4.5 h-4.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    logout();
                  }}
                  className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-all flex items-center justify-center cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
