import { Link } from 'react-router-dom';
import { GraduationCap, Trophy, ChefHat } from 'lucide-react';
import {
  ACADEMY_TRACK_BADGE,
  getFeaturedAcademyTracks,
  moduleCount,
  type FeaturedAcademyTrackId,
} from '@/lib/academyTracks';

const TRACK_ICON: Record<FeaturedAcademyTrackId, typeof GraduationCap> = {
  'track.amateur_to_executive': ChefHat,
  'track.master_baker': GraduationCap,
  'track.game_show': Trophy,
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
        <h2 className={`text-sm font-semibold ${sectionTitle}`}>Featured pathways</h2>
        <p className={`text-xs mt-1 ${dark ? 'text-white/55' : 'text-chef-subtle'}`}>
          Structured ladders with leveled modules — techniques, taste profiles, ingredients, and practice recipes.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {tracks.map((track) => {
          const Icon = TRACK_ICON[track.id as FeaturedAcademyTrackId] ?? GraduationCap;
          const badge = ACADEMY_TRACK_BADGE[track.id as FeaturedAcademyTrackId] ?? `${track.levels?.length ?? 0} levels`;
          return (
            <Link key={track.id} to={`/learn/${track.id}`} className={card}>
              <div className="flex items-center gap-2">
                <Icon size={16} className={dark ? 'text-copper-300' : 'text-copper-600'} />
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-copper-300' : 'text-copper-600'}`}>
                  {badge}
                </p>
              </div>
              <p className={`font-semibold mt-2 ${dark ? 'text-white group-hover:text-copper-200' : 'text-chef'}`}>
                {track.title}
              </p>
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
