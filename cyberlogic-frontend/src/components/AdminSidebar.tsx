import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Shield,
  LayoutDashboard,
  Users,
  Megaphone,
  Calendar,
  BookOpen,
  MessagesSquare,
  Palette,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Members", path: "/admin/members", badge: 3 },
  { icon: Megaphone, label: "Announcements", path: "/admin/announcements" },
  { icon: Calendar, label: "Events", path: "/admin/events" },
  { icon: BookOpen, label: "Resources", path: "/admin/resources" },
  { icon: MessagesSquare, label: "Forums", path: "/admin/forums" },
  { icon: Palette, label: "Site Settings", path: "/admin/settings" },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
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
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold font-[family-name:var(--font-heading)] tracking-tight text-text-primary">
                Admin Panel
              </span>
              <span className="text-[10px] text-text-muted -mt-0.5">Cyberlogic Club</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
              isActive(item.path)
                ? "bg-amber-500/10 text-amber-400"
                : "text-text-muted hover:text-text-primary hover:bg-white/5"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon
              className={`w-5 h-5 flex-shrink-0 ${
                isActive(item.path) ? "text-amber-400" : "text-text-muted group-hover:text-text-secondary"
              }`}
            />
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {isActive(item.path) && !collapsed && !item.badge && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          to="/app"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-primary hover:bg-white/5 transition-all"
          title={collapsed ? "Member Portal" : undefined}
        >
          <ArrowLeft className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Member Portal</span>}
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
