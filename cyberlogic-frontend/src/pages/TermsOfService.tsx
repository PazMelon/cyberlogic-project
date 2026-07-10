import { FileText, ShieldAlert, Award, Power, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useSEO } from "../utils/useSEO";

export default function TermsOfService() {
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  useSEO({
    title: "Terms of Service",
    description: "Read the Acceptable Use Policy and Code of Conduct of Cyberlogic Club Portal.",
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
            <span className="text-text-secondary">Terms of Service</span>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Last Updated: July 10, 2026
          </p>
        </div>

        {/* Document Content */}
        <div className="space-y-8 glass rounded-2xl p-6 sm:p-8 text-text-secondary leading-relaxed border border-border/80 text-left">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <h2>1. Code of Conduct</h2>
            </div>
            <p className="text-sm">
              Cyberlogic Club is committed to providing a harassment-free and inclusive collaborative space. As a member, you agree to:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5">
              <li>Be respectful and collaborative in all real-time chat rooms and public forums.</li>
              <li>Avoid sharing spam, malicious links, piracy tools, or abusive language.</li>
              <li>Respect the decisions made by the moderators and administrators.</li>
              <li>Write helpful, informative content in forum threads and comment sections.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
              <Award className="w-4 h-4 text-primary" />
              <h2>2. Reputation & Gamification Policy</h2>
            </div>
            <p className="text-sm">
              The portal features reputation points, badges, and levels designed to reward educational contributions:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5">
              <li>Reputation gains must be earned organically (e.g., sharing resources, coding tutorials, or helping members solve issues).</li>
              <li>Manipulating reputation points (like cross-voting with secondary accounts or spamming upvotes) is strictly prohibited.</li>
              <li>Abuse of voting mechanisms will result in a reset of reputation stats and potential account restriction.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
              <Power className="w-4 h-4 text-primary" />
              <h2>3. Account Suspension & Termination</h2>
            </div>
            <p className="text-sm">
              The administrators reserve the right to suspend or terminate portal access for users who violate the terms of acceptable use:
            </p>
            <p className="text-sm">
              Moderators may delete messages, lock forum threads, or restrict posting capabilities if conduct issues arise. Repeat offenses or severe misconduct will result in permanent removal from the Cyberlogic Club Portal.
            </p>
          </section>

          <section className="space-y-3 border-t border-border/40 pt-6">
            <h2 className="text-text-primary font-bold text-base">Acceptance of Terms</h2>
            <p className="text-sm">
              By creating an account, logging into the portal, or contributing contents, you agree to comply fully with these terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
