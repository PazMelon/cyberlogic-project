import React, { useState } from "react";
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function SecuritySettings() {
  const { updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Compute password strength score (0 to 4)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 1:
        return { label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
      case 2:
        return { label: "Fair", color: "bg-amber-500", text: "text-amber-400" };
      case 3:
        return { label: "Good", color: "bg-sky-500", text: "text-sky-400" };
      case 4:
        return { label: "Strong & Secure", color: "bg-emerald-500", text: "text-emerald-400" };
      default:
        return { label: "Enter password", color: "bg-surface-700", text: "text-text-muted" };
    }
  };

  const strengthInfo = getStrengthLabel(strengthScore);

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
    <div id="security" className="glass rounded-3xl p-6 sm:p-8 border border-border/80 space-y-6 shadow-xl scroll-mt-24 text-left">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Security Credentials & Password</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Manage your password credentials and ensure your account remains securely protected.
            </p>
          </div>
        </div>
      </div>

      {passwordSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold animate-fadeIn flex items-center gap-2">
          <span>✓</span> Your account password has been updated successfully!
        </div>
      )}
      {passwordError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-semibold animate-fadeIn flex items-center gap-2">
          <span>✗</span> {passwordError}
        </div>
      )}

      <form onSubmit={handlePasswordSave} className="space-y-6">
        {/* Current Password Field */}
        <div className="space-y-1.5 max-w-md">
          <label htmlFor="set-currpass" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-text-muted" /> Current Password
          </label>
          <div className="relative">
            <input
              id="set-currpass"
              type={showCurrentPass ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 pr-10 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-accent/60 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPass(!showCurrentPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password & Confirm Password Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/40 pt-5">
          <div className="space-y-1.5">
            <label htmlFor="set-newpass" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                id="set-newpass"
                type={showNewPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-accent/60 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1 pt-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-text-muted">Password Strength</span>
                  <span className={strengthInfo.text}>{strengthInfo.label}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden flex gap-1 p-0.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        step <= strengthScore ? strengthInfo.color : "bg-surface-700/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="set-confpass" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              id="set-confpass"
              type={showNewPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-accent/60 transition-all"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-border/40">
          <button
            type="submit"
            disabled={isChangingPassword}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent to-purple-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-accent/25 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" /> {isChangingPassword ? "Updating password..." : "Update Security Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
