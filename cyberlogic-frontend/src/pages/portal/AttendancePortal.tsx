import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router";
import { Html5Qrcode } from "html5-qrcode";
import { 
  Camera, AlertCircle, CheckCircle, RefreshCw, Clipboard, Send, 
  Users, UserCheck, Clock, Search, ShieldAlert, Sparkles, MapPin, Calendar
} from "lucide-react";
import { fetchEventById, fetchEventAttendees, checkInAttendee } from "../../utils/api";
import { useWebSocket } from "../../context/WebSocketContext";
import type { Event } from "../../data/mockData";

interface AttendeeRecord {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar: string;
  status: "present" | "late";
  checked_in_at: string;
  checked_in_by_name?: string;
}

export default function AttendancePortal() {
  const { id } = useParams();
  const eventId = Number(id);

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "late">("all");

  // Scanner states
  const [scannerActive, setScannerActive] = useState(false);
  const [scanningError, setScanningError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(1);
  const lastScannedTokenRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  // Check-in results
  const [checkInStatus, setCheckInStatus] = useState<{
    success: boolean;
    message: string;
    user?: {
      id: number;
      name: string;
      avatar: string;
      status: string;
      checked_in_at: string;
    };
  } | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Manual input state
  const [manualToken, setManualToken] = useState("");
  
  // Highlighting new arrivals
  const [newArrivalId, setNewArrivalId] = useState<number | null>(null);
  const [isSuccessRipple, setIsSuccessRipple] = useState(false);
  const [isErrorShake, setIsErrorShake] = useState(false);

  const { subscribe } = useWebSocket();

  // Load Event Info & Initial Attendees
  useEffect(() => {
    async function loadData() {
      try {
        const eventData = await fetchEventById(eventId);
        setEvent(eventData);

        const listData = await fetchEventAttendees(eventId);
        setAttendees(listData.attendees);
      } catch (err: any) {
        setError(err.message || "Failed to load event details or attendees.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  // Subscribe to real-time attendance updates
  useEffect(() => {
    if (!eventId) return;
    
    console.log(`[Portal] Subscribing to events:${eventId}:attendance channel`);
    const unsubscribe = subscribe(`events:${eventId}:attendance`, (payload: any, type: string) => {
      console.log("[Portal] WebSocket payload received:", payload, type);
      if (payload && payload.attendee) {
        const newAttendee = payload.attendee;
        setAttendees((prev) => {
          const exists = prev.some((a) => a.user_id === newAttendee.user_id);
          if (exists) {
            return prev.map((a) => (a.user_id === newAttendee.user_id ? newAttendee : a));
          }
          return [newAttendee, ...prev];
        });

        // Trigger visual animations
        setNewArrivalId(newAttendee.user_id);
        setTimeout(() => {
          setNewArrivalId(null);
        }, 4000);
      }
    });

    return () => {
      console.log(`[Portal] Unsubscribing from events:${eventId}:attendance channel`);
      unsubscribe();
    };
  }, [eventId, subscribe]);

  // Handle Scan Success
  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const now = Date.now();
    if (decodedText === lastScannedTokenRef.current && now - lastScannedTimeRef.current < 10000) {
      // Ignore duplicates quietly but reset processing flag after 1.5 seconds
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
      return;
    }
    
    setCheckInLoading(true);
    setCheckInStatus(null);
    setScanningError(null);
    setIsSuccessRipple(false);
    setIsErrorShake(false);

    try {
      console.log("[Portal Scanner] Processing code:", decodedText);
      const response = await checkInAttendee(eventId, decodedText);
      setCheckInStatus({
        success: true,
        message: response.message,
        user: response.attendee
      });
      // Record duplicate check
      lastScannedTokenRef.current = decodedText;
      lastScannedTimeRef.current = Date.now();
      
      setIsSuccessRipple(true);
      if (navigator.vibrate) {
        navigator.vibrate(120);
      }
    } catch (err: any) {
      setCheckInStatus({
        success: false,
        message: err.message || "Failed to check in user."
      });
      setIsErrorShake(true);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setCheckInLoading(false);
      // Display check-in result for 3 seconds, then clear card and allow next scan
      setTimeout(() => {
        setCheckInStatus(null);
        setIsSuccessRipple(false);
        setIsErrorShake(false);
        isProcessingRef.current = false;
      }, 3000);
    }
  };

  // Start QR Scanner
  const startScanner = () => {
    if (scannerActive) return;
    setScanningError(null);
    
    setTimeout(() => {
      const container = document.getElementById("portal-qr-scanner");
      if (!container) return;

      const html5Qrcode = new Html5Qrcode("portal-qr-scanner");
      scannerRef.current = html5Qrcode;

      const config = { fps: 15, qrbox: { width: 260, height: 260 } };

      html5Qrcode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Quietly parse frames
          }
        )
        .then(() => {
          setScannerActive(true);
          const intervalId = setInterval(() => {
            const video = document.querySelector("#portal-qr-scanner video") as HTMLVideoElement;
            if (video && video.videoWidth > 0) {
              const ratio = video.videoWidth / video.videoHeight;
              setVideoAspectRatio(ratio);
              clearInterval(intervalId);
            }
          }, 100);
          setTimeout(() => clearInterval(intervalId), 5000);
        })
        .catch((err) => {
          console.error("Failed to start portal scanner:", err);
          setScanningError("Could not access camera. Please verify device permissions.");
          setScannerActive(false);
        });
    }, 150);
  };

  // Stop QR Scanner
  const stopScanner = () => {
    if (!scannerActive || !scannerRef.current) return;

    const scanner = scannerRef.current;
    if (scanner.isScanning) {
      scanner
        .stop()
        .then(() => {
          scanner.clear();
          scannerRef.current = null;
          setScannerActive(false);
          setVideoAspectRatio(1);
        })
        .catch((err) => {
          console.error("Failed to stop portal scanner:", err);
        });
    } else {
      setScannerActive(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.error("Cleanup stop failed", err));
      }
    };
  }, []);

  // Handle Manual Input
  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim() || checkInLoading) return;

    setCheckInLoading(true);
    setCheckInStatus(null);
    setIsSuccessRipple(false);
    setIsErrorShake(false);

    try {
      const response = await checkInAttendee(eventId, manualToken.trim());
      setCheckInStatus({
        success: true,
        message: response.message,
        user: response.attendee
      });
      setIsSuccessRipple(true);
      setManualToken("");
    } catch (err: any) {
      setCheckInStatus({
        success: false,
        message: err.message || "Failed to check in user."
      });
      setIsErrorShake(true);
    } finally {
      setCheckInLoading(false);
    }
  };

  // Filtered Attendees list
  const filteredAttendees = useMemo(() => {
    return attendees.filter((att) => {
      const matchesSearch =
        att.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        statusFilter === "all" || att.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [attendees, searchQuery, statusFilter]);

  // Statistics counts
  const stats = useMemo(() => {
    const present = attendees.filter((a) => a.status === "present").length;
    const late = attendees.filter((a) => a.status === "late").length;
    return {
      total: attendees.length,
      present,
      late,
      capacity: event?.attendanceCapacity || 0
    };
  }, [attendees, event]);

  // Attendance rate percentage
  const attendanceRate = useMemo(() => {
    if (!stats.capacity) return 0;
    return Math.min(Math.round((stats.total / stats.capacity) * 100), 100);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-text-secondary animate-pulse font-mono uppercase tracking-widest">
          Establishing Secure Portal Session...
        </p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
          Security Clearance Denied
        </h2>
        <p className="text-xs text-text-muted mt-2">
          {error || "The event request contains invalid configurations or permissions."}
        </p>
        <Link
          to="/admin/events"
          className="mt-6 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-text-secondary hover:text-text-primary font-bold text-xs rounded-xl border border-border/80 transition-all flex items-center gap-1.5"
        >
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-68px)]">
      {/* Left panel - Info & Scanner */}
      <div className="lg:col-span-5 border-r border-border/40 p-4 sm:p-6 overflow-y-auto flex flex-col space-y-6">
        
        {/* Event header card */}
        <div className="portal-glass rounded-2xl p-5 border border-border/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-primary/10 border border-primary/20 text-primary">
            {event.type}
          </span>
          <h2 className="text-lg font-extrabold font-[family-name:var(--font-heading)] text-text-primary mt-2 leading-snug">
            {event.title}
          </h2>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-semibold text-text-secondary border-t border-border/20 pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary/80" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary/80" />
              <span>{event.startTime} - {event.endTime}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="w-4 h-4 text-primary/80 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>

        {/* Scanner Viewport */}
        <div className={`portal-glass rounded-2xl p-6 border border-border/60 flex flex-col items-center relative overflow-hidden transition-all ${
          isSuccessRipple ? "animate-success-ripple" : ""
        } ${
          isErrorShake ? "animate-shake-error" : ""
        }`}>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5 self-start">
            <Camera className="w-4 h-4 text-primary" /> Visual Scan Gate
          </h3>

          <div 
            className="w-full max-w-[280px] rounded-xl overflow-hidden bg-surface-950 border border-border/80 relative flex items-center justify-center shadow-inner transition-all duration-300"
            style={{ aspectRatio: videoAspectRatio }}
          >
            {/* The canvas target of html5-qrcode */}
            <div id="portal-qr-scanner" className="w-full h-full" />

            {/* Glowing scan line animation */}
            {scannerActive && (
              <div className="absolute left-0 w-full h-[2px] bg-primary animate-scan-line shadow-[0_0_10px_#06b6d4] pointer-events-none" />
            )}

            {/* Inactive overlay */}
            {!scannerActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-surface-900/90 backdrop-blur-sm">
                <div className="p-3.5 bg-primary/10 rounded-full border border-primary/20 text-primary animate-pulse-glow">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-xs font-bold text-text-secondary">Capture Camera Off</p>
                <p className="text-[10px] text-text-muted max-w-[200px]">
                  Authorize camera permissions and initiate scan sequence below.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={scannerActive ? stopScanner : startScanner}
            className={`mt-6 w-full py-2.5 rounded-xl border text-xs font-extrabold tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              scannerActive
                ? "bg-error/15 border-error/30 text-error hover:bg-error/25"
                : "bg-gradient-to-r from-primary to-primary-dark text-white border-transparent hover:brightness-110"
            }`}
          >
            {scannerActive ? (
              <>Terminate Camera feed</>
            ) : (
              <>
                <Camera className="w-4 h-4" /> Initialize Scan Feed
              </>
            )}
          </button>

          {scanningError && (
            <div className="mt-4 flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl p-3 text-[10px] text-error">
              <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
              <span>{scanningError}</span>
            </div>
          )}
        </div>

        {/* Manual Input Fallback */}
        <div className="portal-glass rounded-2xl p-5 border border-border/60 space-y-3">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Clipboard className="w-4 h-4 text-accent" /> Bypass Code Entry
          </h3>
          <form onSubmit={handleManualCheckIn} className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste security bypass QR string..."
              className="flex-1 px-3 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 placeholder:text-text-muted transition-all font-mono"
            />
            <button
              type="submit"
              disabled={checkInLoading || !manualToken.trim()}
              className="px-3 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkInLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>

        {/* Last scanned result view */}
        <div className="portal-glass rounded-2xl p-5 border border-border/60 min-h-[120px] flex flex-col justify-center relative overflow-hidden">
          {checkInLoading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Validating signature ticket...</p>
            </div>
          ) : checkInStatus ? (
            checkInStatus.success && checkInStatus.user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/15 border border-success/30 text-success text-[10px] font-extrabold tracking-wider uppercase animate-pulse">
                    <CheckCircle className="w-3.5 h-3.5" /> Checked In Successfully
                  </span>
                  <span className="text-[9px] text-text-muted font-mono">{checkInStatus.user.checked_in_at.split(" ")[1]}</span>
                </div>
                <div className="flex items-center gap-3 bg-surface-950/40 p-2 rounded-xl border border-border/20">
                  <img
                    src={checkInStatus.user.avatar}
                    alt={checkInStatus.user.name}
                    className="w-10 h-10 rounded-full border border-success/30"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-text-primary truncate">{checkInStatus.user.name}</h4>
                    <p className="text-[10px] text-text-muted">Cleared entry validation</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                    checkInStatus.user.status === "late"
                      ? "bg-warning/15 border-warning/30 text-warning"
                      : "bg-success/15 border-success/30 text-success"
                  }`}>
                    {checkInStatus.user.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error/15 border border-error/30 text-error text-[10px] font-extrabold tracking-wider uppercase">
                  <AlertCircle className="w-3.5 h-3.5" /> Validation Rejected
                </div>
                <p className="text-xs font-bold text-text-secondary px-4">{checkInStatus.message}</p>
              </div>
            )
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-text-muted italic flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary/45" /> Awaiting check-in sequence...
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Right panel - Live Attendees List */}
      <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col h-full overflow-hidden bg-surface-900/20">
        
        {/* Dynamic statistics overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="portal-glass rounded-2xl p-4 border border-border/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Validated Gate</span>
            <div className="flex items-end gap-1.5 mt-2">
              <span className="text-2xl font-extrabold text-text-primary leading-none transition-all">{stats.total}</span>
              {stats.capacity > 0 && <span className="text-xs text-text-muted">/ {stats.capacity}</span>}
            </div>
          </div>

          <div className="portal-glass rounded-2xl p-4 border border-border/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">On-Time Passes</span>
            <div className="flex items-end gap-1.5 mt-2 text-success">
              <UserCheck className="w-5 h-5 shrink-0" />
              <span className="text-2xl font-extrabold leading-none">{stats.present}</span>
            </div>
          </div>

          <div className="portal-glass rounded-2xl p-4 border border-border/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Late Gate Passes</span>
            <div className="flex items-end gap-1.5 mt-2 text-warning">
              <Clock className="w-5 h-5 shrink-0" />
              <span className="text-2xl font-extrabold leading-none">{stats.late}</span>
            </div>
          </div>

          <div className="portal-glass rounded-2xl p-4 border border-border/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Bypass Capacity</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-extrabold text-text-primary leading-none">{attendanceRate}%</span>
              <div className="flex-1 h-1.5 bg-surface-950 rounded-full overflow-hidden border border-border/10">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" 
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar - Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 bg-surface-950/40 p-3 rounded-2xl border border-border/40 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter list by attendee name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-900 border border-border/80 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted font-bold uppercase shrink-0">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Passes</option>
              <option value="present">Present (On Time)</option>
              <option value="late">Late Arrival</option>
            </select>
          </div>
        </div>

        {/* Live List Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar portal-glass rounded-2xl border border-border/60">
          {filteredAttendees.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-2">
              <Users className="w-10 h-10 text-text-muted/40 animate-pulse" />
              <p className="text-xs italic font-medium">No verified attendees found matching criteria.</p>
            </div>
          ) : (
            <div className="p-3 divide-y divide-border/20 space-y-2">
              {filteredAttendees.map((att, idx) => (
                <div
                  key={att.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                    newArrivalId === att.user_id
                      ? "border-success/50 bg-success/5 shadow-[0_0_15px_rgba(34,197,94,0.15)] animate-check-in-arrive"
                      : "border-border/30 bg-surface-950/20 hover:bg-surface-950/50 hover:border-border/65"
                  }`}
                  style={{
                    animationDelay: newArrivalId === att.user_id ? "0s" : `${Math.min(idx * 0.05, 0.8)}s`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={att.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                        alt={att.name}
                        className="w-9 h-9 rounded-full border border-border"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-950 ${
                        att.status === "late" ? "bg-warning" : "bg-success"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        {att.name}
                        {newArrivalId === att.user_id && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-success text-white animate-pulse">
                            NEW
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-text-muted truncate">{att.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/20">
                    <div className="text-left sm:text-right leading-tight">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary sm:justify-end">
                        <Clock className="w-3.5 h-3.5 text-primary/75" />
                        <span>{att.checked_in_at ? att.checked_in_at.split(" ")[1] : "N/A"}</span>
                      </div>
                      <p className="text-[9px] text-text-muted mt-0.5">
                        Scanned By: <span className="font-semibold text-text-secondary">{att.checked_in_by_name || "System"}</span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 ${
                      att.status === "late"
                        ? "bg-warning/10 border-warning/20 text-warning"
                        : "bg-success/10 border-success/20 text-success"
                    }`}>
                      {att.status === "late" ? "Late Check-in" : "Present"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
