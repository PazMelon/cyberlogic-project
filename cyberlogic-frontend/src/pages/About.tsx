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
import { fetchSiteSettings, fetchOfficers, submitContactMessage } from "../utils/api";
import { useDialog } from "../utils/useDialog";
import { useSEO } from "../utils/useSEO";

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

  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useDialog();

  useSEO({
    title: "About Us & Club History",
    description: `About Cyberlogic Club: Mission: ${mission}. Vision: ${vision}. Values: ${values}`,
    keywords: ["about us", "club history", "officers", "organization mission", "student organization"],
  });

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
          setEmail(settings.connect_email || "");
          setAddress(settings.connect_address || "");
          setPhone(settings.connect_phone || "");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showAlert({
        title: "Missing Fields",
        message: "Please fill in all form fields before sending.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitContactMessage(formData);
      showAlert({
        title: "Message Sent!",
        message: response.message || "Thank you! Your message has been received.",
        type: "success",
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (err: any) {
      showAlert({
        title: "Submission Failed",
        message: err.message || "An error occurred while sending your message. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="text-center mb-20 reveal-element reveal-fade-in-up">
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
          ].map((item, idx) => {
            const delayClass = idx === 0 
              ? "reveal-element reveal-fade-in-up" 
              : idx === 1 
              ? "reveal-element reveal-fade-in-up reveal-delay-100" 
              : "reveal-element reveal-fade-in-up reveal-delay-200";
            return (
              <div
                key={item.title}
                className={`glass rounded-2xl p-8 text-center hover:border-primary/20 transition-all duration-300 group ${delayClass}`}
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
          );
        })}
        </div>

        {/* History Timeline */}
        <div className="mb-20">
          <div className="text-center mb-12 reveal-element reveal-fade-in-up">
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

            {history.map((event, idx) => {
              const revealDir = idx % 2 === 0 ? "reveal-slide-in-left" : "reveal-slide-in-right";
              return (
                <div
                  key={`${event.year}-${idx}`}
                  className={`relative flex items-start gap-6 mb-10 reveal-element reveal-duration-2s ${revealDir} ${
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
            );
          })}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <div className="text-center mb-12 reveal-element reveal-fade-in-up">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              The People
            </span>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary mt-2">
              Meet Our Officers
            </h2>
          </div>
          {officers.length > 0 ? (
            <div className="relative max-w-6xl mx-auto px-4 md:px-12 reveal-element reveal-zoom-in">
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
                            {member.username && (
                              <span className="text-xs text-text-muted font-mono block mt-0.5">@{member.username}</span>
                            )}
                            <span className="text-sm font-semibold text-accent uppercase tracking-wider block mt-1">
                              {member.role}
                            </span>
                            <p className="text-xs text-text-muted mt-3 line-clamp-3 leading-relaxed">
                              {member.bio || "No biography details configured for this profile."}
                            </p>
                          </div>
                          {(member.email || member.github || member.linkedin) && (
                            <div className="pt-3 mt-4 border-t border-border/30 flex items-center justify-center gap-3">
                              {member.email && (
                                <a
                                  href={`mailto:${member.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-8 h-8 rounded-lg bg-surface-800 border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                                  aria-label="Email"
                                >
                                  <Mail className="w-4 h-4" />
                                </a>
                              )}
                              {member.github && (
                                <a
                                  href={member.github.startsWith("http") ? member.github : `https://${member.github}`}
                                  onClick={(e) => e.stopPropagation()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-lg bg-surface-800 border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                                  aria-label="GitHub"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                  </svg>
                                </a>
                              )}
                              {member.linkedin && (
                                <a
                                  href={member.linkedin.startsWith("http") ? member.linkedin : `https://${member.linkedin}`}
                                  onClick={(e) => e.stopPropagation()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-lg bg-surface-800 border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                                  aria-label="LinkedIn"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                  </svg>
                                </a>
                              )}
                            </div>
                          )}
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
                {email && (
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <Mail className="w-4 h-4 text-primary" />
                    {email}
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <MapPin className="w-4 h-4 text-primary" />
                    {address}
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <Phone className="w-4 h-4 text-primary" />
                    {phone}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Your email"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Your message"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none disabled:opacity-50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : "Send Message"} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
