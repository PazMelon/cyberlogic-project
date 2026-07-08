import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Search, Download, Users, CheckCircle, Clock, AlertCircle, ShieldAlert } from "lucide-react";
import { fetchEventById, fetchEventAttendees } from "../../utils/api";
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

interface RegistrationRecord {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar: string;
  registered_at: string;
}

export default function EventAttendeesView() {
  const { id } = useParams();
  const eventId = Number(id);

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/tab states
  const [activeTab, setActiveTab] = useState<"rsvp" | "attendance">("rsvp");
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "present" | "late">("all");

  useEffect(() => {
    async function loadData() {
      try {
        const eventData = await fetchEventById(eventId);
        setEvent(eventData);

        // Set default tab based on mode
        if (eventData.eventMode === "attendance_only") {
          setActiveTab("attendance");
        } else {
          setActiveTab("rsvp");
        }

        const listData = await fetchEventAttendees(eventId);
        setAttendees(listData.attendees);
        setRegistrations(listData.registrations);
      } catch (err: any) {
        setError(err.message || "Failed to load attendees information.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!event) return;

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (activeTab === "rsvp") {
      headers = ["User ID", "Name", "Email", "Registration Date"];
      rows = filteredRegistrations.map(reg => [
        reg.user_id.toString(),
        reg.name,
        reg.email,
        reg.registered_at
      ]);
      filename = `event_${event.id}_registrations.csv`;
    } else {
      headers = ["User ID", "Name", "Email", "Status", "Checked-in At", "Checked-in By"];
      rows = filteredAttendees.map(att => [
        att.user_id.toString(),
        att.name,
        att.email,
        att.status,
        att.checked_in_at,
        att.checked_in_by_name || "N/A"
      ]);
      filename = `event_${event.id}_attendance.csv`;
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = registrations.filter(
    (reg) =>
      reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttendees = attendees.filter((att) => {
    const matchesSearch =
      att.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      attendanceFilter === "all" || att.status === attendanceFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Loading attendees records...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-error mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Event Attendees Record</h2>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/events"
            className="p-2 rounded-xl bg-surface-800 border border-border/80 text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Event Attendees Desk
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Event: <span className="font-semibold text-text-secondary">{event.title}</span> ({event.date})
            </p>
          </div>
        </div>
        
        {/* Quick info / buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {event.eventMode !== "registration_only" && (
            <Link
              to={`/admin/events/${eventId}/scanner`}
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:bg-primary-hover transition-all flex items-center gap-1.5"
            >
              Open QR Scanner
            </Link>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-surface-800 border border-border hover:border-primary/20 hover:text-primary transition-all text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      {event.eventMode === "registration_and_attendance" && (
        <div className="flex border-b border-border/50">
          <button
            onClick={() => {
              setActiveTab("rsvp");
              setSearchQuery("");
            }}
            className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "rsvp"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Registered Participants ({registrations.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("attendance");
              setSearchQuery("");
            }}
            className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "attendance"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Checked-in Attendees ({attendees.length})
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-900/40 p-4 rounded-2xl border border-border">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by name or email...`}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-850 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        {/* Filter (Only for Checked-in tab) */}
        {activeTab === "attendance" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-medium">Status:</span>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-surface-850 border border-border text-xs text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Check-ins</option>
              <option value="present">On Time</option>
              <option value="late">Late Check-ins</option>
            </select>
          </div>
        )}
      </div>

      {/* Table grid */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        {activeTab === "rsvp" ? (
          /* RSVP Registered Participants list */
          filteredRegistrations.length === 0 ? (
            <div className="text-center py-16 text-text-muted space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-text-muted/65" />
              <p className="text-xs italic">No registered participants found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-900/60 border-b border-border/80 text-text-muted font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={reg.avatar} alt={reg.name} className="w-8 h-8 rounded-full border border-border" />
                        <span className="text-text-primary font-bold">{reg.name}</span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{reg.email}</td>
                      <td className="px-6 py-4 text-text-muted flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {reg.registered_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Checked-in Attendance list */
          filteredAttendees.length === 0 ? (
            <div className="text-center py-16 text-text-muted space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-text-muted/65" />
              <p className="text-xs italic">No checked-in attendees found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-900/60 border-b border-border/80 text-text-muted font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Check-in Status</th>
                    <th className="px-6 py-4">Scanned At</th>
                    <th className="px-6 py-4">Scanned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {filteredAttendees.map((att) => (
                    <tr key={att.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={att.avatar} alt={att.name} className="w-8 h-8 rounded-full border border-border" />
                        <span className="text-text-primary font-bold">{att.name}</span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{att.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          att.status === 'late'
                            ? 'bg-warning/15 border-warning/30 text-warning'
                            : 'bg-success/15 border-success/30 text-success'
                        }`}>
                          <CheckCircle className="w-3 h-3" />
                          {att.status === 'late' ? 'Late Check-in' : 'Present'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {att.checked_in_at}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-semibold">{att.checked_in_by_name || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
