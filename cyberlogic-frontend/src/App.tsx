import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import Landing from "./pages/Landing";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import Resources from "./pages/Resources";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Forums from "./pages/Forums";
import ForumThread from "./pages/ForumThread";
import Chat from "./pages/Chat";
import Directory from "./pages/Directory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MemberManagement from "./pages/admin/MemberManagement";
import AnnouncementManagement from "./pages/admin/AnnouncementManagement";
import EventManagement from "./pages/admin/EventManagement";
import ResourceManagement from "./pages/admin/ResourceManagement";
import ForumModeration from "./pages/admin/ForumModeration";
import SiteSettings from "./pages/admin/SiteSettings";

/**
 * Wrapper that auto-logs the user in for the /app routes
 * since we have no real authentication yet (mockup only).
 */
function MockAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuth();
  if (!isAuthenticated) {
    login();
  }
  return <>{children}</>;
}

/**
 * Wrapper that auto-logs the user in as admin for the /admin routes
 * since we have no real authentication yet (mockup only).
 */
function MockAdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin, loginAsAdmin } = useAuth();
  if (!isAdmin) {
    loginAsAdmin();
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="events" element={<Events />} />
        <Route path="resources" element={<Resources />} />
        <Route path="about" element={<About />} />
      </Route>

      {/* Auth Routes (standalone — no navbar/footer) */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      {/* Authenticated Routes (member portal) */}
      <Route
        path="app"
        element={
          <MockAuthGate>
            <AuthLayout />
          </MockAuthGate>
        }
      >
        <Route index element={<Home />} />
        <Route path="forums" element={<Forums />} />
        <Route path="forums/thread/:threadId" element={<ForumThread />} />
        <Route path="chat" element={<Chat />} />
        <Route path="directory" element={<Directory />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="events" element={<Events />} />
        <Route path="resources" element={<Resources />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="admin"
        element={
          <MockAdminGate>
            <AdminLayout />
          </MockAdminGate>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="members" element={<MemberManagement />} />
        <Route path="announcements" element={<AnnouncementManagement />} />
        <Route path="events" element={<EventManagement />} />
        <Route path="resources" element={<ResourceManagement />} />
        <Route path="forums" element={<ForumModeration />} />
        <Route path="settings" element={<SiteSettings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
