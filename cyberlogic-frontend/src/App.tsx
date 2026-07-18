import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { applyGlobalTheme } from "./utils/theme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { fetchSiteSettings } from "./utils/api";
import { WebSocketProvider } from "./context/WebSocketContext";
import { DialogProvider } from "./context/DialogContext";
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import Landing from "./pages/Landing";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import Resources from "./pages/Resources";
import ResourceDetail from "./pages/ResourceDetail";
import CreateResource from "./pages/CreateResource";
import About from "./pages/About";
import OfficerDetail from "./pages/OfficerDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Forums from "./pages/Forums";
import CreateThread from "./pages/CreateThread";
import ForumThread from "./pages/ForumThread";
import Chat from "./pages/Chat";
import Directory from "./pages/Directory";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import EventDetail from "./pages/EventDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MemberManagement from "./pages/admin/MemberManagement";
import AnnouncementManagement from "./pages/admin/AnnouncementManagement";
import CreateAnnouncement from "./pages/admin/CreateAnnouncement";
import EventManagement from "./pages/admin/EventManagement";
import CreateEvent from "./pages/admin/CreateEvent";
import EventAttendanceScanner from "./pages/admin/EventAttendanceScanner";
import EventAttendeesView from "./pages/admin/EventAttendeesView";
import ResourceManagement from "./pages/admin/ResourceManagement";
import ForumModeration from "./pages/admin/ForumModeration";
import ChatManagement from "./pages/admin/ChatManagement";
import FreedomWallModeration from "./pages/admin/FreedomWallModeration";
import SiteSettings from "./pages/admin/SiteSettings";
import AuditLogs from "./pages/admin/AuditLogs";
import ReportManagement from "./pages/admin/ReportManagement";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import CreateMemberBlog from "./pages/CreateMemberBlog";
import RoleManagement from "./pages/admin/RoleManagement";
import { BlogManagement, CreateBlog } from "./pages/admin/blog";
import ContactMessages from "./pages/admin/ContactMessages";
import SearchResults from "./pages/SearchResults";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import PortalLayout from "./layouts/PortalLayout";
import AttendancePortal from "./pages/portal/AttendancePortal";
import { NotFound, Forbidden, ServerError } from "./pages/errors";

/**
 * Elegant loader for initial session / auth checks.
 * Uses the same visual language as the index.html pre-render loader:
 * breathing logo, orbital rings, shimmer text, animated dots.
 * All styles are inline so it renders correctly regardless of CSS load order.
 */
function AuthLoader({ isFadingOut = false }: { isFadingOut?: boolean }) {
  /* --- inline keyframe injection (once) --- */
  const styleId = "cl-auth-loader-keyframes";
  if (typeof document !== "undefined" && !document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes cl-breathe   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      @keyframes cl-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes cl-shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes cl-fadein    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      @keyframes cl-blink     { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
      @keyframes cl-ambient   { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.15);opacity:1} }
    `;
    document.head.appendChild(style);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at 50% 40%, var(--cl-surface-900, #0f1729) 0%, var(--cl-surface-950, #0a0e1a) 70%)`,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? "scale(1.03)" : "scale(1)",
        transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: isFadingOut ? "none" : "auto",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(var(--cl-border-light, rgba(148,163,184,0.05)) 1px, transparent 1px), linear-gradient(90deg, var(--cl-border-light, rgba(148,163,184,0.05)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, color-mix(in srgb, var(--cl-primary, #06b6d4) 18%, transparent) 0%, color-mix(in srgb, var(--cl-accent, #a855f7) 8%, transparent) 50%, transparent 70%)`,
          filter: "blur(40px)",
          animation: "cl-ambient 4s ease-in-out infinite",
        }}
      />

      {/* Logo container with orbital rings */}
      <div
        style={{
          position: "relative",
          width: 160,
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        {/* Primary orbital ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            animation: "cl-spin 2s linear infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "var(--cl-primary, #06b6d4)",
              borderRightColor: "color-mix(in srgb, var(--cl-primary, #06b6d4) 30%, transparent)",
              filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--cl-primary, #06b6d4) 50%, transparent))",
            }}
          />
        </div>

        {/* Secondary orbital ring (counter-rotating) */}
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            animation: "cl-spin 3.5s linear infinite reverse",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px solid transparent",
              borderBottomColor: "color-mix(in srgb, var(--cl-accent, #a855f7) 50%, transparent)",
              borderLeftColor: "color-mix(in srgb, var(--cl-accent, #a855f7) 15%, transparent)",
            }}
          />
        </div>

        {/* Club mascot/logo (icons.svg) with breathing animation */}
        <img
          src="/icons.svg"
          alt="Cyberlogic"
          style={{
            width: 96,
            height: 96,
            filter: "drop-shadow(0 0 20px color-mix(in srgb, var(--cl-primary, #06b6d4) 40%, transparent))",
            animation: "cl-breathe 2.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Brand name with shimmer */}
      <div
        style={{
          marginTop: 28,
          fontFamily: "'Outfit', system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: "uppercase" as const,
          color: "var(--cl-text-primary, #f1f5f9)",
          background: `linear-gradient(90deg, var(--cl-text-primary, #f1f5f9) 0%, var(--cl-primary-light, #22d3ee) 50%, var(--cl-text-primary, #f1f5f9) 100%)`,
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "cl-shimmer 2.5s ease infinite",
          zIndex: 2,
        }}
      >
        Cyberlogic
      </div>

      {/* Status text with animated dots */}
      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: 1,
          color: "var(--cl-text-muted, #64748b)",
          opacity: 0,
          animation: "cl-fadein 0.8s ease 0.5s forwards",
          zIndex: 2,
        }}
      >
        Connecting to system
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 4,
              height: 4,
              marginLeft: 2,
              borderRadius: "50%",
              background: "var(--cl-text-muted, #64748b)",
              verticalAlign: "middle",
              animation: `cl-blink 1.4s ease-in-out infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Require standard member authentication
 */
/**
 * Smooth transition gate wrapper.
 * Delays loading transition to allow AuthLoader to fade out elegantly.
 */
function SmoothGate({
  isLoading,
  renderContent,
}: {
  isLoading: boolean;
  renderContent: () => React.ReactNode;
}) {
  const [showLoader, setShowLoader] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 400); // matches the transition duration (0.4s)
      return () => clearTimeout(timer);
    } else {
      setShowLoader(true);
      setIsFadingOut(false);
    }
  }, [isLoading]);

  if (showLoader) {
    return <AuthLoader isFadingOut={isFadingOut} />;
  }

  return <>{renderContent()}</>;
}

/**
 * Require standard member authentication
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <SmoothGate
      isLoading={isLoading}
      renderContent={() => {
        if (!isAuthenticated) {
          return <Navigate to="/login" replace />;
        }
        return children;
      }}
    />
  );
}

/**
 * Require administrator privilege
 */
function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  return (
    <SmoothGate
      isLoading={isLoading}
      renderContent={() => {
        if (!isAuthenticated) {
          return <Navigate to="/login" replace />;
        }
        if (!isAdmin) {
          return <Navigate to="/403" replace />;
        }
        return children;
      }}
    />
  );
}

/**
 * Prevent logged-in users from accessing login/register pages
 */
function GuestGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <SmoothGate
      isLoading={isLoading}
      renderContent={() => {
        if (isAuthenticated) {
          return <Navigate to="/app" replace />;
        }
        return children;
      }}
    />
  );
}

function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const initTheme = async () => {
      // 1. Resolve cached default theme synchronously
      const cachedDefault = localStorage.getItem("cl-default-theme") || "cyberpunk";

      // 2. Resolve final theme
      let resolvedTheme = "";
      if (isAuthenticated && user) {
        resolvedTheme = localStorage.getItem(`cl-theme-user-${user.id}`) || cachedDefault;
      } else {
        resolvedTheme = cachedDefault;
      }

      // Apply synchronously first to avoid FOUC/visual flash!
      applyGlobalTheme(resolvedTheme);

      // 3. Fetch backend settings updates in the background
      try {
        const settings = await fetchSiteSettings();
        if (settings && settings.default_theme && settings.default_theme !== cachedDefault) {
          localStorage.setItem("cl-default-theme", settings.default_theme);

          // Check if there is no user override
          const userOverride = isAuthenticated && user 
            ? localStorage.getItem(`cl-theme-user-${user.id}`) 
            : null;

          if (!userOverride) {
            applyGlobalTheme(settings.default_theme);
          }
        }
      } catch (err) {
        console.error("Failed to load default site theme:", err);
      }
    };

    if (!isLoading) {
      initTheme();
    }
  }, [isAuthenticated, user, isLoading]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="announcements/:id" element={<AnnouncementDetail />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="resources" element={<Resources />} />
        <Route path="resources/:id" element={<ResourceDetail />} />
        <Route path="about" element={<About />} />
        <Route path="about/officers/:id" element={<OfficerDetail />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:id" element={<BlogDetail />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<TermsOfService />} />
      </Route>

      {/* Auth Routes (unauthenticated guests only) */}
      <Route
        path="login"
        element={
          <GuestGate>
            <Login />
          </GuestGate>
        }
      />
      <Route
        path="register"
        element={
          <GuestGate>
            <Register />
          </GuestGate>
        }
      />
      <Route
        path="forgot-password"
        element={
          <GuestGate>
            <ForgotPassword />
          </GuestGate>
        }
      />

      {/* Authenticated Routes (member portal) */}
      <Route
        path="app"
        element={
          <AuthGate>
            <AuthLayout />
          </AuthGate>
        }
      >
        <Route index element={<Home />} />
        <Route path="forums" element={<Forums />} />
        <Route path="forums/create" element={<CreateThread />} />
        <Route path="forums/thread/:threadId" element={<ForumThread />} />
        <Route path="chat" element={<Chat />} />
        <Route path="directory" element={<Directory />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="announcements/:id" element={<AnnouncementDetail />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="resources" element={<Resources />} />
        <Route path="resources/:id" element={<ResourceDetail />} />
        <Route path="resources/create" element={<CreateResource />} />
        <Route path="resources/edit/:id" element={<CreateResource />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="u/:username" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:id" element={<BlogDetail />} />
        <Route path="blogs/create" element={<CreateMemberBlog />} />
        <Route path="blogs/edit/:id" element={<CreateMemberBlog />} />
        <Route path="search" element={<SearchResults />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="admin"
        element={
          <AdminGate>
            <AdminLayout />
          </AdminGate>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="members" element={<MemberManagement />} />
        <Route path="announcements" element={<AnnouncementManagement />} />
        <Route path="announcements/create" element={<CreateAnnouncement />} />
        <Route path="announcements/edit/:id" element={<CreateAnnouncement />} />
        <Route path="events" element={<EventManagement />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="events/edit/:id" element={<CreateEvent />} />
        <Route path="events/:id/scanner" element={<EventAttendanceScanner />} />
        <Route path="events/:id/attendees" element={<EventAttendeesView />} />
        <Route path="resources" element={<ResourceManagement />} />
        <Route path="forums" element={<ForumModeration />} />
        <Route path="chat" element={<ChatManagement />} />
        <Route path="message-moderation" element={<FreedomWallModeration />} />
        <Route path="reports" element={<ReportManagement />} />
        <Route path="settings" element={<SiteSettings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="blogs" element={<BlogManagement />} />
        <Route path="blogs/create" element={<CreateBlog />} />
        <Route path="blogs/edit/:id" element={<CreateBlog />} />
        <Route path="contact-messages" element={<ContactMessages />} />
      </Route>

      {/* Portal Routes */}
      <Route
        path="portal"
        element={
          <AdminGate>
            <PortalLayout />
          </AdminGate>
        }
      >
        <Route path="events/:id/attendance" element={<AttendancePortal />} />
      </Route>

      {/* Error Routes */}
      <Route path="403" element={<Forbidden />} />
      <Route path="500" element={<ServerError />} />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <DialogProvider>
      <AuthProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </DialogProvider>
  );
}
