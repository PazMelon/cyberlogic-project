import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  LayoutList,
  LayoutGrid,
  Check,
  QrCode
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchEvents, registerForEvent, unregisterFromEvent, formatEventTime } from "../utils/api";
import type { Event } from "../data/mockData";

const eventTypes = ["All", "Workshop", "Seminar", "Competition", "Social", "Meeting"] as const;
const statusFilters = ["All", "Upcoming", "Ongoing", "Completed", "Closed", "Postponed"] as const;

export default function Events() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [eventList, setEventList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoadingId, setRsvpLoadingId] = useState<number | null>(null);

  const [activeType, setActiveType] = useState<string>("All");
  const [activeStatus, setActiveStatus] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEventList(data);
    } catch (err: any) {
      console.error("Failed to load events:", err);
      setError(err.message || "Failed to retrieve events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRsvp = async (event: Event) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setRsvpLoadingId(event.id);
    try {
      if (event.isRegistered) {
        const result = await unregisterFromEvent(event.id);
        setEventList((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? { ...e, isRegistered: result.isRegistered, attendees: result.attendees }
              : e
          )
        );
      } else {
        const result = await registerForEvent(event.id);
        setEventList((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? { ...e, isRegistered: result.isRegistered, attendees: result.attendees }
              : e
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "An error occurred updating your registration.");
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const filtered = eventList.filter((e) => {
    const matchesType = activeType === "All" || e.type === activeType;
    const matchesStatus =
      activeStatus === "All" || e.status.toLowerCase() === activeStatus.toLowerCase();
    return matchesType && matchesStatus;
  });

  const typeColors: Record<string, string> = {
    Workshop: "bg-primary/10 text-primary border border-primary/20",
    Seminar: "bg-info/10 text-info border border-info/20",
    Competition: "bg-error/10 text-error border border-error/20",
    Social: "bg-accent/10 text-accent border border-accent/20",
    Meeting: "bg-success/10 text-success border border-success/20",
  };

  const statusColors: Record<string, string> = {
    upcoming: "bg-info/10 text-info border border-info/20",
    ongoing: "bg-success/10 text-success border border-success/20",
    completed: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    closed: "bg-surface-700 text-text-muted border border-border/20",
    postponed: "bg-warning/10 text-warning border border-warning/20",
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
              <h1 className={`${isPortal ? "text-2xl" : "text-3xl lg:text-4xl"} font-bold font-[family-name:var(--font-heading)] text-text-primary`}>
                Events
              </h1>
              <p className={`${isPortal ? "text-sm mt-1" : "mt-2"} text-text-muted`}>
                Discover and join our workshops, seminars, competitions, and social gatherings.
              </p>
            </div>
            {/* View Toggle */}
            <div className="hidden sm:flex items-center gap-1 glass rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === "list" ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bars */}
        <div className="space-y-3 mb-8">
          {/* Type Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-surface-900/35 p-3 rounded-2xl border border-border/60">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider min-w-[70px] select-none">
              Category:
            </span>
            <div className="flex flex-row overflow-x-auto gap-2 pb-1.5 sm:pb-0 no-scrollbar scroll-smooth whitespace-nowrap w-full">
              {eventTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border duration-200 cursor-pointer ${
                    activeType === type
                      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-primary/30 shadow-sm shadow-primary/10 scale-[1.02]"
                      : "bg-surface-900/40 text-text-muted border-border hover:bg-surface-800 hover:text-text-primary hover:border-primary/20"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-surface-900/35 p-3 rounded-2xl border border-border/60">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider min-w-[70px] select-none">
              Status:
            </span>
            <div className="flex flex-row overflow-x-auto gap-2 pb-1.5 sm:pb-0 no-scrollbar scroll-smooth whitespace-nowrap w-full">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveStatus(status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border duration-200 cursor-pointer ${
                    activeStatus === status
                      ? "bg-gradient-to-r from-accent/15 to-accent/5 text-accent border-accent/30 shadow-sm shadow-accent/10 scale-[1.02]"
                      : "bg-surface-900/40 text-text-muted border-border hover:bg-surface-800 hover:text-text-primary hover:border-accent/20"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-xs text-text-muted">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-error">{error}</p>
            <button
              type="button"
              onClick={loadEvents}
              className="mt-4 px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          /* Events Grid/List */
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

              const isFull = event.capacity ? event.attendees >= event.capacity : false;
              const detailUrl = isPortal ? `/app/events/${event.id}` : `/events/${event.id}`;

              // Determine button state
              const isRsvpMode = event.eventMode !== "attendance_only";
              const isButtonDisabled = rsvpLoadingId === event.id || event.status !== "upcoming" || !isRsvpMode;

              return (
                <div
                  key={event.id}
                  className={`glass rounded-2xl p-6 hover:border-accent/30 transition-all duration-300 group ${
                    viewMode === "list" ? "flex gap-5" : ""
                  }`}
                >
                  {/* Date Badge */}
                  <Link
                    to={detailUrl}
                    className={`flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex flex-col items-center justify-center hover:scale-105 transition-all ${
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
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          typeColors[event.type] || "bg-surface-700 text-text-secondary"
                        }`}
                      >
                        {event.type}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          statusColors[event.status] || "bg-surface-700 text-text-secondary"
                        }`}
                      >
                        {event.status}
                      </span>
                      <span className="text-[10px] text-text-muted font-medium ml-auto">
                        {event.eventMode === "registration_only"
                          ? "RSVP Only"
                          : event.eventMode === "attendance_only"
                          ? "Attendance Only"
                          : "RSVP + Attendance"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors mb-2">
                      <Link to={detailUrl} className="hover:underline">
                        {event.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-text-muted mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted mb-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatEventTime(event.startTime, event.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {event.location}
                      </span>
                      {event.eventMode !== "attendance_only" && (
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {event.attendees} / {event.capacity || "∞"} attending
                        </span>
                      )}
                    </div>
                    
                    {viewMode === "grid" && (
                      <button
                        type="button"
                        disabled={isButtonDisabled}
                        onClick={() => handleRsvp(event)}
                        className={`w-full py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          !isRsvpMode
                            ? "bg-surface-800/40 border-border text-text-muted cursor-default"
                            : event.isRegistered
                            ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
                            : isButtonDisabled
                            ? "bg-surface-800 border-border text-text-muted cursor-not-allowed"
                            : "border-primary/30 text-primary hover:bg-primary/5"
                        }`}
                      >
                        {rsvpLoadingId === event.id ? (
                          <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        ) : !isRsvpMode ? (
                          <>
                            <QrCode className="w-4 h-4" />
                            Audience Check-in Only
                          </>
                        ) : event.isRegistered ? (
                          <>
                            <Check className="w-4 h-4" />
                            Registered
                          </>
                        ) : event.status !== "upcoming" ? (
                          "RSVP Closed"
                        ) : isFull ? (
                          "Fully Booked"
                        ) : (
                          <>
                            <CalendarIcon className="w-4 h-4" />
                            Register
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {viewMode === "list" && (
                    <button
                      type="button"
                      disabled={isButtonDisabled}
                      onClick={() => handleRsvp(event)}
                      className={`flex-shrink-0 self-center px-5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        !isRsvpMode
                          ? "bg-surface-800/40 border-border text-text-muted cursor-default"
                          : event.isRegistered
                          ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
                          : isButtonDisabled
                          ? "bg-surface-800 border-border text-text-muted cursor-not-allowed"
                          : "border-primary/30 text-primary hover:bg-primary/5"
                      }`}
                    >
                      {rsvpLoadingId === event.id ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      ) : !isRsvpMode ? (
                        "Check-in Only"
                      ) : event.isRegistered ? (
                        "Registered"
                      ) : event.status !== "upcoming" ? (
                        "Closed"
                      ) : isFull ? (
                        "Full"
                      ) : (
                        "Register"
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filtered.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-text-muted">No events found matching the criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
