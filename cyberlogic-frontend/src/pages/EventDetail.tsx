import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router";
import { Calendar, Clock, MapPin, Users, Check, CalendarCheck, QrCode, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchEventById, registerForEvent, unregisterFromEvent, formatEventTime, fetchAttendanceQr } from "../utils/api";
import { useDialog } from "../utils/useDialog";
import type { Event } from "../data/mockData";
import { QRCodeSVG } from "qrcode.react";
import { useSEO } from "../utils/useSEO";
import DetailLayout from "../components/common/DetailLayout";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");
  const { showAlert } = useDialog();

  const [item, setItem] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const getCoverImageUrl = () => {
    if (!item) return undefined;
    return item.image ? (item.image.startsWith("http") ? item.image : `${window.location.origin}/storage/${item.image}`) : undefined;
  };

  useSEO({
    title: item ? item.title : "Loading Event...",
    description: item ? item.description : undefined,
    keywords: item ? [item.type, "Event", "Cyberlogic Event"] : undefined,
    image: getCoverImageUrl(),
    type: "event",
  });

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
      showAlert({
        title: "Registration Interrupted",
        message: err.message || "Failed to update registration state.",
        type: "error",
      });
    } finally {
      setRsvpLoading(false);
    }
  };

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

  const isFull = item?.capacity ? item.attendees >= item.capacity : false;
  const now = new Date();

  const getWindowDateTime = (timeStr?: string) => {
    if (!timeStr || !item) return null;
    const [hours, minutes] = timeStr.split(":");
    const d = new Date(item.date);
    d.setHours(Number(hours), Number(minutes), 0, 0);
    return d;
  };

  const regStart = item?.registrationStart ? new Date(item.registrationStart) : null;
  const regEnd = item?.registrationEnd ? new Date(item.registrationEnd) : null;
  const attStart = item ? getWindowDateTime(item.attendanceStart) : null;
  const attEnd = item ? getWindowDateTime(item.attendanceEnd) : null;

  const isRegStarted = regStart ? now >= regStart : true;
  const isRegEnded = regEnd ? now > regEnd : false;
  const isRegOpen = isRegStarted && !isRegEnded;

  const isAttendanceStarted = attStart ? now >= attStart : true;
  const isAttendanceEnded = attEnd ? now > attEnd : false;

  // Disable RSVP buttons
  const isRsvpDisabled = !item || rsvpLoading || item.status !== "upcoming" || !isRegOpen || (!item.isRegistered && isFull);

  // Helper text for registration window
  const getRegistrationHelperText = () => {
    if (!item) return "";
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
    if (!item) return null;
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

  const badges = item && (
    <>
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors[item.type] || "bg-surface-700 text-text-secondary"}`}>
        {item.type}
      </span>
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[item.status] || "bg-surface-700 text-text-secondary"}`}>
        {item.status.toUpperCase()}
      </span>
    </>
  );

  const sidebar = item && (
    <>
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

          {/* Organizer Section */}
          {item.user && (
            <div className="pt-4 border-t border-border/60">
              <p className="text-xs font-semibold text-text-muted mb-2">Organizer</p>
              <Link
                to={`/app/profile/${item.user.id}`}
                className="flex items-center gap-3 hover:bg-white/5 p-1 rounded-xl transition-all"
              >
                <img
                  src={item.user.avatar}
                  alt={item.user.name}
                  className="w-8 h-8 rounded-full object-cover border border-border/40"
                />
                <div>
                  <p className="text-xs font-bold text-text-primary hover:text-primary transition-colors">{item.user.name}</p>
                  <p className="text-[10px] text-text-muted">{item.user.role || "Officer"}</p>
                </div>
              </Link>
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
    </>
  );

  const publicSidebar = item && (
    <>
      {/* Event Details & Registration Card */}
      <div className="glass rounded-2xl border border-border overflow-hidden animate-fadeIn">
        <div className="h-2 bg-gradient-to-r from-primary/45 to-accent/45" />
        <div className="p-5 space-y-5">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Event Information
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
                <span>{item.attendees} / {item.capacity || "∞"} Registered</span>
              </div>
            )}
          </div>

          {item.eventMode !== "attendance_only" ? (
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
          ) : (
            <div className="pt-4 border-t border-border/60 space-y-3">
              <p className="text-xs font-semibold text-text-muted mb-2">Check-in Pass</p>
              {renderQrTicket()}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Pass for Registration & Attendance (if registered) */}
      {item.eventMode === "registration_and_attendance" && item.isRegistered && (
        <div className="p-5 glass rounded-2xl border border-border space-y-4 animate-fadeIn">
          {renderQrTicket()}
        </div>
      )}

      {/* Organizer Card */}
      {item.user && (
        <div className="p-5 glass rounded-2xl border border-border space-y-3 animate-fadeIn">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Organizer</h3>
          <Link
            to={`/app/profile/${item.user.id}`}
            className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all block"
          >
            <div className="flex items-center gap-3">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="w-10 h-10 rounded-full object-cover border border-border/40"
              />
              <div>
                <p className="text-sm font-bold text-text-primary hover:text-primary transition-colors">{item.user.name}</p>
                <p className="text-xs text-text-muted">{item.user.role || "Officer"}</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Guidelines Card */}
      <div className="glass rounded-xl p-4 border border-border space-y-3 animate-fadeIn">
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
    </>
  );

  return (
    <DetailLayout
      isPortal={isPortal}
      backLink={{
        to: isPortal ? "/app/events" : "/events",
        label: "Back to Events",
      }}
      badges={badges}
      title={item?.title || ""}
      image={item?.image}
      introText={item?.description}
      sections={item?.sections}
      sidebar={sidebar}
      showSidebarOnPublic={true}
      fullWidthHeaderPublic={true}
      publicSidebar={publicSidebar}
      publicHeaderExtra={undefined}
      publicContainerClass="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
      loading={loading}
      loadingText="Retrieving event details..."
      error={error}
      errorTitle="Event Not Found"
    />
  );
}
