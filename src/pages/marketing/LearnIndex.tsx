import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { MarketingLayout, PageHeader } from '@/components/marketing/MarketingLayout';
import { PageMeta } from '@/components/marketing/PageMeta';
import { DEEP_CATALOG, DEEP_KIND_LABEL, listDeepCatalog, searchDeepCatalog } from '@/lib/deepCatalog';
import type { DeepEntryKind } from '@/types/knowledgeDeep';

const KINDS: (DeepEntryKind | 'all')[] = ['all', 'ingredient', 'technique', 'dish', 'style', 'tradition'];

export default function LearnIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState(searchParams.get('q') ?? '');
  const kind = (searchParams.get('kind') as DeepEntryKind | null) ?? 'all';
  const q = searchParams.get('q') ?? '';

  const entries = useMemo(() => {
    if (q.trim()) return searchDeepCatalog(q.trim());
    return listDeepCatalog(kind === 'all' ? undefined : kind);
  }, [kind, q]);

  return (
    <MarketingLayout
      crumbs={[{ label: 'Learn', href: '/learn' }]}
      dark
    >
      <PageMeta
        title="Kitchen Academy"
        description="Deep dives on ingredients, techniques, and dishes — origins, history, timelines, and what Clara can teach while you cook."
        path="/learn"
      />
      <div className="mx-auto max-w-5xl px-5 py-10">
        <PageHeader
          dark
          title="Kitchen Academy"
          lead={`${DEEP_CATALOG.length}+ deep dives — where ingredients came from, how long dishes have been around, and what Clara can teach you while you cook.`}
        />

        <div className="relative max-w-md mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchParams((p) => {
                  const next = new URLSearchParams(p);
                  if (draft.trim()) next.set('q', draft.trim());
                  else next.delete('q');
                  return next;
                });
              }
            }}
            placeholder="Search history, origins, techniques…"
            className="w-full rounded-full border border-white/20 bg-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
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
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                (k === 'all' && kind === 'all') || k === kind
                  ? 'bg-white text-chef'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {k === 'all' ? 'All' : DEEP_KIND_LABEL[k]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((e) => (
            <Link
              key={e.id}
              to={`/learn/${e.id}`}
              className="rounded-xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 hover:border-white/25 transition group"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-copper-300 flex items-center gap-1">
                <BookOpen size={12} />
                {DEEP_KIND_LABEL[e.kind]}
                {e.first_known && <span className="text-white/40">· {e.first_known}</span>}
              </p>
              <p className="font-semibold text-white mt-2 group-hover:text-copper-200 transition">{e.title}</p>
              <p className="text-sm text-white/60 mt-2 line-clamp-2">{e.summary}</p>
            </Link>
          ))}
        </div>

        {entries.length === 0 && (
          <p className="text-white/50 text-sm mt-8">No matches — try another search.</p>
        )}
      </div>
    </MarketingLayout>
  );
}
