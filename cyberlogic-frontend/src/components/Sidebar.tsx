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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
  { icon: MessagesSquare, label: "Forums", path: "/app/forums" },
  { icon: MessageSquare, label: "Chat", path: "/app/chat" },
  { icon: Users, label: "Directory", path: "/app/directory" },
  { icon: Megaphone, label: "Announcements", path: "/app/announcements" },
  { icon: Calendar, label: "Events", path: "/app/events" },
  { icon: BookOpen, label: "Resources", path: "/app/resources" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

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

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
              isActive(item.path)
                ? "bg-primary/10 text-primary"
                : "text-text-muted hover:text-text-primary hover:bg-white/5"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon
              className={`w-5 h-5 flex-shrink-0 ${
                isActive(item.path) ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
              }`}
            />
            {!collapsed && <span>{item.label}</span>}
            {isActive(item.path) && !collapsed && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-1">
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/5 transition-all"
            title={collapsed ? "Admin Panel" : undefined}
          >
            <Crown className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Admin Panel</span>}
          </Link>
        )}
        <Link
          to="/app/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-error hover:bg-error/5 transition-all"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all mt-1"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
