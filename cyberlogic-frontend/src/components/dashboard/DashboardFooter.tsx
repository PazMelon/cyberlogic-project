import { Shield } from "lucide-react";

export function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto pt-8 pb-6 text-text-muted">
      {/* Sleek Gradient Cyber-Line Separator */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-gradient-to-r from-primary/50 to-accent/50 blur-[1px]" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] tracking-wider uppercase font-semibold">
        {/* Brand Copyright with pulsing status */}
        <div className="flex items-center gap-2.5">
          <Shield className="w-3.5 h-3.5 text-primary/70" />
          <p className="font-[family-name:var(--font-heading)]">
            &copy; {currentYear} <span className="text-text-primary">Cyber</span><span className="text-primary-light">logic</span> Club. All rights reserved.
          </p>
          <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-success/80 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="System Online" />
        </div>

        {/* Links with cyber hover effects */}
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="hover:text-primary transition-all duration-300 relative group py-0.5"
          >
            Terms of Service
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300" />
          </a>
          <span className="text-border/20 select-none">|</span>
          <a
            href="#"
            className="hover:text-primary transition-all duration-300 relative group py-0.5"
          >
            Privacy Policy
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300" />
          </a>
        </div>
      </div>
    </footer>
  );
}
