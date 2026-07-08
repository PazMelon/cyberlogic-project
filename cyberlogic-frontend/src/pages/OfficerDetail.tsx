import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Calendar, Cpu, Terminal, Shield } from "lucide-react";
import { fetchOfficerById } from "../utils/api";
import type { Officer } from "../utils/api";

export default function OfficerDetail() {
  const { id } = useParams<{ id: string }>();
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadOfficer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchOfficerById(Number(id));
        setOfficer(data);
      } catch (err: any) {
        console.error("Failed to load officer details:", err);
        setError(err.message || "Officer profile not found.");
      } finally {
        setIsLoading(false);
      }
    };
    loadOfficer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 text-center">
        <div className="max-w-md mx-auto p-8 glass rounded-2xl border border-border flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-text-muted">Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (error || !officer) {
    return (
      <div className="pt-32 pb-24 text-center">
        <div className="max-w-md mx-auto p-8 glass rounded-2xl border border-border">
          <h2 className="text-xl font-bold text-error mb-2">Officer Not Found</h2>
          <p className="text-sm text-text-muted mb-6">
            {error || "The profile you are looking for does not exist or has been moved."}
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-light transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to About
          </Link>
        </div>
      </div>
    );
  }

  // Resolve skills from linked user expertise, or fallback to role defaults
  const getSkills = () => {
    if (officer.user?.expertise) {
      return officer.user.expertise.split(",").map((s) => s.trim());
    }
    const r = officer.role.toLowerCase();
    if (r.includes("president") && !r.includes("vice")) {
      return ["Cybersecurity", "Network Architecture", "Leadership"];
    } else if (r.includes("vice president")) {
      return ["UI/UX Design", "Frontend Development", "Graphic Design"];
    } else if (r.includes("secretary")) {
      return ["Technical Writing", "Communications", "Project Management"];
    } else if (r.includes("treasurer")) {
      return ["Financial Planning", "Sponsorships", "Event Logistics"];
    } else if (r.includes("tech") || r.includes("lead")) {
      return ["Full-Stack Dev", "DevOps", "Cybersecurity Audit"];
    }
    return ["Event Management", "Public Relations", "Marketing"];
  };

  const extraDetails = {
    email: officer.email,
    joinedDate: officer.user?.joinedDate ? `Active since ${officer.user.joinedDate.substring(0, 4)}` : "Active member",
    skills: getSkills(),
    github: officer.github,
    linkedin: officer.linkedin,
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          to="/about"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors mb-8 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to About Directory
        </Link>

        {/* Profile Card */}
        <div className="relative overflow-hidden glass rounded-3xl p-8 lg:p-12 border border-border/80">
          {/* Cyber accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 relative z-10">
            {/* Left Column: Avatar & Socials */}
            <div className="flex-shrink-0 text-center space-y-4">
              <div className="relative">
                <img
                  src={officer.avatar}
                  alt={officer.name}
                  className="w-40 h-40 rounded-3xl bg-surface-800 object-cover border border-border/60 shadow-xl shadow-accent/5"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center border border-surface-950">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="text-xs text-text-muted flex items-center justify-center gap-1.5 font-mono uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-accent" /> {extraDetails.joinedDate}
              </div>
            </div>

            {/* Right Column: Bio & Credentials */}
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div>
                <h1 className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-heading)]">
                  {officer.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/25 mt-2">
                  <Cpu className="w-3 h-3" /> {officer.role}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest text-[10px]">Biography</h3>
                <p className="text-base text-text-secondary leading-relaxed font-sans">
                  {officer.bio}
                </p>
                <p className="text-sm text-text-muted leading-relaxed">
                  As the {officer.role} of Cyberlogic Club, {officer.name} is dedicated to promoting digital excellence,
                  empowering fellow peers through hands-on technical skills, and building open-source projects for the campus.
                </p>
              </div>

              {/* Technical Skills */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest text-[10px] flex items-center justify-center md:justify-start gap-1">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> Area of Expertise
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {extraDetails.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-lg bg-surface-900/60 border border-border/80 text-xs font-medium text-text-secondary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-6 border-t border-border/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href={`mailto:${extraDetails.email}`}
                  className="flex items-center justify-center md:justify-start gap-2 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer group"
                >
                  <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="truncate">{extraDetails.email}</span>
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center justify-center md:justify-start gap-2 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer group"
                >
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="truncate">GitHub Profile</span>
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center justify-center md:justify-start gap-2 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer group"
                >
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span className="truncate">LinkedIn Connection</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
