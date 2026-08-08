export const PRESET_COLORS = [
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#10b981", // Emerald
];

export const AVAILABLE_ROLES = [
  { id: "officer", label: "Officers & Leads" },
  { id: "member", label: "General Members" },
  { id: "admin", label: "Admins & Superadmins" },
];

export const BOARD_TYPES: Array<{
  id: "activity" | "ideas" | "brainstorming" | "roadmap";
  label: string;
  badge: string;
  description: string;
  accentColor: string;
}> = [
  {
    id: "activity",
    label: "Activity Board",
    badge: "Scheduled Events",
    description: "Plan events and club activities with start & end dates",
    accentColor: "#06b6d4",
  },
  {
    id: "ideas",
    label: "Idea Box Board",
    badge: "Ideas Only (No Date)",
    description: "Collect member suggestions, feature requests & feedback",
    accentColor: "#f59e0b",
  },
  {
    id: "brainstorming",
    label: "Brainstorming",
    badge: "Collab Ideation",
    description: "Collaborative workshops, team concepts & open discussions",
    accentColor: "#8b5cf6",
  },
  {
    id: "roadmap",
    label: "Project Roadmap",
    badge: "Milestones & Target Dates",
    description: "Track initiative milestones, deliverables & release goals",
    accentColor: "#10b981",
  },
];

export const COVER_GRADIENTS = [
  { name: "Cyan Cyber", color: "#06b6d4" },
  { name: "Emerald Tech", color: "#10b981" },
  { name: "Amber Glow", color: "#f59e0b" },
  { name: "Purple Neon", color: "#8b5cf6" },
  { name: "Rose Pulse", color: "#ec4899" },
  { name: "Royal Blue", color: "#3b82f6" },
];

export const STATUS_TYPES = [
  {
    id: "not_started",
    label: "Not Started / To Do",
    description: "Initial backlog or pending work items",
    bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    dot: "bg-yellow-400",
  },
  {
    id: "in_progress",
    label: "In Progress",
    description: "Tasks currently being worked on",
    bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    dot: "bg-cyan-400",
  },
  {
    id: "blocked",
    label: "Blocked / On Hold",
    description: "Tasks waiting on external dependencies",
    bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    dot: "bg-rose-400",
  },
  {
    id: "completed",
    label: "Completed / Done",
    description: "Finished tasks and milestone deliverables",
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    dot: "bg-emerald-400",
  },
];
