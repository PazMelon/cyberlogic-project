import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useEffect } from "react";
import { applyGlobalTheme } from "./utils/theme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { fetchSiteSettings } from "./utils/api";
import { WebSocketProvider } from "./context/WebSocketContext";
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import Landing from "./pages/Landing";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import Resources from "./pages/Resources";
import About from "./pages/About";
import OfficerDetail from "./pages/OfficerDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import SiteSettings from "./pages/admin/SiteSettings";
import AuditLogs from "./pages/admin/AuditLogs";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import RoleManagement from "./pages/admin/RoleManagement";
import { BlogManagement, CreateBlog } from "./pages/admin/blog";
import SearchResults from "./pages/SearchResults";
import { Shield } from "lucide-react";
import PortalLayout from "./layouts/PortalLayout";
import AttendancePortal from "./pages/portal/AttendancePortal";

/**
 * Cybernetic Loader for initial session check
 */
function AuthLoader() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-15" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse shadow-lg shadow-primary/20">
          <Shield className="w-8 h-8 text-white animate-spin [animation-duration:3s]" />
        </div>
        <p className="text-sm font-semibold tracking-widest text-text-secondary uppercase animate-pulse">
          Connecting to System...
        </p>
      </div>
    </div>
  );
}

/**
 * Require standard member authentication
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Require administrator privilege
 */
function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

/**
 * Prevent logged-in users from accessing login/register pages
 */
function GuestGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
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
        resolvedTheme = localStorage.getItem("cl-theme-guest") || cachedDefault;
      }

      // Apply synchronously first to avoid FOUC/visual flash!
      applyGlobalTheme(resolvedTheme, isAuthenticated && user ? user.id : null);

      // 3. Fetch backend settings updates in the background
      try {
        const settings = await fetchSiteSettings();
        if (settings && settings.default_theme && settings.default_theme !== cachedDefault) {
          localStorage.setItem("cl-default-theme", settings.default_theme);

          // Check if there is no user override
          const userOverride = isAuthenticated && user 
            ? localStorage.getItem(`cl-theme-user-${user.id}`) 
            : localStorage.getItem("cl-theme-guest");

          if (!userOverride) {
            applyGlobalTheme(settings.default_theme, isAuthenticated && user ? user.id : null);
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
        <Route path="about" element={<About />} />
        <Route path="about/officers/:id" element={<OfficerDetail />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:id" element={<BlogDetail />} />
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
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:id" element={<BlogDetail />} />
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
        <Route path="settings" element={<SiteSettings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="blogs" element={<BlogManagement />} />
        <Route path="blogs/create" element={<CreateBlog />} />
        <Route path="blogs/edit/:id" element={<CreateBlog />} />
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

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
}
