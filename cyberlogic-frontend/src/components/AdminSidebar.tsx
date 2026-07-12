import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Shield,
  LayoutDashboard,
  Users,
  Megaphone,
  Calendar,
  BookOpen,
  MessageSquare,
  MessagesSquare,
  Palette,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  FileText,
  ScrollText,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { fetchUsers } from "../utils/api";
import { useWebSocket } from "../context/WebSocketContext";

interface SidebarNavItem {
  icon: any;
  label: string;
  path: string;
  badgeKey?: string;
  permission?: string;
  superAdminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: SidebarNavItem[];
}

const adminNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin", permission: "view_admin_dashboard" },
    ],
  },
  {
    title: "Management",
    items: [
      { icon: Users, label: "Members", path: "/admin/members", badgeKey: "pendingMembers", permission: "manage_users" },
      { icon: MessagesSquare, label: "Forums", path: "/admin/forums", permission: "manage_forums" },
      { icon: MessageSquare, label: "Chat Channels", path: "/admin/chat", permission: "manage_chat" },
      { icon: Shield, label: "Message Moderation", path: "/admin/message-moderation", permission: "manage_chat" },
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

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();
  const { logout, user, hasPermission, isSuperAdmin } = useAuth();
  const { subscribe } = useWebSocket();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  // Fetch initial pending count
  useEffect(() => {
    async function loadPendingCount() {
      try {
        const users = await fetchUsers();
        const pendingUsers = users.filter((u) => u.status === "pending");
        setPendingCount(pendingUsers.length);
      } catch (err) {
        console.error("Failed to load initial pending count in AdminSidebar:", err);
      }
    }
    loadPendingCount();
  }, []);

  // Listen for real-time member registrations approval/pending updates
  useEffect(() => {
    const unsubscribe = subscribe("admin:member_management", (payload) => {
      if (payload.event === "registration_pending") {
        setPendingCount((prev) => prev + 1);
      } else if (payload.event === "registration_approved" || payload.event === "registration_rejected") {
        setPendingCount((prev) => Math.max(0, prev - 1));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

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

      {/* Nav Sections */}
      <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        {adminNavSections.map((section, idx) => {
          // Filter items based on permissions
          const visibleItems = section.items.filter((item) => {
            if (item.superAdminOnly) return isSuperAdmin;
            if (item.permission) return hasPermission(item.permission);
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1.5">
              {!collapsed ? (
                <span className="text-[10px] font-bold text-text-muted/50 uppercase tracking-widest px-3 mb-2 block">
                  {section.title}
                </span>
              ) : (
                idx > 0 && <div className="border-t border-border/40 mx-2 my-3" />
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const badgeValue = item.badgeKey === "pendingMembers" ? pendingCount : 0;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-text-primary border-amber-500/25 shadow-sm shadow-amber-500/5"
                          : "text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isActive(item.path) ? "text-amber-400" : "text-text-muted group-hover:text-text-secondary"
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badgeValue > 0 && (
                            <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                              {badgeValue}
                            </span>
                          )}
                        </>
                      )}
                      {isActive(item.path) && !collapsed && badgeValue === 0 && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
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
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 capitalize">
                  {user?.admin_position || user?.role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className={`flex ${collapsed ? "flex-col items-center gap-2 pt-1" : "items-center justify-between gap-1"}`}>
          <Link
            to="/app"
            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all flex items-center justify-center"
            title="Member Portal"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
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
