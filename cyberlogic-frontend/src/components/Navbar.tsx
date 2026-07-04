import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Announcements", path: "/announcements" },
  { label: "Events", path: "/events" },
  { label: "Resources", path: "/resources" },
  { label: "About", path: "/about" },
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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-[family-name:var(--font-heading)] tracking-tight">
              <span className="text-gradient">Cyber</span>
              <span className="text-text-primary">logic</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/app"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-900 border border-border text-sm font-medium hover:bg-surface-800 transition-colors"
              >
                <img src={user?.avatar} alt={user?.name} className="w-6 h-6 rounded-full bg-surface-700" />
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

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass border-t border-border px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                location.pathname === link.path
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="pt-3 border-t border-border">
              <Link
                to="/app"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm font-medium text-text-primary"
              >
                <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full bg-surface-700" />
                <div className="text-left">
                  <p className="text-xs font-semibold">{user?.name}</p>
                  <p className="text-[10px] text-text-muted">Go to Dashboard</p>
                </div>
              </Link>
            </div>
          ) : (
            <div className="pt-3 border-t border-border flex gap-3">
              <Link
                to="/login"
                className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary border border-border hover:bg-white/5 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-primary to-accent text-white"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
