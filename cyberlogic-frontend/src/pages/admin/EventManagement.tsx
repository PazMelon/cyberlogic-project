import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Clock, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { fetchEvents, deleteEvent, formatEventTime } from "../../utils/api";
import { Button, DataTable } from "../../components/ui";
import type { Event } from "../../data/mockData";

export default function EventManagement() {
  const navigate = useNavigate();
  const [eventList, setEventList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEventList(data);
    } catch (err) {
      console.error("Failed to load events database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const typeColors: Record<string, string> = {
    Workshop: "bg-primary/10 text-primary",
    Seminar: "bg-info/10 text-info",
    Competition: "bg-error/10 text-error",
    Social: "bg-accent/10 text-accent",
    Meeting: "bg-success/10 text-success",
  };

  const handleDeleteEvent = async (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(id);
        setEventList(eventList.filter((e) => e.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete event.");
      }
    }
  };

  const eventColumns = [
    {
      header: "Event",
      accessor: (event: Event) => (
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
      accessor: (event: Event) => (
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
      accessor: (event: Event) => (
        <div className="text-xs text-text-secondary">
          <span>{event.date}</span>
          <span className="flex items-center gap-1 text-text-muted mt-0.5">
            <Clock className="w-3 h-3" /> {formatEventTime(event.startTime, event.endTime)}
          </span>
        </div>
      ),
      sortable: true,
      sortKey: "date" as any,
      className: "hidden md:table-cell"
    },
    {
      header: "Location",
      accessor: (event: Event) => (
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
      accessor: (event: Event) => (
        <span className="text-xs text-text-muted flex items-center gap-1">
          <Users className="w-3 h-3" /> {event.attendees} / {event.capacity || 50}
        </span>
      ),
      sortable: true,
      sortKey: "attendees" as any,
      className: "hidden lg:table-cell"
    },
    {
      header: "Actions",
      accessor: (event: Event) => (
        <div className="flex items-center justify-end gap-1">
          <button 
            type="button" 
            onClick={() => navigate(`/admin/events/edit/${event.id}`)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer" 
            title="Edit"
          >
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
            Events Management
          </h1>
          <p className="text-sm text-text-muted mt-1">{eventList.length} total events</p>
        </div>
        <Button
          type="button"
          variant="admin"
          icon={<Plus className="w-4 h-4" />}
          className="px-4 py-2.5 cursor-pointer"
          onClick={() => navigate("/admin/events/create")}
        >
          New Event
        </Button>
      </div>

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
