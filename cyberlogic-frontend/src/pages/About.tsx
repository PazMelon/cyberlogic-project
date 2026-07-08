import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ChevronRight,
  ChevronLeft,
  Target,
  Eye,
  Heart,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Shield,
} from "lucide-react";
import { fetchSiteSettings, fetchOfficers } from "../utils/api";

const defaultHistory = [
  {
    year: "2020",
    title: "Club Founded",
    desc: "Cyberlogic Club was established by a group of technology-passionate students to bridge the gap between classroom theory and real-world application.",
  },
  {
    year: "2021",
    title: "First Bootcamp",
    desc: "Hosted our first inter-departmental digital design showcase and hardware troubleshooting bootcamp.",
  },
  {
    year: "2022",
    title: "Innovation Hub Inauguration",
    desc: "Opened our dedicated computer servicing and digital design hub with custom workspace tools.",
  },
  {
    year: "2023",
    title: "100+ Members",
    desc: "Reached over 100 active members and launched our online learning platform.",
  },
  {
    year: "2024",
    title: "Campus Recognition",
    desc: "Recognized as one of the most innovative and active student organizations at St. Rita's College.",
  },
  {
    year: "2026",
    title: "Portal Launch",
    desc: "Launched the Cyberlogic Club Portal — a centralized hub for members and resources.",
  },
];

export default function About() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [startIndex, setStartIndex] = useState(0);

  const [mission, setMission] = useState("To empower students with practical tech and digital skills through hands-on workshops in hardware, software, and creative digital arts.");
  const [vision, setVision] = useState("To be the leading student technology hub, fostering creative problem-solvers and builders of the digital future.");
  const [values, setValues] = useState("Curiosity, collaboration, integrity, and continuous learning. We believe in open knowledge sharing and supporting each other's growth.");
  const [history, setHistory] = useState<typeof defaultHistory>([]);
  const [officers, setOfficers] = useState<any[]>([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [settings, fetchedOfficers] = await Promise.all([
          fetchSiteSettings(),
          fetchOfficers()
        ]);

        if (settings) {
          if (settings.about_mission) setMission(settings.about_mission);
          if (settings.about_vision) setVision(settings.about_vision);
          if (settings.about_values) setValues(settings.about_values);
          if (settings.about_history) {
            try {
              setHistory(JSON.parse(settings.about_history));
            } catch {
              setHistory(defaultHistory);
            }
          } else {
            setHistory(defaultHistory);
          }
        } else {
          setHistory(defaultHistory);
        }

        if (fetchedOfficers && fetchedOfficers.length > 0) {
          setOfficers(fetchedOfficers);
        } else {
          setOfficers([]);
        }
      } catch (err) {
        console.error("Failed to load about page details from database", err);
        setHistory(defaultHistory);
        setOfficers([]);
      }
    };
    loadPageData();
  }, []);

  const getVisibleCount = () => {
    if (windowWidth < 640) return 1;
    if (windowWidth < 1024) return 2;
    return 4;
  };

  const visibleCount = getVisibleCount();
  const maxIndex = Math.max(0, officers.length - visibleCount);

  const handlePrev = () => {
    setStartIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-10">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-text-secondary">About</span>
        </div>

        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-4xl lg:text-5xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-4">
            About{" "}
            <span className="text-gradient">Cyberlogic Club</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            A student-led organization dedicated to advancing tech and digital innovation, 
            fostering collaboration, and building the next generation of tech leaders.
          </p>
        </div>

        {/* Mission, Vision, Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: Target,
              title: "Our Mission",
              description: mission,
              color: "text-primary",
              bgColor: "bg-primary/10",
            },
            {
              icon: Eye,
              title: "Our Vision",
              description: vision,
              color: "text-accent",
              bgColor: "bg-accent/10",
            },
            {
              icon: Heart,
              title: "Our Values",
              description: values,
              color: "text-success",
              bgColor: "bg-success/10",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass rounded-2xl p-8 text-center hover:border-primary/20 transition-all duration-300 group"
            >
              <div
                className={`w-14 h-14 rounded-xl ${item.bgColor} flex items-center justify-center ${item.color} mx-auto mb-5 group-hover:scale-110 transition-transform`}
              >
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3 font-[family-name:var(--font-heading)]">
                {item.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* History Timeline */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Our Journey
            </span>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Club History
            </h2>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border" />

            {history.map((event, idx) => (
              <div
                key={event.year}
                className={`relative flex items-start gap-6 mb-10 ${
                  idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-surface-950 z-10" />

                {/* Content */}
                <div
                  className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] glass rounded-xl p-5 ${
                    idx % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                  }`}
                >
                  <span className="text-xs font-bold text-primary">{event.year}</span>
                  <h4 className="text-base font-semibold text-text-primary mt-1 mb-1">
                    {event.title}
                  </h4>
                  <p className="text-sm text-text-muted">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              The People
            </span>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Meet Our Officers
            </h2>
          </div>
          {officers.length > 0 ? (
            <div className="relative max-w-6xl mx-auto px-4 md:px-12">
              {/* Arrows */}
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-900/80 border border-border/80 flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/45 hover:bg-surface-850 hover:-translate-x-0.5 transition-all cursor-pointer z-20 shadow-md shadow-accent/5"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-900/80 border border-border/80 flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/45 hover:bg-surface-850 hover:translate-x-0.5 transition-all cursor-pointer z-20 shadow-md shadow-accent/5"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Viewport */}
              <div className="overflow-hidden py-4 px-1">
                <div
                  className="flex transition-transform duration-500 ease-out gap-6"
                  style={{
                    transform: `translateX(-${startIndex * (100 / visibleCount)}%)`,
                  }}
                >
                  {officers.map((member) => (
                    <div
                      key={member.id}
                      className="flex-shrink-0"
                      style={{
                        width: `calc(100% / ${visibleCount} - ${24 * (visibleCount - 1) / visibleCount}px)`,
                      }}
                    >
                      <Link
                        to={`/about/officers/${member.id}`}
                        className="block group h-full cursor-pointer text-left"
                      >
                        <div className="glass rounded-2xl p-6 text-center hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 h-full flex flex-col justify-between">
                          <div>
                            <div className="relative inline-block mb-4">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-24 h-24 rounded-full mx-auto bg-surface-700 group-hover:ring-2 group-hover:ring-accent/30 transition-all object-cover"
                              />
                              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-lg bg-accent/25 border border-accent/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Shield className="w-3.5 h-3.5 text-accent" />
                              </div>
                            </div>
                            <h4 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                              {member.name}
                            </h4>
                            <span className="text-sm font-semibold text-accent uppercase tracking-wider block mt-1">
                              {member.role}
                            </span>
                            <p className="text-xs text-text-muted mt-3 line-clamp-3 leading-relaxed">
                              {member.bio || "No biography details configured for this profile."}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicator dots */}
              {officers.length > visibleCount && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: Math.max(0, officers.length - visibleCount + 1) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setStartIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        startIndex === idx
                          ? "bg-accent w-6 shadow-sm shadow-accent/50"
                          : "bg-surface-800 hover:bg-surface-750"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
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

        {/* Contact Section */}
        <div className="glass rounded-2xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Get in Touch
              </span>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2 mb-4">
                Contact Us
              </h2>
              <p className="text-text-muted mb-6">
                Have questions about the club? Want to collaborate or sponsor an
                event? We&apos;d love to hear from you.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Mail className="w-4 h-4 text-primary" />
                  cyberlogic@university.edu
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <MapPin className="w-4 h-4 text-primary" />
                  Room 301, Building A, University Campus
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Phone className="w-4 h-4 text-primary" />
                  +63 912 345 6789
                </div>
              </div>
            </div>

            {/* Contact Form (non-functional) */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div>
                <textarea
                  rows={4}
                  placeholder="Your message"
                  className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Send Message <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
