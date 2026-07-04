import { Link } from "react-router";
import { Shield, Code, Globe, Mail } from "lucide-react";

const quickLinks = [
  { label: "Announcements", path: "/announcements" },
  { label: "Events", path: "/events" },
  { label: "Resources", path: "/resources" },
  { label: "About", path: "/about" },
];

const socialLinks = [
  { icon: Globe, label: "Website", href: "#" },
  { icon: Code, label: "Source Code", href: "#" },
  { icon: Mail, label: "Email", href: "mailto:cyberlogic@university.edu" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-[family-name:var(--font-heading)] tracking-tight">
                <span className="text-gradient">Cyber</span>
                <span className="text-text-primary">logic</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              Empowering students through cybersecurity education, hands-on
              workshops, and a collaborative community of tech enthusiasts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-text-muted hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Connect With Us
            </h3>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-lg bg-surface-800 border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <p className="text-sm text-text-muted mt-4">
              cyberlogic@university.edu
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Cyberlogic Club. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-text-muted">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
