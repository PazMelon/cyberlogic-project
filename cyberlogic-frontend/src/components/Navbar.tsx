import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Menu,
  X,
  Home,
  Bell,
  BookOpen,
  Calendar,
  FolderOpen,
  Info,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Announcements", path: "/announcements", icon: Bell },
  { label: "Blogs", path: "/blogs", icon: BookOpen },
  { label: "Events", path: "/events", icon: Calendar },
  { label: "Resources", path: "/resources", icon: FolderOpen },
  { label: "About", path: "/about", icon: Info },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled
            ? "glass shadow-lg shadow-black/20"
            : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <img src="/icons.svg" alt="Cyberlogic" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-xl font-bold font-[family-name:var(--font-heading)] tracking-tight">
                <span className="text-gradient">Cyber</span>
                <span className="text-text-primary">logic</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === link.path
                      ? "text-primary bg-primary/10"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/app"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-900 border border-border text-sm font-medium hover:bg-surface-800 transition-colors"
                >
                  <img src={user?.avatar} alt={user?.name} className="w-6 h-6 rounded-full bg-surface-700 object-cover" />
                  <span className="text-text-primary">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>

            {/* Mobile/Tablet Menu Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-45 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-out Sidebar Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-surface-900 border-l border-border z-50 flex flex-col justify-between transition-transform duration-300 ease-out shadow-2xl lg:hidden ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-border flex-shrink-0">
            <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <img src="/icons.svg" alt="Cyberlogic" className="w-7 h-7 object-contain" />
              </div>
              <span className="text-lg font-bold font-[family-name:var(--font-heading)] tracking-tight">
                <span className="text-gradient">Cyber</span>
                <span className="text-text-primary">logic</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${isActive
                      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-text-primary border-primary/25 shadow-sm shadow-primary/5"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                      }`}
                  />
                  <span className="truncate">{link.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer/Auth Action Area */}
          <div className="border-t border-border/60 p-4 space-y-4 bg-surface-950/20 flex-shrink-0">
            {isAuthenticated ? (
              <div className="space-y-4">
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
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary capitalize">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dashboard Shortcut button */}
                <Link
                  to="/app"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20 text-white text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary border border-border hover:border-primary/30 hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
