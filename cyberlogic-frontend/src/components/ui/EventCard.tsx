import { Clock, MapPin, Users, CalendarDays } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { formatEventTime } from "../../utils/api";

interface ClubEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "Workshop" | "Seminar" | "Competition" | "Social" | "Meeting";
  attendees: number;
}

interface EventCardProps {
  event: ClubEvent;
  layout?: "default" | "compact";
}

export function EventCard({ event, layout = "default" }: EventCardProps) {
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");
  const detailUrl = isPortal ? `/app/events/${event.id}` : `/events/${event.id}`;

  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleString("default", { month: "short" });
  const day = eventDate.getDate();

  const todayStr = new Date().toISOString().split('T')[0];
  const isEnded = event.date < todayStr;

  const typeVariants: Record<string, "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral"> = {
    Workshop: "primary",
    Seminar: "info",
    Competition: "error",
    Social: "accent",
    Meeting: "success",
  };

  const selectedVariant = typeVariants[event.type] || "neutral";

  if (layout === "compact") {
    return (
      <Link to={detailUrl} className="block text-inherit hover:no-underline">
        <div className={`flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all ${isEnded ? "opacity-60" : ""}`}>
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase text-accent leading-none">
              {month}
            </span>
            <span className="text-sm font-bold text-text-primary leading-none">{day}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-sm font-medium text-text-primary truncate">{event.title}</h3>
              {isEnded && (
                <span className="inline-flex px-1 py-0.25 rounded text-[8px] font-bold bg-surface-800 text-text-muted border border-border/30">
                  Ended
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatEventTime(event.startTime, event.endTime)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={detailUrl} className="block text-inherit hover:no-underline">
      <Card hoverEffect={!isEnded} glowColor={isEnded ? "neutral" : "accent"} className={`p-6 flex gap-5 group transition-all ${isEnded ? "opacity-60 hover:opacity-85" : ""}`}>
        {/* Date Badge */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex flex-col items-center justify-center">
          <span className="text-xs font-semibold uppercase text-accent">{month}</span>
          <span className="text-xl font-bold text-text-primary leading-none">{day}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={isEnded ? "neutral" : selectedVariant}>{event.type}</Badge>
            {isEnded && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-800 text-text-muted border border-border/40">
                <CalendarDays className="w-2.5 h-2.5" /> Ended
              </span>
            )}
          </div>
          <h3 className={`text-base font-semibold text-text-primary transition-colors mb-1 truncate ${isEnded ? "" : "group-hover:text-accent"}`}>
            {event.title}
          </h3>
          <p className="text-sm text-text-muted line-clamp-1 mb-3">{event.description}</p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {formatEventTime(event.startTime, event.endTime)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {event.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {event.attendees}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
