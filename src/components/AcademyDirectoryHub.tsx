import { Link } from 'react-router-dom';
import { Building2, GraduationCap, ChevronRight } from 'lucide-react';
import {
  listAcademyDirectories,
  getTrackMeta,
  totalAcademyModules,
  totalAcademyLevels,
} from '@/lib/academyManifest';

interface AcademyDirectoryHubProps {
  dark?: boolean;
}

export default function AcademyDirectoryHub({ dark = false }: AcademyDirectoryHubProps) {
  const directories = listAcademyDirectories();
  if (!directories.length) return null;

  const sectionTitle = dark ? 'text-white' : 'text-chef';
  const card = dark
    ? 'rounded-xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 hover:border-copper-400/40 transition group'
    : 'rounded-xl border border-steel bg-white p-5 hover:border-copper-400/50 shadow-card transition group';

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`text-sm font-semibold flex items-center gap-2 ${sectionTitle}`}>
            <Building2 size={16} className={dark ? 'text-copper-300' : 'text-copper-600'} />
            Culinary school directories
          </h2>
          <p className={`text-xs mt-1 ${dark ? 'text-white/55' : 'text-chef-subtle'}`}>
            {directories.length} schools · {totalAcademyLevels()} levels · {totalAcademyModules()} practice modules
          </p>
        </div>
        <Link
          to="/learn/schools"
          className={`text-xs font-semibold inline-flex items-center gap-1 min-h-[44px] ${
            dark ? 'text-copper-300 hover:text-copper-200' : 'text-copper-600 hover:text-copper-700'
          }`}
        >
          Full catalog
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {directories.map((dir) => {
          const programCount = dir.programs.length;
          const moduleTotal = dir.programs.reduce(
            (n, p) => n + (getTrackMeta(p.track_id)?.module_count ?? 0),
            0,
          );
          return (
            <Link key={dir.id} to={`/learn/schools/${dir.id}`} className={card}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-copper-300' : 'text-copper-600'}`}>
                {dir.location ?? 'Kitchen Academy campus'}
              </p>
              <p className={`font-display text-lg mt-2 tracking-tight ${dark ? 'text-white group-hover:text-copper-200' : 'text-chef'}`}>
                {dir.title}
              </p>
              <p className={`text-xs mt-1 ${dark ? 'text-white/50' : 'text-chef-subtle'}`}>{dir.tagline}</p>
              <p className={`text-sm mt-2 line-clamp-2 leading-relaxed ${dark ? 'text-white/60' : 'text-chef-muted'}`}>
                {dir.summary}
              </p>
              <div className={`flex items-center gap-3 mt-3 text-[10px] ${dark ? 'text-white/40' : 'text-chef-subtle'}`}>
                <span className="inline-flex items-center gap-1">
                  <GraduationCap size={12} />
                  {programCount} {programCount === 1 ? 'program' : 'programs'}
                </span>
                <span>{moduleTotal} modules</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
