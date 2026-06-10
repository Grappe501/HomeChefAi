import { Link, Navigate, useParams } from 'react-router-dom';
import { Clock, GraduationCap, MapPin } from 'lucide-react';
import { MarketingLayout, GoDeeperCTA } from '@/components/marketing/MarketingLayout';
import { PageMeta } from '@/components/marketing/PageMeta';
import { getDeepById, DEEP_KIND_LABEL } from '@/lib/deepCatalog';
import AcademyTrackPanel from '@/components/AcademyTrackPanel';
import { directoryForTrack } from '@/lib/academyManifest';

export default function LearnEntryPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const entry = entryId ? getDeepById(entryId) : undefined;

  if (!entry) return <Navigate to="/learn" replace />;

  return (
    <MarketingLayout
      dark
      crumbs={[
        { label: 'Learn', href: '/learn' },
        { label: entry.title },
      ]}
    >
      <PageMeta title={entry.title} description={entry.summary || entry.origins} path={`/learn/${entry.id}`} />
      <article className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-copper-300">
          {DEEP_KIND_LABEL[entry.kind]}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-white mt-2 tracking-tight">{entry.title}</h1>

        {entry.degree_label && (
          <p className="text-sm text-copper-300 mt-3 font-medium">{entry.degree_label}</p>
        )}
        {entry.directory_id && directoryForTrack(entry.id) && (
          <Link
            to={`/learn/schools/${entry.directory_id}`}
            className="text-xs text-white/50 hover:text-white/75 mt-1 inline-block"
          >
            {directoryForTrack(entry.id)?.title} →
          </Link>
        )}

        {entry.first_known && (
          <p className="text-sm text-white/50 mt-4 flex items-center gap-2">
            <Clock size={16} /> In kitchens for {entry.first_known}
          </p>
        )}

        {entry.summary && (
          <p className="text-lg text-white/80 mt-6 leading-relaxed">{entry.summary}</p>
        )}

        {entry.levels && entry.levels.length > 0 ? (
          <div className="mt-10">
            <AcademyTrackPanel track={entry} practiceEnabled={false} dark />
          </div>
        ) : (
          <>
        {entry.origins && (
          <section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/45 flex items-center gap-2 mb-3">
              <MapPin size={14} /> Origins
            </h2>
            <p className="text-white/85 leading-relaxed">{entry.origins}</p>
          </section>
        )}

        {entry.history && (
          <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">History</h2>
            <p className="text-white/85 leading-relaxed">{entry.history}</p>
          </section>
        )}

        {entry.timeline && entry.timeline.length > 0 && (
          <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">Timeline</h2>
            <ol className="space-y-3 border-l border-copper-500/40 pl-5">
              {entry.timeline.map((t, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-copper-300">{t.when}</span>
                  <span className="text-white/40"> — </span>
                  <span className="text-white/80">{t.event}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {entry.teaching.length > 0 && (
          <section className="mt-6 rounded-xl border border-copper-500/30 bg-copper-950/30 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-copper-300 flex items-center gap-2 mb-4">
              <GraduationCap size={14} /> What Clara teaches while you cook
            </h2>
            <ul className="space-y-3">
              {entry.teaching.map((tip, i) => (
                <li key={i} className="text-white/85 text-sm flex gap-3">
                  <span className="text-copper-400 font-bold">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        {entry.fun_fact && (
          <p className="text-sm italic text-white/45 mt-8 pt-6 border-t border-white/10">{entry.fun_fact}</p>
        )}
          </>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <GoDeeperCTA to="/learn" label="← All lessons" />
          <Link
            to="/login"
            className="text-sm font-semibold text-copper-300 hover:text-copper-200 underline"
          >
            Sign up to see this on your meal cards →
          </Link>
        </div>
      </article>
    </MarketingLayout>
  );
}
