// ============================================================
// CMS Blog Editor — Shared Types & Utilities
// ============================================================

export type SectionType = 'text' | 'image' | 'quote' | 'divider';
export type ImageTemplate = 'single' | 'side-by-side' | 'bento-3' | 'bento-4' | 'bento-6' | 'banner' | 'carousel';

export interface ImageSlot {
  url: string;
  alt: string;
}

export interface TextSection {
  type: 'text';
  id: string;
  html: string;
  title?: string;
  subtitle?: string;
}

export interface ImageSection {
  type: 'image';
  id: string;
  template?: ImageTemplate;
  images: ImageSlot[];
  caption?: string;
}

export interface QuoteSection {
  type: 'quote';
  id: string;
  text: string;
  attribution?: string;
}

export interface DividerSection {
  type: 'divider';
  id: string;
}

export type ContentSection = TextSection | ImageSection | QuoteSection | DividerSection;

export interface CMSBlogState {
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string; // intro text
  author: string;
  authorAvatar?: string;
  userId?: number;
  category: string;
  image?: string; // cover image URL
  readTime?: string;
  featured?: boolean; // mapped to pinned or featured
  sections: ContentSection[];
  
  isEvent?: boolean;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventLocation?: string;
  eventCapacity?: number;
  eventMode?: 'registration_and_attendance' | 'attendance_only' | 'registration_only';
  attendanceCapacity?: number;
  registrationStart?: string;
  registrationEnd?: string;
  attendanceStart?: string;
  attendanceEnd?: string;

  isResource?: boolean;
  resourceLink?: string;
  resourceFile?: File | null;
  resourceFilePath?: string;
  resourceIcon?: string;

  status?: 'published' | 'draft' | 'pending' | 'rejected' | 'upcoming' | 'ongoing' | 'completed' | 'closed' | 'postponed';
  tags?: string[];
}

export const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

export function getTemplateImageCount(template: ImageTemplate): number {
  switch (template) {
    case 'single': return 1;
    case 'side-by-side': return 2;
    case 'bento-3': return 3;
    case 'bento-4': return 4;
    case 'bento-6': return 6;
    case 'banner': return 1;
    case 'carousel': return 8;
  }
}
