import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { events } from "../data/mockData";

const eventTypes = ["All", "Workshop", "Seminar", "Competition", "Social", "Meeting"] as const;

export default function Events() {
  const [activeType, setActiveType] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const filtered = events.filter(
    (e) => activeType === "All" || e.type === activeType
  );

  const typeColors: Record<string, string> = {
    Workshop: "bg-primary/10 text-primary",
    Seminar: "bg-info/10 text-info",
    Competition: "bg-error/10 text-error",
    Social: "bg-accent/10 text-accent",
    Meeting: "bg-success/10 text-success",
  };

  return (
    <div className={isPortal ? "pb-8" : "pt-24 pb-16"}>
      <div className={isPortal ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        {/* Page Header */}
        <div className="mb-10">
          {!isPortal && (
            <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-text-secondary">Events</span>
            </div>
          )}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
                Events
              </h1>
              <p className="text-text-muted mt-2">
                Discover and join our workshops, seminars, competitions, and social gatherings.
              </p>
            </div>
            {/* View Toggle */}
            <div className="hidden sm:flex items-center gap-1 glass rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list" ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {eventTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                activeType === type
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-surface-800 text-text-muted border-border hover:border-primary/20 hover:text-text-secondary"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Events Grid/List */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 gap-6"
              : "space-y-4"
          }
        >
          {filtered.map((event) => {
            const eventDate = new Date(event.date);
            const month = eventDate.toLocaleString("default", {
              month: "short",
            });
            const day = eventDate.getDate();
            const dayName = eventDate.toLocaleString("default", {
              weekday: "long",
            });

            return (
              <div
                key={event.id}
                className={`glass rounded-2xl p-6 hover:border-accent/30 transition-all duration-300 group ${
                  viewMode === "list" ? "flex gap-5" : ""
                }`}
              >
                {/* Date Badge */}
                <div
                  className={`flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex flex-col items-center justify-center ${
                    viewMode === "grid"
                      ? "w-full h-20 mb-5"
                      : "w-16 h-16"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase text-accent">
                    {month}
                  </span>
                  <span className="text-2xl font-bold text-text-primary leading-none">
                    {day}
                  </span>
                  {viewMode === "grid" && (
                    <span className="text-xs text-text-muted">{dayName}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        typeColors[event.type] || "bg-surface-700 text-text-secondary"
                      }`}
                    >
                      {event.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors mb-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {event.time}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {event.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {event.attendees} attending
                    </span>
                  </div>
                  {viewMode === "grid" && (
                    <button
                      type="button"
                      className="mt-4 w-full py-2.5 rounded-xl border border-accent/30 text-accent text-sm font-medium hover:bg-accent/5 transition-all flex items-center justify-center gap-2"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Register
                    </button>
                  )}
                </div>

                {viewMode === "list" && (
                  <button
                    type="button"
                    className="flex-shrink-0 self-center px-5 py-2.5 rounded-xl border border-accent/30 text-accent text-sm font-medium hover:bg-accent/5 transition-all"
                  >
                    Register
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted">No events found for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
