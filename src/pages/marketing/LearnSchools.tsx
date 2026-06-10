import { Link, Navigate, useParams } from 'react-router-dom';
import { Building2, Clock, GraduationCap } from 'lucide-react';
import { MarketingLayout, PageHeader } from '@/components/marketing/MarketingLayout';
import { PageMeta } from '@/components/marketing/PageMeta';
import AcademyDirectoryHub from '@/components/AcademyDirectoryHub';
import {
  getAcademyDirectory,
  getTrackMeta,
  listAcademyDirectories,
  totalAcademyModules,
} from '@/lib/academyManifest';
import { getDeepById } from '@/lib/deepCatalog';
import { moduleCount, trackBadge } from '@/lib/academyTracks';

export function LearnSchoolsIndexPage() {
  const schools = listAcademyDirectories();

  return (
    <MarketingLayout crumbs={[{ label: 'Learn', href: '/learn' }, { label: 'Schools' }]} dark>
      <PageMeta
        title="Culinary School Directories"
        description="Five Kitchen Academy schools — associate, diploma, and certificate programs with leveled modules and pantry-matched practice."
        path="/learn/schools"
      />
      <div className="mx-auto max-w-5xl px-5 py-10">
        <PageHeader
          dark
          title="Culinary school directories"
          lead={`${schools.length} schools · ${totalAcademyModules()} practice modules across degree tracks — from classical brigade training to world cuisine diplomas.`}
        />
        <div className="mt-8">
          <AcademyDirectoryHub dark />
        </div>
      </div>
    </MarketingLayout>
  );
}

export function LearnSchoolDetailPage() {
  const { directoryId } = useParams<{ directoryId: string }>();
  const directory = directoryId ? getAcademyDirectory(directoryId) : undefined;

  if (!directory) return <Navigate to="/learn/schools" replace />;

  return (
    <MarketingLayout
      dark
      crumbs={[
        { label: 'Learn', href: '/learn' },
        { label: 'Schools', href: '/learn/schools' },
        { label: directory.title },
      ]}
    >
      <PageMeta
        title={directory.title}
        description={directory.summary}
        path={`/learn/schools/${directory.id}`}
      />
      <div className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-copper-300 flex items-center gap-2">
          <Building2 size={14} />
          {directory.location ?? 'Kitchen Academy'}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-white mt-2 tracking-tight">{directory.title}</h1>
        <p className="text-lg text-copper-200/90 mt-2">{directory.tagline}</p>
        <p className="text-white/75 mt-4 leading-relaxed max-w-3xl">{directory.summary}</p>

        <section className="mt-10">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <GraduationCap size={16} className="text-copper-300" />
            Degree programs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {directory.programs.map((program) => {
              const track = getDeepById(program.track_id);
              const meta = getTrackMeta(program.track_id);
              if (!track) return null;
              return (
                <Link
                  key={program.track_id}
                  to={`/learn/${program.track_id}`}
                  className="rounded-xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 hover:border-copper-400/40 transition group"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-copper-300">
                    {program.credential} · {program.degree_type}
                  </p>
                  <p className="font-semibold text-white mt-2 group-hover:text-copper-200 transition">
                    {program.degree_label}
                  </p>
                  <p className="text-sm text-white/60 mt-1">{track.title}</p>
                  <p className="text-sm text-white/50 mt-2 line-clamp-2">{track.summary}</p>
                  <div className="flex flex-wrap gap-3 mt-4 text-[10px] text-white/40">
                    <span>{trackBadge(program.track_id, meta)}</span>
                    <span>{moduleCount(track)} practice modules</span>
                    {program.estimated_hours != null && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        ~{program.estimated_hours} hrs
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
