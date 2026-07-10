import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Shield,
  Cpu,
  Terminal as TerminalIcon,
  Mail,
} from "lucide-react";
import { fetchOfficers } from "../../utils/api";
import type { Officer } from "../../utils/api";
import { SkeletonCircle, SkeletonLine } from "../Skeleton";

export function AboutPreview({ isLoading }: { isLoading: boolean }) {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [activeOfficer, setActiveOfficer] = useState<Officer | null>(null);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchOfficers();
        setOfficers(data);
        if (data && data.length > 0) {
          setActiveOfficer(data[0]);
        }
      } catch (err) {
        console.error("Failed to load landing officers:", err);
      } finally {
        setLocalLoading(false);
      }
    }
    load();
  }, []);

  const activeLoading = isLoading || localLoading;

  // Resolve skills from linked user expertise
  const getSkills = (officer: Officer | null) => {
    if (!officer) return [];
    if (officer.user?.expertise) {
      return officer.user.expertise.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <section className="py-20 lg:py-28 bg-surface-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 text-left gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              About Our Team
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Building the Next Generation of <span className="text-gradient">Digital Creators</span>
            </h2>
            <p className="text-sm text-text-muted mt-2 max-w-2xl leading-relaxed">
              Cyberlogic Club is the tech innovation hub at St. Rita's College. Through peer mentorship and hands-on workshops, we turn passive tech users into real builders.
            </p>
          </div>
          <Link
            to="/about"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 text-xs font-semibold transition-all duration-300"
          >
            Directory page <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Content Panel */}
        {activeLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-pulse text-left">
            <div className="lg:col-span-8 glass rounded-3xl p-8 border border-border/40 min-h-[300px] flex flex-col md:flex-row gap-6">
              <SkeletonCircle className="w-32 h-32 bg-surface-800 shrink-0 mx-auto md:mx-0" />
              <div className="flex-1 space-y-3">
                <SkeletonLine widthClass="w-1/3" heightClass="h-6" />
                <SkeletonLine widthClass="w-1/4" heightClass="h-4" />
                <SkeletonLine widthClass="w-full" heightClass="h-4" />
                <SkeletonLine widthClass="w-5/6" heightClass="h-4" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-2xl p-4 flex gap-4 border border-border/40">
                  <SkeletonCircle className="w-10 h-10 bg-surface-850 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLine widthClass="w-1/2" heightClass="h-4" />
                    <SkeletonLine widthClass="w-1/3" heightClass="h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : officers.length > 0 && activeOfficer ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch text-left">
            {/* Active Details Showcase (8 cols) */}
            <div className="lg:col-span-8 glass rounded-3xl p-6 sm:p-8 border border-border/80 relative overflow-hidden flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
              
              {/* Avatar Column */}
              <div className="flex-shrink-0 text-center relative">
                <div className="relative group/avatar">
                  <img
                    src={activeOfficer.avatar}
                    alt={activeOfficer.name}
                    className="w-32 h-32 rounded-2xl bg-surface-800 object-cover border border-border/60 shadow-xl transition-transform duration-300 group-hover/avatar:scale-102"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center border border-surface-950 shadow-md">
                    <Shield className="w-3.5 h-3.5 text-white animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Information Column */}
              <div className="flex-1 space-y-5 text-center md:text-left">
                <div>
                  <h3 className="text-2xl font-extrabold text-text-primary font-[family-name:var(--font-heading)] leading-tight">
                    {activeOfficer.name} {activeOfficer.username && <span className="text-sm font-normal text-text-muted font-mono">(@{activeOfficer.username})</span>}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/25 mt-2.5">
                    <Cpu className="w-3.5 h-3.5 animate-spin [animation-duration:10s]" /> {activeOfficer.role}
                  </span>
                </div>

                <p className="text-xs text-text-muted leading-relaxed font-sans line-clamp-3">
                  {activeOfficer.bio || "No biography details configured for this profile."}
                </p>

                {/* Technical Skills */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center justify-center md:justify-start gap-1 font-mono">
                    <TerminalIcon className="w-3.5 h-3.5 text-primary" /> Area of Expertise
                  </span>
                  <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                    {getSkills(activeOfficer).length > 0 ? (
                      getSkills(activeOfficer).map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-lg bg-surface-900 border border-border text-[10px] font-medium text-text-secondary hover:border-primary/20 transition-all"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-text-muted italic">No area of expertise configured.</span>
                    )}
                  </div>
                </div>

                {/* Social Shortcuts */}
                <div className="pt-3 border-t border-border/30 flex items-center justify-center md:justify-start gap-4">
                  {activeOfficer.email && (
                    <a
                      href={`mailto:${activeOfficer.email}`}
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors group/link"
                    >
                      <Mail className="w-4 h-4 text-primary group-hover/link:scale-110 transition-transform" />
                      <span className="max-w-[140px] truncate">{activeOfficer.email}</span>
                    </a>
                  )}
                  {activeOfficer.github && (
                    <a
                      href={activeOfficer.github.startsWith("http") ? activeOfficer.github : `https://${activeOfficer.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors group/link"
                    >
                      <svg className="w-4 h-4 text-primary group-hover/link:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span className="max-w-[120px] truncate">GitHub</span>
                    </a>
                  )}
                  {activeOfficer.linkedin && (
                    <a
                      href={activeOfficer.linkedin.startsWith("http") ? activeOfficer.linkedin : `https://${activeOfficer.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors group/link"
                    >
                      <svg className="w-4 h-4 text-primary group-hover/link:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      <span className="max-w-[120px] truncate">LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Selection Column (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1 select-none">
              {officers.map((officer) => {
                const isActive = activeOfficer.id === officer.id;
                return (
                  <button
                    key={officer.id}
                    type="button"
                    onClick={() => setActiveOfficer(officer)}
                    className={`glass rounded-2xl p-4 flex gap-4 border text-left transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? "border-primary bg-primary/10 shadow-md shadow-primary/5 scale-[1.01]" 
                        : "border-border/40 bg-surface-900/30 hover:border-primary/30 hover:bg-surface-850/40"
                    }`}
                  >
                    <img
                      src={officer.avatar}
                      alt={officer.name}
                      className="w-11 h-11 rounded-xl object-cover bg-surface-800 border border-border/50 shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {officer.name} {officer.username && <span className="text-xs font-normal text-text-muted font-mono">(@{officer.username})</span>}
                      </h4>
                      <span className="text-[10px] text-accent font-semibold tracking-wider uppercase block truncate">
                        {officer.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Placeholder */
          <div className="glass rounded-3xl p-12 border border-border/80 bg-surface-900/20 text-center space-y-4 max-w-xl mx-auto animate-fadeIn relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20 animate-pulse-glow">
                <Shield className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-heading)]">Officers Directory Offline</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  We are currently organizing and updating our club officers directory. Meet the core coordinators and tech leads once setup is complete!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
