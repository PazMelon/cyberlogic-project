import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Users,
  Megaphone,
  Calendar,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Crown,
  Newspaper,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navSections = [
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

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, isAdmin, user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen sticky top-0 bg-surface-900 border-r border-border transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border flex-shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold font-[family-name:var(--font-heading)] tracking-tight">
              <span className="text-gradient">Cyber</span>
              <span className="text-text-primary">logic</span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.title} className="space-y-1.5">
            {!collapsed ? (
              <span className="text-[10px] font-bold text-text-muted/50 uppercase tracking-widest px-3 mb-2 block">
                {section.title}
              </span>
            ) : (
              idx > 0 && <div className="border-t border-border/40 mx-2 my-3" />
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-text-primary border-primary/25 shadow-sm shadow-primary/5"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive(item.path) ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive(item.path) && !collapsed && (
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
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate" title={user?.name}>
                {user?.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className={`flex ${collapsed ? "flex-col items-center gap-2 pt-1" : "items-center justify-between gap-1"}`}>
          {isAdmin && (
            <Link
              to="/admin"
              className="p-2 rounded-lg text-text-muted hover:text-amber-400 hover:bg-amber-500/10 transition-all flex items-center justify-center"
              title="Admin Panel"
            >
              <Crown className="w-4.5 h-4.5" />
            </Link>
          )}
          <Link
            to="/app/settings"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all flex items-center justify-center"
            title="Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </Link>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-all flex items-center justify-center cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
