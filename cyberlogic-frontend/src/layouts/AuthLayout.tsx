import { Outlet, useLocation } from "react-router";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { DashboardFooter } from "../components/dashboard/DashboardFooter";

export default function AuthLayout() {
  const location = useLocation();
  const isChat = location.pathname === "/app/chat";

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        {isChat ? (
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="flex-grow flex flex-col min-h-full">
              <div className="flex-grow">
                <Outlet />
              </div>
              <DashboardFooter />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
