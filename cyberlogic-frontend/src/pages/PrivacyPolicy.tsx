import { Shield, Eye, Lock, FileText, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useSEO } from "../utils/useSEO";

export default function PrivacyPolicy() {
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  useSEO({
    title: "Privacy Policy",
    description: "Learn how Cyberlogic Club Portal collects, uses, and safeguards member data and credentials.",
  });

  return (
    <div className={isPortal ? "pb-8" : "pt-24 pb-16"}>
      <div className={isPortal ? "" : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"}>
        {/* Breadcrumb (Public Only) */}
        {!isPortal && (
          <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-text-secondary">Privacy Policy</span>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Last Updated: July 10, 2026
          </p>
        </div>

        {/* Document Content */}
        <div className="space-y-8 glass rounded-2xl p-6 sm:p-8 text-text-secondary leading-relaxed border border-border/80 text-left">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
              <Eye className="w-4 h-4 text-primary" />
              <h2>1. Information We Collect</h2>
            </div>
            <p className="text-sm">
              We collect information that you directly provide when registering an account, updating your profile, participating in discussion forums, or chatting in real-time channels:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5">
              <li><strong>Account Credentials:</strong> First name, middle name, last name, username, email address, password, year level, and department.</li>
              <li><strong>Profile Information:</strong> Profile picture (avatar), bio, expertise list, and location.</li>
              <li><strong>Interactive Data:</strong> Real-time chat messages, forum threads, comments, replies, upvotes, and emoji reactions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
              <Lock className="w-4 h-4 text-primary" />
              <h2>2. How We Use Your Data</h2>
            </div>
            <p className="text-sm">
              We utilize collected data to maintain portal security, calculate member reputation points, and host collaborative forums:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5">
              <li>To provide, operate, and maintain the portal services and websocket real-time chat infrastructure.</li>
              <li>To verify club membership approvals and moderate user-generated content.</li>
              <li>To calculate reputation gains based on upvotes, solved thread markings, and active community participation.</li>
              <li>To audit login activities and log administrative actions for security tracking.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
              <FileText className="w-4 h-4 text-primary" />
              <h2>3. Data Retention & Control</h2>
            </div>
            <p className="text-sm">
              Your message history and forum threads are stored on secure databases. Members can manage, edit, or delete profile content:
            </p>
            <p className="text-sm">
              We respect your rights to your personal data. You may update your profile details, reset password configurations in Account Settings at any time, or request account closure and content redacting by contacting the club officers.
            </p>
          </section>

          <section className="space-y-3 border-t border-border/40 pt-6">
            <h2 className="text-text-primary font-bold text-base">Contact Us</h2>
            <p className="text-sm">
              If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at our official channels or email us directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
