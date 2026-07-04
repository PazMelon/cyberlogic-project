// ============================================================
// Blog Editor — Content Section Types
// ============================================================

export const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

export type SectionType = 'text' | 'image' | 'quote' | 'divider';

export type ImageTemplate = 'single' | 'side-by-side' | 'bento-3' | 'bento-4' | 'bento-6' | 'banner';

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
  template: ImageTemplate;
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

// Helper to get required image count for a template
export function getTemplateImageCount(template: ImageTemplate): number {
  switch (template) {
    case 'single': return 1;
    case 'side-by-side': return 2;
    case 'bento-3': return 3;
    case 'bento-4': return 4;
    case 'bento-6': return 6;
    case 'banner': return 1;
  }
}

export interface BlogEditorState {
  title: string;
  excerpt: string;
  author: string;
  category: string;
  image: string; // Cover image URL
  read_time: string;
  featured: boolean;
  sections: ContentSection[];
}

export const INITIAL_EDITOR_STATE: BlogEditorState = {
  title: '',
  excerpt: '',
  author: '',
  category: 'Guides',
  image: '',
  read_time: '5 min',
  featured: false,
  sections: [
    { type: 'text', id: generateId(), html: '' },
  ],
};

export const CATEGORIES = [
  'Guides', 'Recipes', 'Culture', 'Ingredients', 'Sustainability', 'Reviews', 'News',
];
