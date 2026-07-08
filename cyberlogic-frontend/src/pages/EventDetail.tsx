import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router";
import { ChevronLeft, Calendar, Clock, MapPin, Users, Check, CalendarCheck, QrCode, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchEventById, registerForEvent, unregisterFromEvent, formatEventTime, fetchAttendanceQr } from "../utils/api";
import type { Event } from "../data/mockData";
import BlogContentRenderer from "../components/common/BlogContentRenderer";
import { QRCodeSVG } from "qrcode.react";

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

  // QR code state
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const loadDetail = async () => {
    if (!id) return;
    try {
      const data = await fetchEventById(Number(id));
      setItem(data);

      // Load QR token if appropriate
      if (
        isAuthenticated &&
        data.eventMode !== "registration_only" &&
        (data.status === "upcoming" || data.status === "ongoing") &&
        (data.isRegistered || data.eventMode === "attendance_only")
      ) {
        loadQrToken(data.id);
      }
    } catch (err: any) {
      console.error("Failed to load event details:", err);
      setError(err.message || "Failed to load event details.");
    } finally {
      setLoading(false);
    }
  };

  const loadQrToken = async (eventId: number) => {
    setQrLoading(true);
    try {
      const token = await fetchAttendanceQr(eventId);
      setQrToken(token);
    } catch (err) {
      console.error("Failed to fetch attendance QR token:", err);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id, isAuthenticated]);

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
        setQrToken(null);
      } else {
        const result = await registerForEvent(item.id);
        setItem((prev) =>
          prev ? { ...prev, isRegistered: result.isRegistered, attendees: result.attendees } : null
        );
        if (item.eventMode !== "registration_only") {
          loadQrToken(item.id);
        }
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

  const statusColors: Record<string, string> = {
    upcoming: "bg-info/15 text-info border border-info/30",
    ongoing: "bg-success/15 text-success border border-success/30",
    completed: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    closed: "bg-surface-700 text-text-muted border border-border/40",
    postponed: "bg-warning/15 text-warning border border-warning/30",
  };

  const isFull = item.capacity ? item.attendees >= item.capacity : false;

  // Timings validation helpers
  const now = new Date();
  
  const getWindowDateTime = (timeStr?: string) => {
    if (!timeStr || !item) return null;
    const [hours, minutes] = timeStr.split(":");
    const d = new Date(item.date);
    d.setHours(Number(hours), Number(minutes), 0, 0);
    return d;
  };

  const regStart = item.registrationStart ? new Date(item.registrationStart) : null;
  const regEnd = item.registrationEnd ? new Date(item.registrationEnd) : null;
  const attStart = getWindowDateTime(item.attendanceStart);
  const attEnd = getWindowDateTime(item.attendanceEnd);

  const isRegStarted = regStart ? now >= regStart : true;
  const isRegEnded = regEnd ? now > regEnd : false;
  const isRegOpen = isRegStarted && !isRegEnded;

  const isAttendanceStarted = attStart ? now >= attStart : true;
  const isAttendanceEnded = attEnd ? now > attEnd : false;

  // Disable RSVP buttons
  const isRsvpDisabled = rsvpLoading || item.status !== "upcoming" || !isRegOpen || (!item.isRegistered && isFull);

  // Helper text for registration window
  const getRegistrationHelperText = () => {
    if (item.status !== "upcoming") return `RSVP closed. Event is ${item.status}.`;
    if (!isRegStarted && item.registrationStart && regStart) {
      return `Registration opens on ${regStart.toLocaleString()}`;
    }
    if (isRegEnded) return "Registration has closed.";
    if (isFull && !item.isRegistered) return "All slots are taken. Stay tuned for future slots.";
    if (item.isRegistered) return "You have a reserved slot. Click button to cancel RSVP.";
    if (item.capacity) return `Hurry! Only ${item.capacity - item.attendees} spots remaining.`;
    return "Slots are available. RSVP now!";
  };

  const renderQrTicket = () => {
    if (!isAuthenticated) {
      return (
        <div className="bg-surface-900/60 p-4 rounded-xl border border-border text-center space-y-2">
          <QrCode className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-xs text-text-secondary font-semibold">Attendance Pass</p>
          <p className="text-[10px] text-text-muted">
            Please <Link to="/login" className="text-primary hover:underline font-bold">Sign In</Link> to view your attendance QR code check-in pass.
          </p>
        </div>
      );
    }

    if (item.isAttended) {
      return (
        <div className="bg-success/10 p-4 rounded-xl border border-success/30 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-success mx-auto animate-bounce" />
          <div>
            <p className="text-xs font-bold text-success uppercase">Checked In</p>
            <p className="text-[10px] text-text-muted mt-0.5">Your attendance has been recorded.</p>
          </div>
        </div>
      );
    }

    if (item.eventMode === "registration_and_attendance" && !item.isRegistered) {
      return (
        <div className="bg-surface-900/40 p-4 rounded-xl border border-border/60 text-center text-text-muted text-[10px] italic">
          Register first to obtain your attendance check-in QR code pass.
        </div>
      );
    }

    if (item.status === "completed" || item.status === "closed" || item.status === "postponed") {
      return (
        <div className="bg-surface-900/40 p-4 rounded-xl border border-border/60 text-center text-text-muted text-[10px] italic">
          QR Check-in is not active for a {item.status} event.
        </div>
      );
    }

    if (!isAttendanceStarted && item.attendanceStart) {
      return (
        <div className="bg-surface-900/60 p-4 rounded-xl border border-border text-center space-y-2">
          <Clock className="w-6 h-6 text-warning mx-auto" />
          <p className="text-xs text-text-secondary font-semibold">Pass Not Active Yet</p>
          <p className="text-[10px] text-text-muted">
            Check-in opens on {attStart ? attStart.toLocaleString() : "TBD"}
          </p>
        </div>
      );
    }

    if (qrLoading) {
      return (
        <div className="bg-surface-900/60 p-6 rounded-xl border border-border text-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
          <p className="text-[10px] text-text-muted mt-2">Generating secure pass...</p>
        </div>
      );
    }

    if (!qrToken) {
      return (
        <div className="bg-surface-900/60 p-4 rounded-xl border border-border text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-error mx-auto" />
          <p className="text-[10px] text-error font-medium">Failed to load attendance token.</p>
        </div>
      );
    }

    return (
      <div className="bg-surface-900/80 p-5 rounded-xl border border-border text-center space-y-4">
        <p className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-center gap-1.5">
          <QrCode className="w-4 h-4 text-primary" /> Attendance QR Pass
        </p>
        <div className="bg-white p-3 rounded-xl inline-block">
          <QRCodeSVG value={qrToken} size={150} level="M" />
        </div>
        <p className="text-[10px] text-text-muted leading-normal">
          Present this pass at the venue entrance. Scanners will mark your check-in.
          {isAttendanceEnded && (
            <span className="block text-warning font-bold mt-1">Note: Check-in closes soon or is marked late.</span>
          )}
        </p>
      </div>
    );
  };

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
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[item.status] || "bg-surface-700 text-text-secondary"}`}>
                  {item.status.toUpperCase()}
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
              {item.description && (
                <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line font-medium border-l-2 border-primary/20 pl-4">
                  {item.description}
                </p>
              )}

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

          {/* Right Column: RSVP & Info Panels */}
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
                    {item.eventMode !== "attendance_only" && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Users className="w-4 h-4 text-success" />
                        <span>{item.attendees} / {item.capacity || "∞"} RSVP'd</span>
                      </div>
                    )}
                  </div>

                  {item.eventMode !== "attendance_only" && (
                    <div className="pt-4 border-t border-border/60 space-y-3">
                      <button
                        type="button"
                        disabled={isRsvpDisabled}
                        onClick={handleRsvp}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          item.isRegistered
                            ? "bg-accent/15 border-accent/40 text-accent hover:bg-accent/25"
                            : isRsvpDisabled
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
                        ) : (
                          <>
                            <CalendarCheck className="w-4 h-4" />
                            RSVP to Event
                          </>
                        )}
                      </button>
                      
                      <p className="text-[10px] text-text-muted text-center leading-normal">
                        {getRegistrationHelperText()}
                      </p>
                    </div>
                  )}

                  {/* QR Pass Section */}
                  {item.eventMode !== "registration_only" && (
                    <div className="pt-4 border-t border-border/60 space-y-3">
                      {renderQrTicket()}
                    </div>
                  )}
                </div>
              </div>

              {/* Event Guidelines Card */}
              <div className="glass rounded-xl p-4 border border-border space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Event Guidelines
                </h3>
                <ul className="text-[11px] text-text-muted space-y-1.5 list-disc pl-4">
                  {item.eventMode !== "attendance_only" && <li>Participants (players/speakers) must register.</li>}
                  {item.eventMode !== "registration_only" && <li>Audience members must scan their QR codes to record attendance.</li>}
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
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[item.status] || "bg-surface-700 text-text-secondary"}`}>
              {item.status.toUpperCase()}
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
                {item.eventMode !== "attendance_only" && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Users className="w-4 h-4 text-text-muted" />
                    <span>{item.attendees} / {item.capacity || "∞"} Registered</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center items-start md:items-end gap-3 md:border-l border-border md:pl-6 w-full">
              {item.eventMode !== "attendance_only" ? (
                <>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-widest hidden md:block">Reservation</h3>
                  <button
                    type="button"
                    disabled={isRsvpDisabled}
                    onClick={handleRsvp}
                    className={`w-full md:w-auto px-6 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      item.isRegistered
                        ? "bg-accent/15 border-accent/40 text-accent hover:bg-accent/25"
                        : isRsvpDisabled
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
                    ) : (
                      <>
                        <CalendarCheck className="w-4 h-4" />
                        RSVP to Event
                      </>
                    )}
                  </button>
                  <p className="text-xs text-text-muted mt-1">
                    {getRegistrationHelperText()}
                  </p>
                </>
              ) : (
                <div className="w-full">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-1.5">Check-in Pass</h3>
                  {renderQrTicket()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cover Image banner */}
        {item.image && (
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border mb-8 max-h-[400px]">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Event Content Body & QR (if RSVP + Attendance, display QR on public view also) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-fadeIn">
          <div className="md:col-span-8 space-y-8">
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

          {/* Right sidebar on public view containing QR Code if registered */}
          {item.eventMode !== "registration_only" && item.eventMode !== "attendance_only" && item.isRegistered && (
            <div className="md:col-span-4">
              <div className="sticky top-24 p-5 glass rounded-2xl border border-border space-y-4">
                {renderQrTicket()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
