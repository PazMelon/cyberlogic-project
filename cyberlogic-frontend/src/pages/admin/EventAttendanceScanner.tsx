import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Camera, AlertCircle, CheckCircle, RefreshCw, Clipboard, Send } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { fetchEventById, checkInAttendee } from "../../utils/api";
import type { Event } from "../../data/mockData";

export default function EventAttendanceScanner() {
  const { id } = useParams();
  const eventId = Number(id);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scanner states
  const [scannerActive, setScannerActive] = useState(false);
  const [scanningError, setScanningError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
  const [recentCheckedIn, setRecentCheckedIn] = useState<any[]>([]);

  // Load Event Info
  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await fetchEventById(eventId);
        setEvent(data);
      } catch (err: any) {
        setError(err.message || "Failed to load event details.");
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  // Handle Scan Success
  const handleScanSuccess = async (decodedText: string) => {
    if (checkInLoading) return;
    
    // Temporarily pause/stop scanner to prevent double scans
    stopScanner();
    setCheckInLoading(true);
    setCheckInStatus(null);
    setScanningError(null);

    try {
      const response = await checkInAttendee(eventId, decodedText);
      setCheckInStatus({
        success: true,
        message: response.message,
        user: response.attendee
      });
      // Add to recent
      setRecentCheckedIn(prev => [response.attendee, ...prev.slice(0, 4)]);
      // Vibrate if mobile device supports it
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (err: any) {
      setCheckInStatus({
        success: false,
        message: err.message || "Failed to check in user."
      });
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setCheckInLoading(false);
      // Automatically restart scanning after 2.5 seconds
      setTimeout(() => {
        startScanner();
      }, 2500);
    }
  };

  // Start QR Scanner
  const startScanner = () => {
    if (scannerActive) return;
    setScanningError(null);
    
    setTimeout(() => {
      const container = document.getElementById("qr-scanner-element");
      if (!container) return;

      const html5Qrcode = new Html5Qrcode("qr-scanner-element");
      scannerRef.current = html5Qrcode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5Qrcode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Quietly handle frame parsing failures
          }
        )
        .then(() => {
          setScannerActive(true);
        })
        .catch((err) => {
          console.error("Failed to start scanner:", err);
          setScanningError("Could not access camera. Please make sure permissions are granted.");
          setScannerActive(false);
        });
    }, 100);
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
        })
        .catch((err) => {
          console.error("Failed to stop scanner:", err);
        });
    } else {
      setScannerActive(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Cleanup stop failed", err));
      }
    };
  }, []);

  // Handle Manual Check-in
  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim() || checkInLoading) return;

    setCheckInLoading(true);
    setCheckInStatus(null);

    try {
      const response = await checkInAttendee(eventId, manualToken.trim());
      setCheckInStatus({
        success: true,
        message: response.message,
        user: response.attendee
      });
      setRecentCheckedIn(prev => [response.attendee, ...prev.slice(0, 4)]);
      setManualToken("");
    } catch (err: any) {
      setCheckInStatus({
        success: false,
        message: err.message || "Failed to check in user."
      });
    } finally {
      setCheckInLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Initializing Attendance Scanner...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-error mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Event Attendance QR Scanner</h2>
        <p className="text-xs text-text-muted mt-1">{error || "Event not found"}</p>
        <Link
          to="/admin/events"
          className="text-primary hover:underline text-sm mt-4 flex items-center gap-1 bg-surface-850 px-3 py-1.5 rounded-lg border border-border"
        >
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/events"
            className="p-2 rounded-xl bg-surface-800 border border-border/80 text-text-muted hover:text-text-primary transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" /> Attendance QR Scanner
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Event: <span className="font-semibold text-text-secondary">{event.title}</span> ({event.date})
            </p>
          </div>
        </div>
        <Link
          to={`/admin/events/${eventId}/attendees`}
          className="px-4 py-2 bg-surface-800 border border-border hover:border-primary/20 hover:text-primary transition-all text-xs font-semibold rounded-xl"
        >
          View Attendees List
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scanner Box */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="glass rounded-2xl border border-border overflow-hidden p-6 flex flex-col items-center justify-center min-h-[380px] relative">
            
            {/* The QR Container */}
            <div 
              id="qr-scanner-element" 
              className={`w-full max-w-[320px] aspect-square rounded-xl overflow-hidden bg-surface-900 border border-border relative ${
                scannerActive ? "border-primary/50" : "border-dashed"
              }`}
            >
              {!scannerActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="p-4 bg-primary/10 rounded-full border border-primary/20 text-primary">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-text-secondary font-medium">Camera Scanner Inactive</p>
                  <p className="text-[10px] text-text-muted max-w-[200px]">
                    Click the button below to start the camera and begin scanning attendance QR codes.
                  </p>
                </div>
              )}
            </div>

            {/* Start / Stop Toggle */}
            <button
              type="button"
              onClick={scannerActive ? stopScanner : startScanner}
              className={`mt-6 px-6 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                scannerActive
                  ? "bg-error/15 border-error/40 text-error hover:bg-error/25"
                  : "bg-primary text-white hover:bg-primary-hover border-transparent"
              }`}
            >
              {scannerActive ? (
                <>Stop Scanner Camera</>
              ) : (
                <>
                  <Camera className="w-4 h-4" /> Start Scanner Camera
                </>
              )}
            </button>

            {/* Error accessing camera */}
            {scanningError && (
              <div className="mt-4 flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl p-3 text-[11px] text-error max-w-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{scanningError}</span>
              </div>
            )}
          </div>

          {/* Manual input code fallback */}
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Clipboard className="w-4 h-4 text-accent" /> Manual Token Check-in
            </h3>
            <form onSubmit={handleManualCheckIn} className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                placeholder="Paste attendee QR token string here..."
                className="flex-1 px-4 py-2 rounded-xl bg-surface-850 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 placeholder:text-text-muted transition-all"
              />
              <button
                type="submit"
                disabled={checkInLoading || !manualToken.trim()}
                className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:bg-primary-hover transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkInLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit
              </button>
            </form>
          </div>
        </div>

        {/* Right: Scan Status & History */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Status Box */}
          <div className="glass rounded-2xl border border-border p-6 min-h-[160px] flex flex-col justify-center">
            {checkInLoading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                <p className="text-xs text-text-muted">Verifying ticket signature...</p>
              </div>
            ) : checkInStatus ? (
              checkInStatus.success && checkInStatus.user ? (
                // Success State
                <div className="space-y-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-[11px] font-bold">
                    <CheckCircle className="w-4 h-4" /> SUCCESSFUL CHECK-IN
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                    <img 
                      src={checkInStatus.user.avatar} 
                      alt={checkInStatus.user.name} 
                      className="w-16 h-16 rounded-full border border-success/30" 
                    />
                    <div>
                      <h4 className="text-base font-bold text-text-primary">{checkInStatus.user.name}</h4>
                      <p className="text-xs text-text-muted">Checked in successfully</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      checkInStatus.user.status === 'late' 
                        ? 'bg-warning/15 border-warning/30 text-warning' 
                        : 'bg-success/15 border-success/30 text-success'
                    }`}>
                      {checkInStatus.user.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-text-muted font-medium bg-surface-800 border border-border px-2 py-0.5 rounded-full">
                      {checkInStatus.user.checked_in_at.split(" ")[1]}
                    </span>
                  </div>
                </div>
              ) : (
                // Error State
                <div className="space-y-3 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/15 border border-error/30 text-error text-[11px] font-bold">
                    <AlertCircle className="w-4 h-4" /> CHECK-IN FAILED
                  </div>
                  <p className="text-xs font-semibold text-text-secondary leading-relaxed max-w-xs mx-auto">
                    {checkInStatus.message}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    Please ensure the member is signed in and present a valid QR token.
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-text-muted italic">Awaiting scan or token submission...</p>
              </div>
            )}
          </div>

          {/* Quick Check-in History */}
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Recent Check-ins
            </h3>
            {recentCheckedIn.length === 0 ? (
              <p className="text-[11px] text-text-muted italic py-2">No users checked in during this session.</p>
            ) : (
              <div className="space-y-3">
                {recentCheckedIn.map((user, idx) => (
                  <div key={`${user.id}-${idx}`} className="flex items-center justify-between bg-surface-900/50 p-2.5 rounded-xl border border-border/60">
                    <div className="flex items-center gap-2.5">
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full border border-border" />
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{user.name}</p>
                        <p className="text-[10px] text-text-muted">Check-in: {user.checked_in_at.split(" ")[1]}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      user.status === 'late' 
                        ? 'bg-warning/10 border-warning/20 text-warning' 
                        : 'bg-success/10 border-success/20 text-success'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
