import { getDeepById } from '@/lib/deepCatalog';
import type { DeepKnowledgeEntry } from '@/types/knowledgeDeep';

export const FEATURED_ACADEMY_TRACK_IDS = [
  'track.amateur_to_executive',
  'track.master_baker',
  'track.game_show',
] as const;

export type FeaturedAcademyTrackId = (typeof FEATURED_ACADEMY_TRACK_IDS)[number];

export const ACADEMY_TRACK_BADGE: Record<FeaturedAcademyTrackId, string> = {
  'track.amateur_to_executive': 'Career ladder · 8 levels',
  'track.master_baker': "Baker's path · 6 levels",
  'track.game_show': 'Game show prep · 6 modules',
};

export function getFeaturedAcademyTracks(): DeepKnowledgeEntry[] {
  return FEATURED_ACADEMY_TRACK_IDS.map((id) => getDeepById(id)).filter(
    (e): e is DeepKnowledgeEntry => Boolean(e?.levels?.length),
  );
}

export function isFeaturedAcademyTrack(id: string): id is FeaturedAcademyTrackId {
  return (FEATURED_ACADEMY_TRACK_IDS as readonly string[]).includes(id);
}

export function moduleCount(track: DeepKnowledgeEntry): number {
  return (track.levels ?? []).reduce((n, l) => n + (l.modules?.length ?? 0), 0);
}
