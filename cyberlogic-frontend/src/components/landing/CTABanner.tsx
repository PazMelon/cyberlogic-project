import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export function CTABanner() {
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
