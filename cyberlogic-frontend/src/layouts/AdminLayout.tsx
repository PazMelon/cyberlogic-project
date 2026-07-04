import { Outlet } from "react-router";
import AdminSidebar from "../components/AdminSidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
