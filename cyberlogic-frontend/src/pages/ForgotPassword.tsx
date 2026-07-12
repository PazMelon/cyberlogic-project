import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Shield, Mail, Lock, ArrowLeft, AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../context/AuthContext";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await apiRequest("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to request password reset link.");
      }

      setSuccessMessage(data.message || "Reset link sent to your email!");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiRequest("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to reset password.");
      }

      setSuccessMessage("Your password has been reset successfully. You can now log in.");
      setIsResetSuccess(true);
      setPassword("");
      setPasswordConfirmation("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResetMode = !!token && !!emailParam;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding / Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="absolute top-1/4 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-24 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-4">
            <span className="text-gradient">Cyber</span>logic Club
          </h2>
          <p className="text-text-muted leading-relaxed mb-8">
            Access the member portal to connect with fellow members, participate in forums,
            join the chat lounge, and explore our curated resources.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center relative px-4 py-12">
        <div className="absolute inset-0 cyber-grid opacity-10 lg:hidden" />
        <div className="absolute top-1/3 -right-32 w-64 h-64 bg-primary/8 rounded-full blur-[100px] lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          {/* Back to Login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-[family-name:var(--font-heading)]">
              <span className="text-gradient">Cyber</span><span className="text-text-primary">logic</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-1">
            {isResetSuccess
              ? "Password Reset Successful"
              : isResetMode
              ? "Reset Password"
              : "Forgot Password?"}
          </h1>
          <p className="text-sm text-text-muted mb-4">
            {isResetSuccess
              ? "Your password has been successfully updated"
              : isResetMode
              ? "Set a new secure password for your account"
              : "Enter your email and we'll send you a password reset link"}
          </p>

          {/* Alert Banners */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/25 flex items-start gap-2.5 text-xs text-error font-medium animate-fadeIn">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-error" />
              <span>{error}</span>
            </div>
          )}

          {!isResetSuccess && successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/25 flex items-start gap-2.5 text-xs text-success font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-success" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form / Content Switch */}
          {isResetSuccess ? (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Your credentials have been securely updated. You can now use your new password to sign into the system.
              </p>
              <Link
                to="/login"
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 text-center transition-all duration-300 hover:-translate-y-0.5"
              >
                Go to Login
              </Link>
            </div>
          ) : isResetMode ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    required
                    readOnly
                    value={email}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    disabled={isSubmitting}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordConfirmation}
                    disabled={isSubmitting}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestLink} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    disabled={isSubmitting}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? "Sending Link..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <span className="text-sm text-text-muted">
              Remembered your password?{" "}
              <Link to="/login" className="text-primary hover:text-primary-light transition-colors font-medium">
                Log In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
