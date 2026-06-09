import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { knowledgeApi } from '@/lib/api';
import { DEEP_KIND_LABEL } from '@/lib/deepCatalog';
import type { DeepEntryKind, DeepKnowledgeEntry } from '@/types/knowledgeDeep';
import SousChefMark from '@/components/SousChefMark';
import AcademyFeaturedHub from '@/components/AcademyFeaturedHub';
import { useApp } from '@/hooks/useApp';
import { assistantFirstName } from '@/lib/assistant';
import { FEATURED_ACADEMY_TRACK_IDS } from '@/lib/academyTracks';

const KINDS: (DeepEntryKind | 'all')[] = [
  'all',
  'ingredient',
  'technique',
  'flavor_profile',
  'culture',
  'food_source',
  'path',
  'dish',
  'style',
  'tradition',
];

export default function LearnPage() {
  const { profile } = useApp();
  const assistantName = assistantFirstName(profile?.assistant_name);
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState<DeepKnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const kind = (searchParams.get('kind') as DeepEntryKind | null) ?? 'all';
  const q = searchParams.get('q') ?? '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = q.trim()
      ? knowledgeApi.deepSearch(q.trim())
      : knowledgeApi.deepCatalog(kind === 'all' ? undefined : kind);

    load
      .then((r) => {
        if (cancelled) return;
        setEntries('results' in r ? r.results : r.entries);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load Kitchen Academy — try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, q]);

  const grouped = useMemo(() => {
    const featured = new Set<string>(FEATURED_ACADEMY_TRACK_IDS);
    const filtered = entries.filter((e) => !featured.has(e.id));
    const map = new Map<DeepEntryKind, DeepKnowledgeEntry[]>();
    for (const e of filtered) {
      const list = map.get(e.kind) ?? [];
      list.push(e);
      map.set(e.kind, list);
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-5 pb-8">
      <header>
        <SousChefMark name={assistantName} />
        <h1 className="text-xl font-semibold text-chef mt-2 flex items-center gap-2">
          <BookOpen size={22} className="text-copper-500" />
          Kitchen Academy
        </h1>
        <p className="text-sm text-chef-subtle mt-1">
          History, origins, and what {assistantName} can teach — grounded in our culinary knowledge graph.
        </p>
      </header>

      {!q && <AcademyFeaturedHub />}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-chef-subtle" />
        <input
          type="search"
          placeholder="Search ingredients, dishes, techniques…"
          defaultValue={q}
          className="input pl-9 w-full"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value;
              setSearchParams((p) => {
                const next = new URLSearchParams(p);
                if (val) next.set('q', val);
                else next.delete('q');
                return next;
              });
            }
          }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() =>
              setSearchParams((p) => {
                const next = new URLSearchParams(p);
                if (k === 'all') next.delete('kind');
                else next.set('kind', k);
                return next;
              })
            }
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              (k === 'all' && kind === 'all') || k === kind
                ? 'bg-chef text-white'
                : 'bg-stainless-200 text-chef-muted'
            }`}
          >
            {k === 'all' ? 'All' : DEEP_KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-chef-subtle animate-pulse">Loading lessons…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="text-sm text-chef-subtle">No matches — try another search or browse all.</p>
      )}

      {!loading &&
        !error &&
        (kind === 'all' && !q
          ? [...grouped.entries()].map(([k, list]) => (
              <section key={k}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-chef-subtle mb-2">
                  {DEEP_KIND_LABEL[k]}
                </h2>
                <div className="grid gap-2">
                  {list.map((e) => (
                    <LearnCard key={e.id} entry={e} />
                  ))}
                </div>
              </section>
            ))
          : (
              <div className="grid gap-2">
                {entries.map((e) => (
                  <LearnCard key={e.id} entry={e} />
                ))}
              </div>
            ))}
    </div>
  );
}

function LearnCard({ entry }: { entry: DeepKnowledgeEntry }) {
  return (
    <Link
      to={`/learn/${entry.id}`}
      className="block rounded-xl border border-steel bg-white p-4 hover:border-copper-400/50 transition"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-copper-600">
        {DEEP_KIND_LABEL[entry.kind]}
        {entry.first_known && <span className="text-chef-subtle ml-2">· {entry.first_known}</span>}
      </p>
      <p className="font-semibold text-chef mt-1">{entry.title}</p>
      <p className="text-sm text-chef-subtle mt-1 line-clamp-2">{entry.summary || entry.origins}</p>
    </Link>
  );
}
