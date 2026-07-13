import { useState } from "react";
import { Save, User as UserIcon, Lock } from "lucide-react";

interface ProfileSettingsTabProps {
  user: any;
  firstName: string; setFirstName: (v: string) => void;
  middleName: string; setMiddleName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  yearLevel: string; setYearLevel: (v: string) => void;
  department: string; setDepartment: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  birthday: string; setBirthday: (v: string) => void;
  bio: string; setBio: (v: string) => void;
  expertise: string; setExpertise: (v: string) => void;
  onSaveDetails: (e: React.FormEvent) => Promise<void>;
  isSavingDetails: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  onPasswordChange: (e: React.FormEvent) => Promise<void>;
  isChangingPassword: boolean;
  passwordSuccess: boolean;
  passwordError: string | null;
}

export function ProfileSettingsTab({
  user,
  firstName, setFirstName,
  middleName, setMiddleName,
  lastName, setLastName,
  username, setUsername,
  yearLevel, setYearLevel,
  department, setDepartment,
  address, setAddress,
  birthday, setBirthday,
  bio, setBio,
  expertise, setExpertise,
  onSaveDetails,
  isSavingDetails,
  saveSuccess,
  saveError,
  onPasswordChange,
  isChangingPassword,
  passwordSuccess,
  passwordError,
}: ProfileSettingsTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Inject password values into a custom event-like call
    (e as any)._passwords = { currentPassword, newPassword, confirmPassword };
    await onPasswordChange(e);
    if (!passwordError) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Details Form */}
      <div className="glass rounded-2xl p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] mb-1 flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-primary" /> Profile Details
          </h2>
          <p className="text-xs text-text-muted">Update your display information, course details, and biography fields.</p>
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium animate-fadeIn">
            ✓ Profile details updated successfully!
          </div>
        )}

        {saveError && (
          <div className="p-3.5 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
            ✗ {saveError}
          </div>
        )}

        <form onSubmit={onSaveDetails} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="p-first-name" className="text-xs font-semibold text-text-secondary">First Name</label>
              <input id="p-first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-middle-name" className="text-xs font-semibold text-text-secondary">Middle Name</label>
              <input id="p-middle-name" type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-last-name" className="text-xs font-semibold text-text-secondary">Last Name</label>
              <input id="p-last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="p-username" className="text-xs font-semibold text-text-secondary">Username / Nickname (No spaces)</label>
            <input id="p-username" type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))} placeholder="e.g. pazmelon" className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" maxLength={50} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="p-email" className="text-xs font-semibold text-text-secondary">Email Address</label>
              <input id="p-email" type="email" value={user?.email || ""} disabled className="w-full px-4 py-2 rounded-xl bg-surface-800/40 border border-border text-sm text-text-muted cursor-not-allowed focus:outline-none text-xs" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-school-id" className="text-xs font-semibold text-text-secondary">School Student ID</label>
              <input id="p-school-id" type="text" value={user?.school_id || ""} disabled className="w-full px-4 py-2 rounded-xl bg-surface-800/40 border border-border text-sm text-text-muted cursor-not-allowed focus:outline-none text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="p-year-level" className="text-xs font-semibold text-text-secondary">Year Level</label>
              <select id="p-year-level" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs">
                <option value="">Select Year Level</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-dept" className="text-xs font-semibold text-text-secondary">Course / Department</label>
              <select id="p-dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs">
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Systems">Information Systems</option>
                <option value="Other">Other Major</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-birthday" className="text-xs font-semibold text-text-secondary">Birthday</label>
              <input id="p-birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="p-address" className="text-xs font-semibold text-text-secondary">Address Details</label>
            <input id="p-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House No, Street, City, Province" className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="p-expertise" className="text-xs font-semibold text-text-secondary">Skills & Expertises (comma separated)</label>
            <input id="p-expertise" type="text" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="e.g. Penetration Testing, Python, Crypto" className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="p-bio" className="text-xs font-semibold text-text-secondary">About Info</label>
            <textarea id="p-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell members about yourself..." className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none text-xs" />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSavingDetails} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer disabled:opacity-50">
              <Save className="w-4 h-4" />
              {isSavingDetails ? "Saving..." : "Save Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="glass rounded-2xl p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)] mb-1 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-accent" /> Change Password
          </h2>
          <p className="text-xs text-text-muted">Ensure your account is protected by updating your security key credentials.</p>
        </div>

        {passwordSuccess && (
          <div className="p-3.5 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium animate-fadeIn">
            ✓ Password updated successfully!
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
            ✗ {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="sec-curr" className="text-xs font-semibold text-text-secondary">Current Password</label>
            <input id="sec-curr" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="sec-new" className="text-xs font-semibold text-text-secondary">New Password</label>
              <input id="sec-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sec-conf" className="text-xs font-semibold text-text-secondary">Confirm New Password</label>
              <input id="sec-conf" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all text-xs" required />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isChangingPassword} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary border border-border text-xs font-semibold transition-all cursor-pointer disabled:opacity-50">
              <Lock className="w-4 h-4 text-accent" />
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
