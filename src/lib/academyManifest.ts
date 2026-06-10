/**
 * Kitchen Academy manifest — schools, degree programs, featured tracks.
 * Generated to data/ai/academy-manifest.json via npm run knowledge:training
 */

import type { AcademyDirectory, AcademyDegreeProgram } from '@/types/knowledgeDeep';

export interface AcademyTrackMeta {
  title: string;
  summary: string;
  track_type?: string;
  directory_id: string | null;
  degree_label: string | null;
  level_count: number;
  module_count: number;
}

export interface AcademyManifest {
  version: number;
  generated_at: string;
  directories: AcademyDirectory[];
  featured_track_ids: string[];
  tracks: Record<string, AcademyTrackMeta>;
}

import manifestJson from '../../data/ai/academy-manifest.json';

export const ACADEMY_MANIFEST = manifestJson as AcademyManifest;

export const FEATURED_ACADEMY_TRACK_IDS = ACADEMY_MANIFEST.featured_track_ids;

export function listAcademyDirectories(): AcademyDirectory[] {
  return ACADEMY_MANIFEST.directories;
}

export function getAcademyDirectory(id: string): AcademyDirectory | undefined {
  return ACADEMY_MANIFEST.directories.find((d) => d.id === id);
}

export function getTrackMeta(trackId: string): AcademyTrackMeta | undefined {
  return ACADEMY_MANIFEST.tracks[trackId];
}

export function programsForDirectory(directoryId: string): AcademyDegreeProgram[] {
  return getAcademyDirectory(directoryId)?.programs ?? [];
}

export function directoryForTrack(trackId: string): AcademyDirectory | undefined {
  const meta = getTrackMeta(trackId);
  if (!meta?.directory_id) return undefined;
  return getAcademyDirectory(meta.directory_id);
}

export function totalAcademyModules(): number {
  return Object.values(ACADEMY_MANIFEST.tracks).reduce((n, t) => n + t.module_count, 0);
}

export function totalAcademyLevels(): number {
  return Object.values(ACADEMY_MANIFEST.tracks).reduce((n, t) => n + t.level_count, 0);
}
