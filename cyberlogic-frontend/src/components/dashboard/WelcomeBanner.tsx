interface WelcomeBannerProps {
  name: string;
  totalUpcomingCount: number;
}

export function WelcomeBanner({ name, totalUpcomingCount }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-border p-6 sm:p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
      <div className="relative">
        <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-2">
          Welcome back, <span className="text-gradient">{name}</span>!
        </h1>
        <p className="text-sm text-text-muted max-w-lg">
          Stay updated with the latest from Cyberlogic. You have{" "}
          <span className="text-accent font-medium">
            {totalUpcomingCount === 0
              ? "no upcoming events"
              : totalUpcomingCount === 1
              ? "1 upcoming event"
              : `${totalUpcomingCount} upcoming events`}
          </span>{" "}
          scheduled.
        </p>
      </div>
    </div>
  );
}
