import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, Eye, EyeOff, Mail, Lock, User, CreditCard, ArrowLeft, Users, Trophy, BookOpen, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { clubStats } from "../data/mockData";
import { fetchClubStats } from "../utils/api";

export default function Register() {
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    school_id: "",
    department: "Information Technology",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ members: 0, events: 0, projects: 0, awards: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchClubStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load club stats in Register page", err);
        setStats({
          members: clubStats.members,
          events: clubStats.events,
          projects: clubStats.projects,
          awards: clubStats.awards,
        });
      } finally {
        setIsLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  const updateField = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { confirmPassword, agreedToTerms, ...registrationData } = form;
      await register(registrationData);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-4">
            Join the <span className="text-gradient">Cyberlogic</span> Community
          </h2>
          <p className="text-text-muted leading-relaxed mb-10">
            Become part of the premier student tech and digital innovation club. Access exclusive resources,
            connect with like-minded peers, and accelerate your tech career.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { icon: Users, value: isLoadingStats ? "..." : `${stats.members}+`, label: "Active Members" },
              { icon: Trophy, value: isLoadingStats ? "..." : `${stats.awards}+`, label: "Awards Won" },
              { icon: BookOpen, value: isLoadingStats ? "..." : `${stats.events}+`, label: "Events Held" },
              { icon: Shield, value: isLoadingStats ? "..." : `${stats.projects}+`, label: "Projects Built" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <stat.icon className="w-5 h-5 text-accent mx-auto mb-2" />
                <div className="text-xl font-bold text-text-primary font-[family-name:var(--font-heading)]">
                  {stat.value}
                </div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="glass rounded-xl p-5 text-left">
            <p className="text-sm text-text-secondary italic leading-relaxed mb-3">
              &ldquo;Joining Cyberlogic was the best decision I made in university. The community, the workshops,
              the competitions — it completely changed my career trajectory.&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <img
                src="https://api.dicebear.com/9.x/avataaars/svg?seed=sofia"
                alt="Sofia Navarro"
                className="w-8 h-8 rounded-full bg-surface-700"
              />
              <div>
                <p className="text-xs font-semibold text-text-primary">Sofia Navarro</p>
                <p className="text-[10px] text-text-muted">Founding Member, Class of 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center relative px-4 py-12 overflow-y-auto">
        <div className="absolute inset-0 cyber-grid opacity-10 lg:hidden" />
        <div className="absolute bottom-1/3 -left-32 w-64 h-64 bg-accent/8 rounded-full blur-[100px] lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          {isSubmitted ? (
            <div className="glass rounded-2xl p-8 border border-border/80 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/5 animate-pulse">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
                  Registration Complete!
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Your account has been created, but you cannot use it yet because it requires administrator approval.
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  Please check your school email for updates, or try logging in again later once your account has been verified.
                </p>
              </div>

              {/* Status Roadmap */}
              <div className="text-left space-y-4 p-4 rounded-xl bg-surface-900/40 border border-border/40 text-xs">
                <h3 className="font-bold text-text-secondary uppercase tracking-wider text-[10px]">What happens next?</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center flex-shrink-0 text-[10px] text-success font-bold">1</div>
                    <div>
                      <p className="font-semibold text-text-primary">Account Created</p>
                      <p className="text-text-muted mt-0.5">Your credentials have been securely stored in our database.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-[10px] text-amber-400 font-bold">2</div>
                    <div>
                      <p className="font-semibold text-text-primary">Administrator Approval</p>
                      <p className="text-text-muted mt-0.5">A club administrator or moderator will review and approve your registration.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-surface-800 border border-border flex items-center justify-center flex-shrink-0 text-[10px] text-text-muted font-bold">3</div>
                    <div>
                      <p className="font-semibold text-text-muted">Notification & Login</p>
                      <p className="text-text-muted mt-0.5">Check your email for verification alerts, or try logging in again later.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              >
                Go to Login Page
              </button>
            </div>
          ) : (
            <>
              {/* Back to Home */}
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
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
                Create your account
              </h1>
              <p className="text-sm text-text-muted mb-4">
                Join the Cyberlogic community today
              </p>

              {/* Error Banner */}
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-error/10 border border-error/25 flex items-start gap-2.5 text-xs text-error font-medium animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* First Name */}
                <div>
                  <label htmlFor="reg-first-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="reg-first-name"
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={form.first_name}
                      onChange={(e) => updateField("first_name", e.target.value)}
                      placeholder="John"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                    />
                  </div>
                </div>

                {/* Middle Name and Last Name in the same row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-middle-name" className="block text-sm font-medium text-text-secondary mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                      Middle Name <span className="text-text-muted text-xs font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        id="reg-middle-name"
                        type="text"
                        disabled={isSubmitting}
                        value={form.middle_name}
                        onChange={(e) => updateField("middle_name", e.target.value)}
                        placeholder="A."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-last-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        id="reg-last-name"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={form.last_name}
                        onChange={(e) => updateField("last_name", e.target.value)}
                        placeholder="Doe"
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                      />
                    </div>
                  </div>
                </div>

                {/* School ID */}
                <div>
                  <label htmlFor="reg-school-id" className="block text-sm font-medium text-text-secondary mb-1.5">
                    School ID / Student ID
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="reg-school-id"
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={form.school_id}
                      onChange={(e) => updateField("school_id", e.target.value)}
                      placeholder="2025-00123"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                    />
                  </div>
                </div>

                {/* School Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-text-secondary mb-1.5">
                    School Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      disabled={isSubmitting}
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="reg-department" className="block text-sm font-medium text-text-secondary mb-1.5">
                    Department
                  </label>
                  <select
                    id="reg-department"
                    disabled={isSubmitting}
                    value={form.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55 cursor-pointer"
                  >
                    <option value="Information Technology">Information Technology</option>
                    <option value="Teacher Education">Teacher Education</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Criminal Justice Education">Criminal Justice Education</option>
                    <option value="Hospitality Management">Hospitality Management</option>
                    <option value="RVM-TTP">RVM-TTP</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-text-secondary mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={isSubmitting}
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
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

                {/* Confirm Password */}
                <div>
                  <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-text-secondary mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="reg-confirm-password"
                      type={showConfirm ? "text" : "password"}
                      required
                      disabled={isSubmitting}
                      value={form.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-2.5 rounded-xl bg-surface-800 border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-55"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.agreedToTerms}
                      disabled={isSubmitting}
                      onChange={(e) => updateField("agreedToTerms", e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-border bg-surface-800 text-primary focus:ring-primary/20 focus:ring-offset-0"
                    />
                    <span className="text-sm text-text-muted leading-snug">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:text-primary-light">Terms of Service</a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:text-primary-light">Privacy Policy</a>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 mt-2 disabled:opacity-50 disabled:transform-none"
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted">or sign up with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Social Sign-ups */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-secondary hover:bg-surface-700 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-secondary hover:bg-surface-700 transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <p className="text-center text-sm text-text-muted mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
