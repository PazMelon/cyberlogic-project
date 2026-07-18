import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Globe, Code, Mail } from "lucide-react";
import { fetchSiteSettings } from "../utils/api";

const quickLinks = [
  { label: "Announcements", path: "/announcements" },
  { label: "Blogs", path: "/blogs" },
  { label: "Events", path: "/events" },
  { label: "Resources", path: "/resources" },
  { label: "About", path: "/about" },
];

// Custom Brand SVGs to avoid old Lucide version compatibility issues
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch((err) => console.error("Failed to load footer settings:", err));
  }, []);

  // Build social links list dynamically from settings
  const socialLinks = [];
  if (settings.connect_website) {
    socialLinks.push({ icon: Globe, label: "Website", href: settings.connect_website });
  }
  if (settings.connect_github) {
    socialLinks.push({ icon: GithubIcon, label: "GitHub", href: settings.connect_github });
  }
  if (settings.connect_linkedin) {
    socialLinks.push({ icon: LinkedinIcon, label: "LinkedIn", href: settings.connect_linkedin });
  }
  if (settings.connect_facebook) {
    socialLinks.push({ icon: FacebookIcon, label: "Facebook", href: settings.connect_facebook });
  }
  if (settings.connect_twitter) {
    socialLinks.push({ icon: TwitterIcon, label: "Twitter", href: settings.connect_twitter });
  }
  if (settings.connect_instagram) {
    socialLinks.push({ icon: InstagramIcon, label: "Instagram", href: settings.connect_instagram });
  }
  if (settings.connect_email) {
    socialLinks.push({ icon: Mail, label: "Email", href: `mailto:${settings.connect_email}` });
  }

  // Use fallbacks if none are configured in settings
  if (socialLinks.length === 0) {
    socialLinks.push(
      { icon: Globe, label: "Website", href: "#" },
      { icon: Code, label: "Source Code", href: "#" },
      { icon: Mail, label: "Email", href: "mailto:cyberlogic@university.edu" }
    );
  }

  return (
    <footer className="border-t border-border bg-surface-950 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <img src="/icons.svg" alt="Cyberlogic" className="w-18 h-18 object-contain" />
              </div>
              <span className="text-4xl font-bold font-[family-name:var(--font-heading)] tracking-tight">
                <span className="text-gradient">Cyber</span>
                <span className="text-text-primary">logic</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              Empowering students through technology education, hands-on
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
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="w-10 h-10 rounded-lg bg-surface-800 border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <p className="text-sm text-text-muted mt-4">
              {settings.connect_email || "cyberlogic@university.edu"}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Cyberlogic Club. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-text-muted">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
