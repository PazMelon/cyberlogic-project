import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Clock, MapPin, Users, X } from "lucide-react";
import { events } from "../../data/mockData";
import { Button, Card, DataTable } from "../../components/ui";

export default function EventManagement() {
  const [eventList, setEventList] = useState(events);
  const [isLoading, setIsLoading] = useState(true);

  // Form Collapse State
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Workshop" | "Seminar" | "Competition" | "Social" | "Meeting">("Workshop");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const typeColors: Record<string, string> = {
    Workshop: "bg-primary/10 text-primary",
    Seminar: "bg-info/10 text-info",
    Competition: "bg-error/10 text-error",
    Social: "bg-accent/10 text-accent",
    Meeting: "bg-success/10 text-success",
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time || !location) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newEvent = {
        id: Date.now(),
        title,
        description: description || "No description provided.",
        date,
        time,
        location,
        type,
        attendees: 0,
      };

      setEventList([newEvent, ...eventList]);
      setIsSubmitting(false);
      setShowForm(false);

      // Reset Form
      setTitle("");
      setType("Workshop");
      setDate("");
      setTime("");
      setLocation("");
      setCapacity("50");
      setDescription("");
    }, 800);
  };

  const handleDeleteEvent = (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEventList(eventList.filter((e) => e.id !== id));
    }
  };

  const eventColumns = [
    {
      header: "Event",
      accessor: (event: any) => (
        <div>
          <p className="text-sm font-semibold text-text-primary">{event.title}</p>
          <p className="text-xs text-text-muted truncate max-w-xs mt-0.5">{event.description}</p>
        </div>
      ),
      sortable: true,
      sortKey: "title" as any
    },
    {
      header: "Type",
      accessor: (event: any) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColors[event.type] || "bg-surface-700 text-text-muted"} border border-border/20`}>
          {event.type}
        </span>
      ),
      sortable: true,
      sortKey: "type" as any,
      className: "hidden sm:table-cell"
    },
    {
      header: "Date & Time",
      accessor: (event: any) => (
        <div className="text-xs text-text-secondary">
          <span>{event.date}</span>
          <span className="flex items-center gap-1 text-text-muted mt-0.5">
            <Clock className="w-3 h-3" /> {event.time}
          </span>
        </div>
      ),
      sortable: true,
      sortKey: "date" as any,
      className: "hidden md:table-cell"
    },
    {
      header: "Location",
      accessor: (event: any) => (
        <span className="text-xs text-text-muted flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {event.location}
        </span>
      ),
      sortable: true,
      sortKey: "location" as any,
      className: "hidden lg:table-cell"
    },
    {
      header: "Attendees",
      accessor: (event: any) => (
        <span className="text-xs text-text-muted flex items-center gap-1">
          <Users className="w-3 h-3" /> {event.attendees}
        </span>
      ),
      sortable: true,
      sortKey: "attendees" as any,
      className: "hidden lg:table-cell"
    },
    {
      header: "Actions",
      accessor: (event: any) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteEvent(event.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      className: "text-right"
    }
  ];

  const eventFilters = [
    {
      label: "Type",
      field: "type",
      options: [
        { label: "Workshop", value: "Workshop" },
        { label: "Seminar", value: "Seminar" },
        { label: "Competition", value: "Competition" },
        { label: "Social", value: "Social" },
        { label: "Meeting", value: "Meeting" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
            Events
          </h1>
          <p className="text-sm text-text-muted mt-1">{eventList.length} total events</p>
        </div>
        <Button
          type="button"
          variant="admin"
          icon={showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          className="px-4 py-2.5"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Close Form" : "New Event"}
        </Button>
      </div>

      {/* High-Fidelity Collapsible Inline Event Creation Form */}
      {showForm && (
        <Card className="p-6 border border-border/80 bg-surface-900/40 relative animate-fadeIn">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-text-primary font-[family-name:var(--font-heading)]">
                Create New Event
              </h2>
              <p className="text-xs text-text-muted">Fill in details below to broadcast an upcoming club activity</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            {/* Event Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyber Security Pentesting Workshop"
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>

            {/* Grid: Type & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Event Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50 transition-all"
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Competition">Competition</option>
                  <option value="Social">Social</option>
                  <option value="Meeting">Meeting</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Grid: Time & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Time *</label>
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 1:00 PM - 3:00 PM"
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lab 402 or Discord"
                  className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Attendee Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about prerequisites, speakers, topics..."
                className="w-full p-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 transition-all resize-none"
              />
            </div>

            {/* Buttons Toolbar */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="admin"
                isLoading={isSubmitting}
                className="px-5 py-2"
              >
                Create Event
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-muted">Loading events database...</p>
        </div>
      ) : (
        <DataTable
          data={eventList}
          columns={eventColumns}
          filterGroups={eventFilters}
          searchPlaceholder="Search events..."
          emptyStateText="No events found matching the criteria."
        />
      )}
    </div>
  );
}
