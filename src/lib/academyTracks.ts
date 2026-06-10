import { getDeepById } from '@/lib/deepCatalog';
import type { DeepKnowledgeEntry } from '@/types/knowledgeDeep';
import {
  FEATURED_ACADEMY_TRACK_IDS,
  getTrackMeta,
  type AcademyTrackMeta,
} from '@/lib/academyManifest';

export { FEATURED_ACADEMY_TRACK_IDS };

export type FeaturedAcademyTrackId = (typeof FEATURED_ACADEMY_TRACK_IDS)[number];

const BADGE_OVERRIDES: Partial<Record<string, string>> = {
  'track.amateur_to_executive': 'Associate · 8 levels',
  'track.master_baker': 'Diploma · 6 levels',
  'track.game_show': 'Competition · 6 levels',
  'track.plant_forward': 'Certificate · 4 levels',
  'track.garde_manger': 'Certificate · 4 levels',
  'track.hospitality': 'Certificate · 4 levels',
  'track.global_cuisines': 'Diploma · 6 regions',
};

export function trackBadge(trackId: string, meta?: AcademyTrackMeta): string {
  if (BADGE_OVERRIDES[trackId]) return BADGE_OVERRIDES[trackId]!;
  const m = meta ?? getTrackMeta(trackId);
  if (m?.degree_label) return `${m.degree_label} · ${m.level_count} levels`;
  return `${m?.level_count ?? 0} levels`;
}

/** @deprecated use trackBadge */
export const ACADEMY_TRACK_BADGE: Record<string, string> = Object.fromEntries(
  FEATURED_ACADEMY_TRACK_IDS.map((id) => [id, trackBadge(id)]),
);

export function getFeaturedAcademyTracks(): DeepKnowledgeEntry[] {
  return FEATURED_ACADEMY_TRACK_IDS.map((id) => getDeepById(id)).filter(
    (e): e is DeepKnowledgeEntry => Boolean(e?.levels?.length),
  );
}

export function isFeaturedAcademyTrack(id: string): boolean {
  return FEATURED_ACADEMY_TRACK_IDS.includes(id);
}

export function moduleCount(track: DeepKnowledgeEntry): number {
  const meta = getTrackMeta(track.id);
  if (meta?.module_count) return meta.module_count;
  return (track.levels ?? []).reduce((n, l) => n + (l.modules?.length ?? 0), 0);
}

export function levelCount(track: DeepKnowledgeEntry): number {
  const meta = getTrackMeta(track.id);
  if (meta?.level_count) return meta.level_count;
  return track.levels?.length ?? 0;
}
