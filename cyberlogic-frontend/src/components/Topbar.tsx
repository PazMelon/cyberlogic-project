import { useState } from "react";
import { Link } from "react-router";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GlobalSearch from "./search/GlobalSearch";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const mobileNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
    { icon: MessagesSquare, label: "Forums", path: "/app/forums" },
    { icon: MessageSquare, label: "Chat", path: "/app/chat" },
    { icon: Users, label: "Directory", path: "/app/directory" },
  ];

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

      {/* Mobile Navigation Overlay */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-72 z-50 bg-surface-900 border-r border-border p-4 space-y-2 animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <Link to="/app" className="flex items-center gap-2" onClick={() => setShowMobileMenu(false)}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold font-[family-name:var(--font-heading)]">
                  <span className="text-gradient">Cyber</span><span className="text-text-primary">logic</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {mobileNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
