import { Clock, MapPin, Users } from "lucide-react";
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
  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleString("default", { month: "short" });
  const day = eventDate.getDate();

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
      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold uppercase text-accent leading-none">
            {month}
          </span>
          <span className="text-sm font-bold text-text-primary leading-none">{day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-text-primary truncate">{event.title}</h3>
          <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" /> {formatEventTime(event.startTime, event.endTime)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card hoverEffect glowColor="accent" className="p-6 flex gap-5 group">
      {/* Date Badge */}
      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex flex-col items-center justify-center">
        <span className="text-xs font-semibold uppercase text-accent">{month}</span>
        <span className="text-xl font-bold text-text-primary leading-none">{day}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant={selectedVariant}>{event.type}</Badge>
        </div>
        <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors mb-1 truncate">
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
  );
}
