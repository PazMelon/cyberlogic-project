import { useSEO } from "../utils/useSEO";
import SettingsNavigation from "../components/settings/SettingsNavigation";
import ProfileSettings from "../components/settings/ProfileSettings";
import SecuritySettings from "../components/settings/SecuritySettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import DangerZoneSettings from "../components/settings/DangerZoneSettings";

export default function Settings() {
  useSEO({
    title: "Account Settings",
    description: "Update your profile information, password, notifications, and portal theme settings.",
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
          Account Settings
        </h1>
        <p className="text-xs text-text-muted mt-1.5">
          Manage your personal details, notification preferences, security keys, and UI appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Navigation Menu list */}
        <SettingsNavigation />

        {/* Right Forms Content Column */}
        <div className="md:col-span-2 space-y-6">
          <ProfileSettings />
          <SecuritySettings />
          <NotificationSettings />
          <AppearanceSettings />
          <DangerZoneSettings />
        </div>
      </div>
    </div>
  );
}
