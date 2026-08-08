export interface CollaboratorOption {
  id: number;
  name: string;
  avatar?: string | null;
}

export type BoardType = "activity" | "ideas" | "brainstorming" | "roadmap";
export type BoardVisibility = "public" | "private";
export type ColumnPolicy = "host_admin_only" | "specific_roles" | "specific_users" | "everyone";
export type GanttEditPolicy = "host_admin_only" | "specific_roles" | "specific_users" | "everyone";
export type PhaseMethodology = "waterfall" | "agile" | "custom";
