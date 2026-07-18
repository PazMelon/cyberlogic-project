import { Outlet, Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col relative overflow-x-hidden text-text-primary">
      {/* Dynamic Animated Background Orbs */}
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 border-b border-border/40 bg-surface-900/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/15 group-hover:scale-105 transition-transform">
              <img src="/icons.svg" alt="Cyberlogic" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-bold font-[family-name:var(--font-heading)] text-lg tracking-tight hidden sm:inline">
              <span className="text-gradient">Cyber</span>logic Portal
            </span>
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            {/* User credentials */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800/60 border border-border/40">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                alt={user.name}
                className="w-6 h-6 rounded-full border border-primary/20"
              />
              <div className="text-left leading-tight">
                <p className="text-xs font-semibold text-text-primary">{user.name}</p>
                <p className="text-[10px] text-text-muted capitalize">
                  {user.admin_position || user.role}
                </p>
              </div>
            </div>

            {/* Admin navigation shortcut */}
            {user.role !== "member" && (
              <Link
                to="/admin/events"
                className="p-2 rounded-xl bg-surface-800 border border-border text-text-muted hover:text-primary hover:border-primary/20 transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Go to Admin Panel"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-surface-800 border border-border text-text-muted hover:text-error hover:border-error/20 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main content area */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0 w-full">
        <Outlet />
      </main>
    </div>
  );
}
