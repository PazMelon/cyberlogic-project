import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Cpu } from "lucide-react";
import { fetchOfficerById } from "../utils/api";
import type { Officer } from "../utils/api";
import { useSEO } from "../utils/useSEO";

export default function OfficerDetail() {
  const { id } = useParams<{ id: string }>();
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: officer ? `${officer.name} — ${officer.role}` : "Loading Officer Profile...",
    description: officer ? officer.bio : undefined,
    keywords: officer ? [officer.role, "Officer Profile", "Cyberlogic Officer"] : undefined,
    image: officer ? officer.avatar : undefined,
    type: "profile",
  });

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

  // Resolve skills from linked user expertise
  const getSkills = () => {
    if (officer.user?.expertise) {
      return officer.user.expertise.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const extraDetails = {
    email: officer.email,
    joinedDate: officer.user?.joinedDate ? `Active since ${officer.user.joinedDate.substring(0, 4)}` : "Active member",
    skills: getSkills(),
    github: officer.github,
    linkedin: officer.linkedin,
  };

  const githubUrl = officer.github
    ? officer.github.startsWith("http")
      ? officer.github
      : `https://${officer.github}`
    : null;

  const linkedinUrl = officer.linkedin
    ? officer.linkedin.startsWith("http")
      ? officer.linkedin
      : `https://${officer.linkedin}`
    : null;

  return (
    <div className="pt-28 pb-20 relative overflow-hidden min-h-screen">
      {/* Background Gradients */}
      <div className="absolute inset-0 cyber-grid opacity-25" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-pulse-glow delay-500" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          to="/about"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-all mb-8 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to About Directory
        </Link>

        {/* Master Showcase Layout - Reversed Order to match mockup */}
        <div className="flex flex-col-reverse lg:flex-row gap-12 items-center lg:items-start">
          
          {/* LEFT PANEL: Text Content & Sections (lg:w-[55%]) */}
          <div className="w-full lg:w-[55%] space-y-8">
            {/* Header: Name and Role */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-extrabold text-primary font-[family-name:var(--font-heading)] leading-tight tracking-tight drop-shadow-md">
                {officer.name}
              </h1>
              <h2 className="text-3xl text-text-primary font-bold">About Me</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-accent/15 text-accent border border-accent/25">
                <Cpu className="w-4 h-4 animate-spin [animation-duration:10s]" /> {officer.role}
              </div>
            </div>

            {/* Biography Text */}
            <p className="text-base md:text-lg text-text-secondary leading-relaxed font-sans font-light">
              {officer.bio || "No biography details configured for this profile."}
            </p>

            {/* The Pill Buttons & Sections Container */}
            <div className="space-y-6 pt-4">
              
              {/* "Education" / Department row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                <div className="w-40 flex-shrink-0 bg-primary/20 text-primary border border-primary/30 rounded-full py-3 px-6 text-center font-bold text-sm shadow-[0_0_15px_rgba(var(--color-primary),0.15)] group-hover:bg-primary/30 group-hover:scale-105 transition-all cursor-default">
                  Education
                </div>
                <div className="flex-1 text-sm text-text-secondary leading-tight border-l-2 border-border/50 pl-4 py-1">
                  <span className="block font-bold text-text-primary mb-0.5">Department & Level</span>
                  {officer.user?.department ? (
                    `${officer.user.department}${officer.user.year_level ? ` - ${officer.user.year_level}` : ""}`
                  ) : (
                    <span className="text-text-muted italic">No education details configured.</span>
                  )}
                </div>
              </div>

              {/* "Experience" / Digital Connections row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                <div className="w-40 flex-shrink-0 bg-primary/20 text-primary border border-primary/30 rounded-full py-3 px-6 text-center font-bold text-sm shadow-[0_0_15px_rgba(var(--color-primary),0.15)] group-hover:bg-primary/30 group-hover:scale-105 transition-all cursor-default">
                  Connections
                </div>
                <div className="flex-1 border-l-2 border-border/50 pl-4 py-1 flex flex-col gap-1.5">
                  <span className="block font-bold text-text-primary text-sm">Digital Presence</span>
                  {(extraDetails.email || githubUrl || linkedinUrl) ? (
                    <div className="flex items-center gap-3">
                      {extraDetails.email && (
                        <a href={`mailto:${extraDetails.email}`} className="text-text-muted hover:text-primary transition-colors">
                          <Mail className="w-4.5 h-4.5" />
                        </a>
                      )}
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors">
                          <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </a>
                      )}
                      {linkedinUrl && (
                        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors">
                          <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-text-muted italic text-xs">No digital connections configured.</span>
                  )}
                </div>
              </div>

              {/* "Skills" row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                <div className="w-40 flex-shrink-0 bg-primary/20 text-primary border border-primary/30 rounded-full py-3 px-6 text-center font-bold text-sm shadow-[0_0_15px_rgba(var(--color-primary),0.15)] group-hover:bg-primary/30 group-hover:scale-105 transition-all cursor-default">
                  Expertise
                </div>
                <div className="flex-1 text-sm text-text-secondary leading-tight border-l-2 border-border/50 pl-4 py-1">
                  <span className="block font-bold text-text-primary mb-0.5">Core Technical Skills</span>
                  {extraDetails.skills.length > 0 ? (
                    extraDetails.skills.join(", ")
                  ) : (
                    <span className="text-text-muted italic">No area of expertise configured.</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Large Image & Decorative shapes (lg:w-[45%]) */}
          <div className="w-full lg:w-[45%] relative mt-8 lg:mt-0">
            {/* The decorative shapes container - inspired by the image's squares and dots */}
            <div className="relative w-full aspect-[4/5] max-w-[450px] mx-auto overflow-visible">
              
              {/* Outer geometric box (like the green square in the mockup) */}
              <div className="absolute top-[10%] bottom-0 left-[10%] right-[10%] border-4 sm:border-[8px] border-primary/20 rounded-xl pointer-events-none" />
              
              {/* Dotted pattern boxes (top right, bottom left) */}
              <div className="absolute top-0 right-[-5%] w-32 h-32 bg-[radial-gradient(var(--color-text-muted)_2px,transparent_2px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
              <div className="absolute bottom-[5%] left-[-5%] w-32 h-32 bg-[radial-gradient(var(--color-primary)_2px,transparent_2px)] [background-size:12px_12px] opacity-20 pointer-events-none" />

              {/* Concentric circles (like the radar lines in the mockup) */}
              <div className="absolute top-1/2 left-[-15%] -translate-y-1/2 w-48 h-48 rounded-full border-t border-r border-primary/30 opacity-50 pointer-events-none" />
              <div className="absolute top-1/2 left-[-20%] -translate-y-1/2 w-56 h-56 rounded-full border-t border-r border-primary/20 opacity-40 pointer-events-none" />
              <div className="absolute top-1/2 left-[-25%] -translate-y-1/2 w-64 h-64 rounded-full border-t border-r border-primary/10 opacity-30 pointer-events-none" />

              {/* Squiggly lines / accent marks */}
              <div className="absolute top-[30%] left-[-15%] text-primary opacity-60 pointer-events-none hidden sm:block">
                <svg width="24" height="60" viewBox="0 0 24 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 0 Q24 7.5 12 15 T12 30 Q24 37.5 12 45 T12 60" />
                </svg>
              </div>
              <div className="absolute top-[40%] right-[-15%] text-primary opacity-60 pointer-events-none hidden sm:block">
                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M0 10 Q5 0 10 10 T20 10 Q25 0 30 10 T40 10" />
                </svg>
              </div>

              {/* Central image wrapper */}
              <div className="absolute inset-x-8 inset-y-8 z-10">
                <img
                  src={officer.avatar}
                  alt={officer.name}
                  className="w-full h-full object-cover rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-border/60 transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
