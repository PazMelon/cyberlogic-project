import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Calendar,
  Users,
  Trophy,
  Rocket,
  ChevronRight,
  BookOpen,
  Download,
  Mail,
  Cpu,
  Terminal as TerminalIcon,
  Shield,
} from "lucide-react";
import {
  resources,
  clubStats,
} from "../data/mockData";
import { fetchAnnouncements, fetchEvents, fetchBlogs, fetchOfficers } from "../utils/api";
import type { Officer } from "../utils/api";
import type { Announcement, Event, BlogPost } from "../data/mockData";
import Terminal from "../components/Terminal";
import { SkeletonCard, SkeletonLine, SkeletonCircle, SkeletonBox } from "../components/Skeleton";
import { EventCard, AnnouncementCard, BlogCard } from "../components/ui";

/* ============================================
   HERO SECTION
   ============================================ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 lg:py-0">
      {/* Animated Background */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-pulse-glow delay-500" />

      {/* Floating Decorative Elements */}
      <div className="absolute top-32 right-[15%] w-2 h-2 bg-primary rounded-full animate-float" />
      <div className="absolute top-48 left-[20%] w-1.5 h-1.5 bg-accent rounded-full animate-float delay-200" />
      <div className="absolute bottom-40 right-[25%] w-2.5 h-2.5 bg-primary-light rounded-full animate-float delay-300" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-16 lg:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-6 text-left space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-xs font-medium text-primary animate-fade-in-up">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Now accepting new members for SY 2026–2027
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-heading)] leading-[1.1] tracking-tight text-text-primary animate-fade-in-up delay-100">
              Welcome to <br className="hidden sm:inline" />
              <span className="text-gradient">Cyberlogic</span>
              <br />
              <span className="text-text-secondary text-2xl sm:text-3xl md:text-4xl font-normal">
                Where Tech Meets Community
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-text-muted max-w-xl animate-fade-in-up delay-200 leading-relaxed">
              The ultimate tech and digital innovation hub at St. Rita's College of Balingasag. Discover hardware servicing, software productivity, and digital creative arts. Try out our simulated terminal!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2 animate-fade-in-up delay-300">
              <Link
                to="/register"
                className="group px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
              >
                Join the Club
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="px-6 py-3 rounded-xl font-semibold text-sm text-text-secondary border border-border hover:border-primary/30 hover:text-text-primary hover:bg-white/5 transition-all duration-300"
              >
                Learn More
              </Link>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 animate-fade-in-up delay-400">
              {[
                { icon: Users, value: `${clubStats.members}+`, label: "Members" },
                { icon: Calendar, value: `${clubStats.events}+`, label: "Events" },
                { icon: Rocket, value: `${clubStats.projects}+`, label: "Projects" },
                { icon: Trophy, value: `${clubStats.awards}+`, label: "Awards" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass rounded-xl p-3 text-center group hover:border-primary/30 transition-all duration-300"
                >
                  <stat.icon className="w-4 h-4 text-primary mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)]">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Simulated Terminal CLI */}
          <div className="lg:col-span-6 animate-fade-in-up delay-200">
            <Terminal />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   ANNOUNCEMENTS PREVIEW
   ============================================ */
function AnnouncementsPreview({ isLoading }: { isLoading: boolean }) {
  const [latest, setLatest] = useState<Announcement[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAnnouncements();
        setLatest(data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load landing announcements:", err);
      } finally {
        setLocalLoading(false);
      }
    }
    load();
  }, []);

  const activeLoading = isLoading || localLoading;

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Stay Updated
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Latest Announcements
            </h2>
          </div>
          <Link
            to="/announcements"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : latest.length > 0 ? (
            latest.map((item, idx) => (
              <AnnouncementCard key={item.id} announcement={item} index={idx} />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 glass rounded-2xl p-8 border border-border/80 bg-surface-900/20 text-center space-y-4 max-w-lg mx-auto animate-fadeIn relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20 animate-pulse-glow">
                  <Rocket className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)]">No Broadcasts Found</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    All communication systems nominal. No announcements have been published yet. Check back soon for fresh updates!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile "View All" */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/announcements"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            View all announcements <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   BLOG PREVIEW SECTION
   ============================================ */
function BlogPreview({ isLoading }: { isLoading: boolean }) {
  const [latest, setLatest] = useState<BlogPost[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchBlogs();
        setLatest(data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load landing blogs:", err);
      } finally {
        setLocalLoading(false);
      }
    }
    load();
  }, []);

  const activeLoading = isLoading || localLoading;

  return (
    <section className="py-20 lg:py-28 bg-surface-900/40 border-y border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Read Our Thoughts
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Latest from the Blog
            </h2>
          </div>
          <Link
            to="/blogs"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors"
          >
            View all articles <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : latest.length > 0 ? (
            latest.map((item, idx) => (
              <BlogCard key={item.id} blog={item} index={idx} />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 glass rounded-2xl p-8 border border-border/80 bg-surface-900/20 text-center space-y-4 max-w-lg mx-auto animate-fadeIn relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20 animate-pulse-glow">
                  <BookOpen className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)]">No Articles Found</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Check back later! Our members are currently working on writing awesome technical articles and tutorials.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile "View All" */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            View all articles <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   UPCOMING EVENTS
   ============================================ */
function UpcomingEvents({ isLoading }: { isLoading: boolean }) {
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchEvents();
        setUpcoming(data.slice(0, 4));
      } catch (err) {
        console.error("Failed to load landing events:", err);
      } finally {
        setLocalLoading(false);
      }
    }
    load();
  }, []);

  const activeLoading = isLoading || localLoading;

  return (
    <section className="py-20 lg:py-28 bg-surface-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              Don&apos;t Miss Out
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Upcoming Events
            </h2>
          </div>
          <Link
            to="/events"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-light transition-colors"
          >
            All events <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-2xl p-6 flex gap-5 animate-pulse">
                  <SkeletonBox className="w-16 h-16 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLine widthClass="w-1/4" heightClass="h-4" />
                    <SkeletonLine widthClass="w-3/4" heightClass="h-5" />
                    <SkeletonLine widthClass="w-full" heightClass="h-4" />
                  </div>
                </div>
              ))}
            </>
          ) : upcoming.length > 0 ? (
            upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 glass rounded-2xl p-8 border border-border/80 bg-surface-900/20 text-center space-y-4 max-w-lg mx-auto animate-fadeIn relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-50" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto border border-accent/20 animate-pulse-glow">
                  <Calendar className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-heading)]">Upcoming Events Offline</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    We are currently organizing our upcoming workshops, seminars, and hands-on activities. Stay tuned for future announcements!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   RESOURCES HIGHLIGHT
   ============================================ */
function ResourcesHighlight({ isLoading }: { isLoading: boolean }) {
  const featured = resources.slice(0, 4);

  const iconMap: Record<string, React.ReactNode> = {
    code: <BookOpen className="w-5 h-5" />,
    shield: <BookOpen className="w-5 h-5" />,
    "file-text": <BookOpen className="w-5 h-5" />,
    "external-link": <BookOpen className="w-5 h-5" />,
    terminal: <BookOpen className="w-5 h-5" />,
    activity: <BookOpen className="w-5 h-5" />,
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-success">
              Learn & Grow
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Featured Resources
            </h2>
          </div>
          <Link
            to="/resources"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-success hover:text-green-400 transition-colors"
          >
            Browse all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Resource Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-2xl p-5 space-y-4 animate-pulse">
                  <SkeletonBox className="w-10 h-10 rounded-lg" />
                  <SkeletonLine widthClass="w-1/3" heightClass="h-3" />
                  <SkeletonLine widthClass="w-3/4" heightClass="h-5" />
                  <SkeletonLine widthClass="w-full" heightClass="h-4" />
                  <SkeletonLine widthClass="w-5/6" heightClass="h-4" />
                </div>
              ))}
            </>
          ) : (
            featured.map((resource) => (
            <div
              key={resource.id}
              className="glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                {iconMap[resource.icon] || <BookOpen className="w-5 h-5" />}
              </div>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {resource.category}
              </span>
              <h3 className="text-base font-semibold text-text-primary mt-1 mb-2 group-hover:text-primary transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-text-muted line-clamp-2 mb-4">
                {resource.description}
              </p>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> {resource.downloadCount}
                </span>
                <a
                  href={resource.link}
                  className="inline-flex items-center gap-1 text-primary hover:text-primary-light font-medium transition-colors"
                >
                  Access <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   ABOUT / TEAM PREVIEW
   ============================================ */
function AboutPreview({ isLoading }: { isLoading: boolean }) {
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

  // Resolve skills from linked user expertise, or fallback to role defaults
  const getSkills = (officer: Officer | null) => {
    if (!officer) return [];
    if (officer.user?.expertise) {
      return officer.user.expertise.split(",").map((s: string) => s.trim());
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
                    {activeOfficer.name}
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
                    {getSkills(activeOfficer).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2.5 py-0.5 rounded-lg bg-surface-900 border border-border text-[10px] font-medium text-text-secondary hover:border-primary/20 transition-all"
                      >
                        {skill}
                      </span>
                    ))}
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
                      href={`https://${activeOfficer.github}`}
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
                      href={`https://${activeOfficer.linkedin}`}
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
                      <h4 className="text-sm font-bold text-text-primary truncate">{officer.name}</h4>
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

/* ============================================
   CTA BANNER
   ============================================ */
function CTABanner() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/8 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/8 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl lg:text-5xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-4">
          Ready to{" "}
          <span className="text-gradient">Level Up</span>?
        </h2>
        <p className="text-lg text-text-muted mb-10 max-w-xl mx-auto">
          Join a community of passionate students and start your digital innovation
          journey today. No experience required — just curiosity.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-base hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
          >
            Become a Member
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/events"
            className="px-8 py-3.5 rounded-xl font-semibold text-base text-text-secondary border border-border hover:border-primary/30 hover:text-text-primary hover:bg-white/5 transition-all duration-300"
          >
            View Events
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   LANDING PAGE
   ============================================ */
export default function Landing() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HeroSection />
      <AnnouncementsPreview isLoading={isLoading} />
      <BlogPreview isLoading={isLoading} />
      <UpcomingEvents isLoading={isLoading} />
      <ResourcesHighlight isLoading={isLoading} />
      <AboutPreview isLoading={isLoading} />
      <CTABanner />
    </>
  );
}
