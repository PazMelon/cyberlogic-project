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
} from "lucide-react";
import {
  resources,
  teamMembers,
  clubStats,
} from "../data/mockData";
import { fetchAnnouncements, fetchEvents } from "../utils/api";
import type { Announcement, Event } from "../data/mockData";
import Terminal from "../components/Terminal";
import { SkeletonCard, SkeletonLine, SkeletonCircle, SkeletonBox } from "../components/Skeleton";
import { EventCard, AnnouncementCard } from "../components/ui";

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
              The premier student cybersecurity and technology club. Learn, compete, collaborate, 
              and grow with a community of passionate tech enthusiasts. Try out our simulated terminal!
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
                    We are currently organizing our upcoming workshops, seminars, and capture-the-flag competitions. Stay tuned for future announcements!
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
  const officers = teamMembers.slice(0, 4);

  return (
    <section className="py-20 lg:py-28 bg-surface-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              About Us
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2 mb-6">
              Building the Next Generation of{" "}
              <span className="text-gradient">Cyber Defenders</span>
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              Cyberlogic Club is a student-led organization dedicated to
              advancing cybersecurity knowledge, fostering collaboration, and
              preparing members for careers in information security and
              technology.
            </p>
            <p className="text-text-muted leading-relaxed mb-8">
              Through hands-on workshops, capture-the-flag competitions,
              industry talks, and peer mentorship, we create an environment
              where curiosity thrives and skills are sharpened.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 font-medium transition-all duration-300"
            >
              Learn more about us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-2 gap-4">
            {isLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass rounded-2xl p-5 text-center space-y-3 animate-pulse">
                    <SkeletonCircle className="w-16 h-16 mx-auto bg-surface-800" />
                    <SkeletonLine widthClass="w-2/3" heightClass="h-4" className="mx-auto" />
                    <SkeletonLine widthClass="w-1/2" heightClass="h-3" className="mx-auto" />
                  </div>
                ))}
              </>
            ) : (
              officers.map((member) => (
                <div
                  key={member.id}
                  className="glass rounded-2xl p-5 text-center hover:border-primary/20 transition-all duration-300 group"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-16 h-16 rounded-full mx-auto mb-3 bg-surface-700 group-hover:ring-2 group-hover:ring-primary/30 transition-all"
                  />
                  <h4 className="text-sm font-semibold text-text-primary">
                    {member.name}
                  </h4>
                  <span className="text-xs text-primary font-medium">
                    {member.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
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
          Join a community of passionate students and start your cybersecurity
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
      <UpcomingEvents isLoading={isLoading} />
      <ResourcesHighlight isLoading={isLoading} />
      <AboutPreview isLoading={isLoading} />
      <CTABanner />
    </>
  );
}
