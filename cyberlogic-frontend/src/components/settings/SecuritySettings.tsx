import React, { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function SecuritySettings() {
  const { updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div id="security" className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-5 scroll-mt-20">
      <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
        <Lock className="w-4 h-4 text-accent" /> Security Credentials
      </h2>

      {passwordSuccess && (
        <div className="p-3 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium animate-fadeIn">
          ✓ Password changed successfully!
        </div>
      )}
      {passwordError && (
        <div className="p-3 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
          ✗ {passwordError}
        </div>
      )}

      <form onSubmit={handlePasswordSave} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="set-currpass" className="text-[10px] font-semibold text-text-secondary uppercase">Current Password</label>
          <input
            id="set-currpass"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="set-newpass" className="text-[10px] font-semibold text-text-secondary uppercase">New Password</label>
            <input
              id="set-newpass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="set-confpass" className="text-[10px] font-semibold text-text-secondary uppercase">Confirm New Password</label>
            <input
              id="set-confpass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isChangingPassword}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary border border-border text-xs font-semibold transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-accent" /> {isChangingPassword ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
