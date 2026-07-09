import { Link } from "react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center relative overflow-hidden p-6">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid opacity-15" />
      
      {/* Radial Gradient Glow in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Animated Icon Card */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 flex items-center justify-center mb-8 animate-float shadow-lg shadow-primary/5">
          <ShieldAlert className="w-10 h-10 text-primary" />
        </div>

        {/* Error Code */}
        <h1 className="text-8xl font-black font-heading mb-4 tracking-tighter text-gradient glow-primary filter drop-shadow-[0_0_15px_var(--color-primary-glow)]">
          404
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-bold font-heading text-text-primary mb-3">
          Route Not Found
        </h2>

        {/* Generic Description (Safe from leaking internal system paths/structures) */}
        <p className="text-text-secondary text-sm mb-8 leading-relaxed font-body">
          The page or system resource you requested does not exist, has been permanently removed, or is temporarily unavailable. Please verify the URL or return to safety.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              icon={<ArrowLeft className="w-4 h-4" />}
              className="w-full px-6 py-3"
            >
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
