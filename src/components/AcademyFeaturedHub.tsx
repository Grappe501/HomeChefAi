import { Link } from 'react-router-dom';
import { GraduationCap, Trophy, ChefHat, Leaf, Snowflake, Users, Globe } from 'lucide-react';
import { getFeaturedAcademyTracks, moduleCount, trackBadge } from '@/lib/academyTracks';
import { directoryForTrack } from '@/lib/academyManifest';
import type { LucideIcon } from 'lucide-react';

const TRACK_ICON: Record<string, LucideIcon> = {
  'track.amateur_to_executive': ChefHat,
  'track.master_baker': GraduationCap,
  'track.game_show': Trophy,
  'track.plant_forward': Leaf,
  'track.garde_manger': Snowflake,
  'track.hospitality': Users,
  'track.global_cuisines': Globe,
};

interface AcademyFeaturedHubProps {
  dark?: boolean;
}

export default function AcademyFeaturedHub({ dark = false }: AcademyFeaturedHubProps) {
  const tracks = getFeaturedAcademyTracks();
  if (!tracks.length) return null;

  const sectionTitle = dark ? 'text-white' : 'text-chef';
  const card = dark
    ? 'rounded-xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 hover:border-white/25 transition group'
    : 'rounded-xl border border-steel bg-white p-4 hover:border-copper-400/50 transition';

  return (
    <section className="space-y-3">
      <div>
        <h2 className={`text-sm font-semibold ${sectionTitle}`}>Degree tracks</h2>
        <p className={`text-xs mt-1 ${dark ? 'text-white/55' : 'text-chef-subtle'}`}>
          Leveled programs with techniques, taste profiles, ingredients, and pantry-matched practice recipes.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track) => {
          const Icon = TRACK_ICON[track.id] ?? GraduationCap;
          const badge = trackBadge(track.id);
          const school = directoryForTrack(track.id);
          return (
            <Link key={track.id} to={`/learn/${track.id}`} className={card}>
              <div className="flex items-center gap-2">
                <Icon size={16} className={dark ? 'text-copper-300' : 'text-copper-600'} />
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-copper-300' : 'text-copper-600'}`}>
                  {badge}
                </p>
              </div>
              {track.degree_label && (
                <p className={`text-[10px] mt-2 ${dark ? 'text-white/45' : 'text-chef-subtle'}`}>
                  {track.degree_label}
                </p>
              )}
              <p className={`font-semibold mt-1 ${dark ? 'text-white group-hover:text-copper-200' : 'text-chef'}`}>
                {track.title}
              </p>
              {school && (
                <p className={`text-[10px] mt-1 ${dark ? 'text-white/40' : 'text-chef-subtle'}`}>{school.title}</p>
              )}
              <p className={`text-sm mt-1 line-clamp-3 ${dark ? 'text-white/60' : 'text-chef-subtle'}`}>
                {track.summary}
              </p>
              <p className={`text-[10px] mt-2 ${dark ? 'text-white/40' : 'text-chef-subtle'}`}>
                {moduleCount(track)} practice modules
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
