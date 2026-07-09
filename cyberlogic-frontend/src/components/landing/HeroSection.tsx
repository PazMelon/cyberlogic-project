import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowRight, Calendar, Users, Rocket, Trophy } from "lucide-react";
import { clubStats } from "../../data/mockData";
import { fetchClubStats } from "../../utils/api";
import Terminal from "../Terminal";
import { Badge } from "../ui";

export function HeroSection() {
  const [stats, setStats] = useState({ members: 0, events: 0, projects: 0, awards: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchClubStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load club stats", err);
        // Fallback to static mock values if API fails
        setStats({
          members: clubStats.members,
          events: clubStats.events,
          projects: clubStats.projects,
          awards: clubStats.awards,
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

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
            <Badge
              variant="primary"
              size="sm"
              uppercase={false}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-xs font-medium text-primary animate-fade-in-up w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Now accepting new members for SY 2026–2027
            </Badge>

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
                { icon: Users, value: isLoading ? "..." : `${stats.members}+`, label: "Members" },
                { icon: Calendar, value: isLoading ? "..." : `${stats.events}+`, label: "Events" },
                { icon: Rocket, value: isLoading ? "..." : `${stats.projects}+`, label: "Projects" },
                { icon: Trophy, value: isLoading ? "..." : `${stats.awards}+`, label: "Awards" },
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
