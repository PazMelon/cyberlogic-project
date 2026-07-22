import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
  Search,
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
  CalendarPlus,
  CalendarClock,
  CalendarCheck,
  Reply,
  Lock,
  Unlock,
  Trash2,
  CheckCircle,
  Pin,
  UserPlus,
  UserCheck,
  UserX,
  Info,
  Flag,
  Kanban,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import GlobalSearch from "./search/GlobalSearch";
import { fetchUsers } from "../utils/api";

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
      { icon: Kanban, label: "CyberBoard", path: "/app/cyberboard" },
      { icon: MessagesSquare, label: "Forums", path: "/app/forums" },
      { icon: MessageSquare, label: "Chat", path: "/app/chat" },
      { icon: Newspaper, label: "Blog", path: "/app/blogs" },
      { icon: Users, label: "Directory", path: "/app/directory" },
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

interface SidebarNavItem {
  icon: any;
  label: string;
  path: string;
  badge?: number;
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
      { icon: Flag, label: "Content Reports", path: "/admin/reports", permission: "manage_forums" },
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

const notificationIcons: Record<string, any> = {
  'megaphone': Megaphone,
  'calendar-plus': CalendarPlus,
  'calendar-clock': CalendarClock,
  'calendar-check': CalendarCheck,
  'message-square': MessageSquare,
  'reply': Reply,
  'lock': Lock,
  'lock-open': Unlock,
  'trash-2': Trash2,
  'check-circle': CheckCircle,
  'pin': Pin,
  'user-plus': UserPlus,
  'user-check': UserCheck,
  'user-x': UserX,
  'info': Info,
};

const getNotificationIcon = (iconName: string | null, type: string) => {
  if (iconName && notificationIcons[iconName]) {
    return notificationIcons[iconName];
  }
  switch (type) {
    case 'announcement':
      return Megaphone;
    case 'event_new':
    case 'event':
      return CalendarPlus;
    case 'event_ongoing':
      return CalendarClock;
    case 'event_completed':
      return CalendarCheck;
    case 'thread_comment':
      return MessageSquare;
    case 'comment_reply':
      return Reply;
    case 'thread_closed':
      return Lock;
    case 'thread_reopened':
      return Unlock;
    case 'comment_deleted':
      return Trash2;
    case 'comment_solution':
      return CheckCircle;
    case 'thread_pinned':
      return Pin;
    case 'admin_registration':
      return UserPlus;
    case 'admin_approval_pending':
      return UserCheck;
    case 'admin_user_suspended':
      return UserX;
    default:
      return Info;
  }
};

const getNotificationColorClass = (type: string) => {
  switch (type) {
    case 'announcement':
    case 'thread_comment':
    case 'chat_mention':
      return 'text-primary bg-primary/10 border-primary/20';
    case 'event_new':
    case 'thread_pinned':
      return 'text-accent bg-accent/10 border-accent/20';
    case 'event_ongoing':
    case 'admin_approval_pending':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'event_completed':
    case 'thread_reopened':
    case 'comment_solution':
      return 'text-success bg-success/10 border-success/20';
    case 'comment_reply':
    case 'admin_registration':
    case 'chat_reply':
      return 'text-info bg-info/10 border-info/20';
    case 'thread_closed':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'comment_deleted':
    case 'admin_user_suspended':
    case 'chat_message_deleted':
      return 'text-error bg-error/10 border-error/20';
    default:
      return 'text-text-muted bg-white/5 border-white/10';
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function Topbar() {
  const { user, logout, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const location = useLocation();
  const {
    myStatus,
    updateMyStatus,
    unreadNotifCount,
    resetUnreadNotifCount,
    decrementUnreadNotifCount,
    latestNotification,
    clearLatestNotification,
    subscribe
  } = useWebSocket();

  const [pendingCount, setPendingCount] = useState(0);

  // Fetch initial pending count for mobile sidebar
  useEffect(() => {
    if (!isAdmin) return;
    async function loadPendingCount() {
      try {
        const users = await fetchUsers();
        const pendingUsers = users.filter((u) => u.status === "pending");
        setPendingCount(pendingUsers.length);
      } catch (err) {
        console.error("Failed to load initial pending count in Topbar:", err);
      }
    }
    loadPendingCount();
  }, [isAdmin]);

  // Listen for real-time member registrations updates for mobile sidebar
  useEffect(() => {
    if (!isAdmin) return;
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
  }, [isAdmin, subscribe]);

  // Close mobile search and menus on route changes
  useEffect(() => {
    setShowMobileSearch(false);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifDropdown(false);
  }, [location.pathname]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [expandedNotifIds, setExpandedNotifIds] = useState<Record<number, boolean>>({});

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Show Toast when a new notification is received via WS
  useEffect(() => {
    if (latestNotification) {
      setActiveToast(latestNotification);
      clearLatestNotification();

      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification, clearLatestNotification]);

  // Prevent body scroll when any mobile menu/drawer is open
  useEffect(() => {
    const checkScrollLock = () => {
      const isMobileView = window.innerWidth < 1024;
      const shouldLock = showMobileMenu || (isMobileView && (showDropdown || showNotifDropdown));
      if (shouldLock) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    };

    checkScrollLock();
    window.addEventListener("resize", checkScrollLock);
    return () => {
      window.removeEventListener("resize", checkScrollLock);
      document.body.style.overflow = "";
    };
  }, [showMobileMenu, showDropdown, showNotifDropdown]);

  const isActive = (path: string) => {
    if (path === "/app" || path === "/admin") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleOpenNotifications = async () => {
    if (!showNotifDropdown) {
      setLoadingNotifs(true);
      setShowNotifDropdown(true);
      try {
        const res = await fetch('/api/notifications', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          // Support both paginated and non-paginated backend responses
          setNotifications(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoadingNotifs(false);
      }
    } else {
      setShowNotifDropdown(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      if (res.ok) {
        resetUnreadNotifCount();
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      if (res.ok) {
        resetUnreadNotifCount();
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      if (res.ok) {
        const deletedNotif = notifications.find(n => n.id === id);
        if (deletedNotif && !deletedNotif.read_at) {
          decrementUnreadNotifCount();
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    setShowNotifDropdown(false);
    if (!notif.read_at) {
      try {
        const res = await fetch(`/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Accept': 'application/json' },
          credentials: 'same-origin'
        });
        if (res.ok) {
          decrementUnreadNotifCount();
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  const renderNotificationsList = () => {
    if (loadingNotifs) {
      return (
        <div className="p-4 text-center text-xs text-text-muted">
          Loading notifications...
        </div>
      );
    }
    if (notifications.length === 0) {
      return (
        <div className="p-8 text-center text-xs text-text-muted">
          No notifications.
        </div>
      );
    }
    return notifications.map(notif => {
      const path = notif.link || '/app';

      return (
        <Link
          key={notif.id}
          to={path}
          onClick={() => handleNotificationClick(notif)}
          className={`group flex items-start gap-3 p-3.5 text-left hover:bg-white/5 transition-all relative ${!notif.read_at ? 'bg-primary/5 border-l-2 border-primary' : ''
            }`}
        >
          <div className={`p-2 rounded-lg flex-shrink-0 border flex items-center justify-center h-8 w-8 ${getNotificationColorClass(notif.type)}`}>
            {(() => {
              const Icon = getNotificationIcon(notif.icon, notif.type);
              return <Icon className="w-4 h-4" />;
            })()}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-text-primary truncate">{notif.title}</span>
              <span className="text-[9px] text-text-muted whitespace-nowrap flex-shrink-0">
                {formatRelativeTime(notif.created_at)}
              </span>
            </div>
            <div className="text-xs text-text-secondary leading-relaxed pr-6 mt-0.5">
              <p className={expandedNotifIds[notif.id] ? "" : "line-clamp-2"}>
                {notif.body}
              </p>
              {notif.body && notif.body.length > 80 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpandedNotifIds((prev) => ({
                      ...prev,
                      [notif.id]: !prev[notif.id],
                    }));
                  }}
                  className="text-[10px] text-primary hover:underline font-bold mt-1 block cursor-pointer"
                >
                  {expandedNotifIds[notif.id] ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => handleDeleteSingle(e, notif.id)}
            className="absolute right-3 top-3.5 p-1 rounded-md text-text-muted hover:text-error hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Delete notification"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </Link>
      );
    });
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 glass border-b border-border flex items-center px-4 sm:px-6 gap-4">
        {showMobileSearch ? (
          <div className="flex-1 flex items-center gap-2 z-50">
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 max-w-full">
              <GlobalSearch />
            </div>
          </div>
        ) : (
          <>
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
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                <img src="/icons.svg" alt="Cyberlogic" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-sm font-bold font-[family-name:var(--font-heading)]">
                <span className="text-gradient">Cyber</span><span className="text-text-primary">logic</span>
              </span>
            </Link>

            {/* Search */}
            <div className="hidden lg:block flex-1 max-w-md">
              <GlobalSearch />
            </div>

            <div className="flex-1" />

            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileSearch(true)}
              className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={handleOpenNotifications}
            className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
            )}
          </button>

          {/* Notifications Dropdown (Desktop Only) */}
          {showNotifDropdown && (
            <div className="hidden lg:block">
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-900 rounded-xl border border-border shadow-xl z-50 py-2 flex flex-col max-h-[480px]">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text-primary">Notifications</span>
                  <div className="flex items-center gap-3">
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs font-semibold text-text-muted hover:text-error hover:underline cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                  {renderNotificationsList()}
                </div>
              </div>
            </div>
          )}
        </div>

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

          {/* User Menu Dropdown (Desktop Only) */}
          {showDropdown && (
            <div className="hidden lg:block">
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-900 rounded-xl border border-border shadow-xl z-50 py-2">
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
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${myStatus === 'online'
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-surface-800 border-border text-text-muted hover:border-success/20'
                        }`}
                    >
                      Online
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMyStatus('away')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${myStatus === 'away'
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
                  to="/app/settings"
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
            </div>
          )}
        </div>
          </>
        )}
      </header>

      {/* Mobile/Tablet Notifications Sidebar Drawer */}
      {showNotifDropdown && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowNotifDropdown(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-surface-900 border-l border-border z-50 flex flex-col animate-slide-in-right-drawer overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border flex-shrink-0">
              <span className="text-sm font-semibold text-text-primary">Notifications</span>
              <div className="flex items-center gap-3">
                {unreadNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-semibold text-text-muted hover:text-error hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
              {renderNotificationsList()}
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Tablet User Profile Sidebar Drawer */}
      {showDropdown && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowDropdown(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-surface-900 border-l border-border z-50 flex flex-col animate-slide-in-right-drawer overflow-hidden shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-border flex-shrink-0">
              <span className="text-sm font-semibold text-text-primary">Account Options</span>
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
              </div>

              {/* Status Toggle */}
              <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-2">
                <span className="text-xs text-text-muted font-semibold">Status</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateMyStatus('online')}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${myStatus === 'online'
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-surface-800 border-border text-text-muted hover:border-success/20'
                      }`}
                  >
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMyStatus('away')}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${myStatus === 'away'
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
                className="flex items-center gap-3 px-5 py-3.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <User className="w-4.5 h-4.5" /> Profile
              </Link>
              <Link
                to="/app/settings"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-5 py-3.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4.5 h-4.5" /> Settings
              </Link>

              <div className="border-t border-border mt-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-text-muted hover:text-error hover:bg-error/5 transition-colors text-left"
                >
                  <LogOut className="w-4.5 h-4.5" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <img src="/icons.svg" alt="Cyberlogic" className="w-7 h-7 object-contain" />
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
                        {visibleItems.map((item) => {
                          const badgeValue = item.badgeKey === "pendingMembers" ? pendingCount : (item.badge || 0);
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setShowMobileMenu(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${isActive(item.path)
                                  ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-text-primary border-amber-500/25 shadow-sm shadow-amber-500/5"
                                  : "text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
                                }`}
                            >
                              <item.icon
                                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive(item.path) ? "text-amber-400" : "text-text-muted group-hover:text-text-secondary"
                                  }`}
                              />
                              <span className="flex-1 truncate">{item.label}</span>
                              {badgeValue > 0 && (
                                <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                                  {badgeValue}
                                </span>
                              )}
                              {isActive(item.path) && badgeValue === 0 && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              )}
                            </Link>
                          );
                        })}
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
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${isActive(item.path)
                              ? "bg-gradient-to-r from-primary/15 to-primary/5 text-text-primary border-primary/25 shadow-sm shadow-primary/5"
                              : "text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
                            }`}
                        >
                          <item.icon
                            className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive(item.path) ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
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
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize ${isAdminRoute
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

      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full glass rounded-xl border border-border/80 shadow-2xl p-4 flex gap-3.5 animate-slide-in-right">
          <div className={`p-2.5 rounded-lg flex-shrink-0 border flex items-center justify-center h-10 w-10 ${getNotificationColorClass(activeToast.type)}`}>
            {(() => {
              const Icon = getNotificationIcon(activeToast.icon, activeToast.type);
              return <Icon className="w-5 h-5" />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-text-primary truncate">{activeToast.title}</span>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mt-1 line-clamp-2">{activeToast.body}</p>
            {activeToast.link && (
              <Link
                to={activeToast.link}
                onClick={() => {
                  setActiveToast(null);
                  handleNotificationClick(activeToast);
                }}
                className="text-xs font-semibold text-primary hover:underline mt-2 inline-block"
              >
                View details
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
