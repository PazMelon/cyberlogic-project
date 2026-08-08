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

export interface ExtendedCyberboardBoardAsset {
  id: string | number;
  board_id?: number;
  card_id?: number;
  card_title?: string;
  title: string;
  url: string;
  type: "link" | "image" | "file" | "card_link" | "card_attachment";
  description?: string | null;
  user_id?: number;
  user_name?: string;
  created_at?: string;
  user?: {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar?: string | null;
    avatar_path?: string | null;
    role?: string;
  };
  uploader?: {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar?: string | null;
  };
  provider?: string;
  is_card_attachment?: boolean;
  original_size?: number;
}
