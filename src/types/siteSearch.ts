export type SiteSearchCategory =
  | 'page'
  | 'platform'
  | 'feature'
  | 'vision'
  | 'learn'
  | 'faq'
  | 'legal'
  | 'pricing';

export interface SiteSearchEntry {
  id: string;
  title: string;
  href: string;
  category: SiteSearchCategory;
  summary: string;
  keywords?: string;
  status?: 'live' | 'beta' | 'vision';
}

export interface SiteSearchResult extends SiteSearchEntry {
  score: number;
  snippet: string;
}

export interface SiteAskResponse {
  answer: string;
  sources: SiteSearchEntry[];
  ai_used: boolean;
  suggest_signup?: boolean;
}
