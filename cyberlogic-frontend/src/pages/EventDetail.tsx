import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router";
import { ChevronLeft, Calendar, Clock, MapPin, Users, Check, CalendarCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchEventById, registerForEvent, unregisterFromEvent, formatEventTime } from "../utils/api";
import type { Event } from "../data/mockData";
import BlogContentRenderer from "../components/common/BlogContentRenderer";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const [item, setItem] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const loadDetail = async () => {
    if (!id) return;
    try {
      const data = await fetchEventById(Number(id));
      setItem(data);
    } catch (err: any) {
      console.error("Failed to load event details:", err);
      setError(err.message || "Failed to load event details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleRsvp = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!item) return;

    setRsvpLoading(true);
    try {
      if (item.isRegistered) {
        const result = await unregisterFromEvent(item.id);
        setItem((prev) =>
          prev ? { ...prev, isRegistered: result.isRegistered, attendees: result.attendees } : null
        );
      } else {
        const result = await registerForEvent(item.id);
        setItem((prev) =>
          prev ? { ...prev, isRegistered: result.isRegistered, attendees: result.attendees } : null
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to update registration state.");
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Retrieving event details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-text-primary">Event Not Found</h2>
        <p className="text-xs text-text-muted mt-1">{error}</p>
        <Link
          to={isPortal ? "/app/events" : "/events"}
          className="text-primary hover:underline text-sm mt-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to list
        </Link>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    Workshop: "bg-primary/10 text-primary border border-primary/20",
    Seminar: "bg-info/10 text-info border border-info/20",
    Competition: "bg-error/10 text-error border border-error/20",
    Social: "bg-accent/10 text-accent border border-accent/20",
    Meeting: "bg-success/10 text-success border border-success/20",
  };

  const isFull = item.capacity ? item.attendees >= item.capacity : false;

  if (isPortal) {
    return (
      <div className="pb-12 w-full max-w-6xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <Link
          to="/app/events"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors bg-surface-900/40 px-3 py-1.5 rounded-lg border border-border"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Events
        </Link>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Left Column: Event Title, Cover Image, Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header info */}
            <div className="glass rounded-2xl p-6 border border-border space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors[item.type] || "bg-surface-700 text-text-secondary"}`}>
                  {item.type}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
                {item.title}
              </h1>
            </div>

            {/* Cover Image banner */}
            {item.image && (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border max-h-[400px]">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Event Content Body */}
            <div className="glass rounded-2xl p-6 border border-border space-y-6">
              {/* Main description */}
              {item.description && (
                <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
                  {item.description}
                </p>
              )}

              {/* Dynamically Render CMS Blog Sections */}
              {item.sections && item.sections.length > 0 ? (
                <div className="pt-6 border-t border-border/30">
                  <BlogContentRenderer content={item.sections} />
                </div>
              ) : (
                <div className="text-xs text-text-muted py-2 italic">
                  No further sections provided.
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Sticky RSVP & Info Panels */}
          <div className="lg:col-span-4">
            <div className="space-y-6 sticky top-20">
              
              {/* RSVP & Ticket Status Card */}
              <div className="glass rounded-2xl border border-border overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary/45 to-accent/45" />
                <div className="p-5 space-y-5">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Registration Desk
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4 text-accent" />
                      <span>{formatEventTime(item.startTime, item.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin className="w-4 h-4 text-warning" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Users className="w-4 h-4 text-success" />
                      <span>{item.attendees} / {item.capacity || 50} Attending</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60 space-y-3">
                    <button
                      type="button"
                      disabled={rsvpLoading || (!item.isRegistered && isFull)}
                      onClick={handleRsvp}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        item.isRegistered
                          ? "bg-accent/15 border-accent/40 text-accent hover:bg-accent/25"
                          : isFull
                          ? "bg-surface-800 border-border text-text-muted cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary-hover border-transparent"
                      }`}
                    >
                      {rsvpLoading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      ) : item.isRegistered ? (
                        <>
                          <Check className="w-4 h-4" />
                          Registered
                        </>
                      ) : isFull ? (
                        "Fully Booked"
                      ) : (
                        <>
                          <CalendarCheck className="w-4 h-4" />
                          RSVP to Event
                        </>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-text-muted text-center leading-normal">
                      {item.isRegistered
                        ? "You have a reserved slot. Click button to cancel RSVP."
                        : isFull
                        ? "All slots are taken. Stay tuned for future slots."
                        : item.capacity
                        ? `Hurry! Only ${item.capacity - item.attendees} spots remaining.`
                        : "Slots are available. RSVP now!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Guidelines Card */}
              <div className="glass rounded-xl p-4 border border-border space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Event Guidelines
                </h3>
                <ul className="text-[11px] text-text-muted space-y-1.5 list-disc pl-4">
                  <li>Present your student ID card or portal RSVP upon entry.</li>
                  <li>Arrive at least 10 minutes prior to session launch.</li>
                  <li>Bring your own laptop for hands-on activities.</li>
                </ul>
              </div>

            </div>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Back navigation */}
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Events
        </Link>

        {/* Hero Header */}
        <div className="space-y-4 mb-8 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors[item.type] || "bg-surface-700 text-text-secondary"}`}>
              {item.type}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-heading)] text-text-primary tracking-tight leading-tight">
            {item.title}
          </h1>

          {/* Quick Schedule Grid & RSVP bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-900/60 p-5 rounded-2xl border border-border mt-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Date & Location</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <span>{item.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span>{formatEventTime(item.startTime, item.endTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin className="w-4 h-4 text-text-muted" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Users className="w-4 h-4 text-text-muted" />
                  <span>{item.attendees} / {item.capacity || 50} Attending</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-start md:items-end gap-3 md:border-l border-border md:pl-6">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest hidden md:block">Reservation</h3>
              <button
                type="button"
                disabled={rsvpLoading || (!item.isRegistered && isFull)}
                onClick={handleRsvp}
                className={`w-full md:w-auto px-6 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  item.isRegistered
                    ? "bg-accent/15 border-accent/40 text-accent hover:bg-accent/25"
                    : isFull
                    ? "bg-surface-800 border-border text-text-muted cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-hover border-transparent"
                }`}
              >
                {rsvpLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                ) : item.isRegistered ? (
                  <>
                    <Check className="w-4 h-4" />
                    You are Registered
                  </>
                ) : isFull ? (
                  "Fully Booked"
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    RSVP to Event
                  </>
                )}
              </button>
              <p className="text-xs text-text-muted mt-1">
                {item.isRegistered
                  ? "You have a reserved slot. Click button to cancel RSVP."
                  : isFull
                  ? "All slots are taken. Stay tuned for future slots."
                  : item.capacity
                  ? `Hurry! Only ${item.capacity - item.attendees} spots remaining.`
                  : "Slots are available. RSVP now!"}
              </p>
            </div>
          </div>
        </div>

        {/* Cover Image banner */}
        {item.image && (
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border mb-8 max-h-[400px]">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Event Content Body */}
        <div className="space-y-8 animate-fadeIn">
          
          {/* Main description */}
          {item.description && (
            <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
              {item.description}
            </p>
          )}

          {/* Dynamically Render CMS Blog Sections */}
          {item.sections && item.sections.length > 0 ? (
            <div className="pt-6 border-t border-border/30">
              <BlogContentRenderer content={item.sections} />
            </div>
          ) : (
            <div className="text-xs text-text-muted py-6 italic">
              No further sections provided.
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
