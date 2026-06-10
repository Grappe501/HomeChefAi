import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, GraduationCap, MapPin } from 'lucide-react';
import { knowledgeApi } from '@/lib/api';
import { DEEP_KIND_LABEL } from '@/lib/deepCatalog';
import AcademyTrackPanel from '@/components/AcademyTrackPanel';
import { directoryForTrack } from '@/lib/academyManifest';
import type { DeepKnowledgeEntry } from '@/types/knowledgeDeep';

export default function LearnDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const [entry, setEntry] = useState<DeepKnowledgeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!entryId) return;
    setLoading(true);
    knowledgeApi
      .deep(entryId)
      .then((r) => setEntry(r.entry))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [entryId]);

  if (!entryId) return <Navigate to="/learn" replace />;
  if (!loading && (error || !entry)) return <Navigate to="/learn" replace />;

  if (loading || !entry) {
    return <p className="text-sm text-chef-subtle animate-pulse py-8">Loading lesson…</p>;
  }

  return (
    <div className="space-y-6 pb-10">
      <Link to="/learn" className="inline-flex items-center gap-1 text-sm text-chef-muted hover:text-chef">
        <ArrowLeft size={16} /> Kitchen Academy
      </Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-copper-600">
          {DEEP_KIND_LABEL[entry.kind]}
        </p>
        <h1 className="text-2xl font-semibold text-chef mt-1">{entry.title}</h1>
        {entry.degree_label && (
          <p className="text-sm text-copper-600 mt-2 font-medium">{entry.degree_label}</p>
        )}
        {entry.directory_id && directoryForTrack(entry.id) && (
          <Link to={`/learn/schools/${entry.directory_id}`} className="text-xs text-chef-subtle hover:text-chef mt-1 inline-block">
            {directoryForTrack(entry.id)?.title} →
          </Link>
        )}
        {entry.first_known && (
          <p className="text-sm text-chef-subtle mt-2 flex items-center gap-1">
            <Clock size={14} /> Known for {entry.first_known}
          </p>
        )}
        {entry.summary && <p className="text-chef mt-3 leading-relaxed">{entry.summary}</p>}
      </header>

      {entry.levels && entry.levels.length > 0 ? (
        <AcademyTrackPanel track={entry} practiceEnabled />
      ) : (
        <>
      {entry.origins && (
        <section className="card space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-chef-subtle flex items-center gap-1">
            <MapPin size={14} /> Origins
          </h2>
          <p className="text-sm text-chef leading-relaxed">{entry.origins}</p>
        </section>
      )}

      {entry.history && (
        <section className="card space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-chef-subtle">History</h2>
          <p className="text-sm text-chef leading-relaxed">{entry.history}</p>
        </section>
      )}

      {entry.timeline && entry.timeline.length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-chef-subtle">Timeline</h2>
          <ol className="space-y-2 border-l-2 border-copper-200 pl-4">
            {entry.timeline.map((t, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-chef-muted">{t.when}</span>
                <span className="text-chef-subtle"> — </span>
                <span className="text-chef">{t.event}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {entry.teaching.length > 0 && (
        <section className="card space-y-2 bg-copper-50/40 border-copper-200">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-copper-700 flex items-center gap-1">
            <GraduationCap size={14} /> What Clara can teach
          </h2>
          <ul className="space-y-2">
            {entry.teaching.map((tip, i) => (
              <li key={i} className="text-sm text-chef flex gap-2">
                <span className="text-copper-500 font-bold shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}

      {entry.fun_fact && (
        <p className="text-xs italic text-chef-subtle border-t border-steel pt-4">{entry.fun_fact}</p>
      )}
        </>
      )}
    </div>
  );
}
