/** Server-side Kitchen Academy manifest loader */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { resolveKnowledgeRoot } from './knowledgeLoader.js';

export interface AcademyManifestProgram {
  track_id: string;
  degree_type: string;
  degree_label: string;
  credential: string;
  estimated_hours?: number;
}

export interface AcademyManifestDirectory {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  location?: string;
  programs: AcademyManifestProgram[];
}

export interface AcademyManifest {
  version: number;
  generated_at: string;
  directories: AcademyManifestDirectory[];
  featured_track_ids: string[];
  tracks: Record<
    string,
    {
      title: string;
      summary: string;
      track_type?: string;
      directory_id: string | null;
      degree_label: string | null;
      level_count: number;
      module_count: number;
    }
  >;
}

let cached: AcademyManifest | null = null;

export function loadAcademyManifest(): AcademyManifest {
  if (cached) return cached;
  const path = join(resolveKnowledgeRoot(), 'academy-manifest.json');
  if (!existsSync(path)) {
    cached = {
      version: 0,
      generated_at: '',
      directories: [],
      featured_track_ids: [
        'track.amateur_to_executive',
        'track.master_baker',
        'track.game_show',
      ],
      tracks: {},
    };
    return cached;
  }
  cached = JSON.parse(readFileSync(path, 'utf8')) as AcademyManifest;
  return cached;
}

export function listAcademyDirectoriesServer() {
  return loadAcademyManifest().directories;
}

export function listFeaturedTrackIdsServer(): string[] {
  return loadAcademyManifest().featured_track_ids;
}
