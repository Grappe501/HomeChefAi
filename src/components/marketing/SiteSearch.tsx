import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Search, Sparkles, X } from 'lucide-react';
import { buildSiteSearchEntries, searchSiteEntries } from '@/content/siteSearchData';
import { siteSearchApi } from '@/lib/api';
import type { SiteSearchEntry } from '@/types/siteSearch';

type Mode = 'find' | 'ask';

const CATEGORY_LABEL: Record<string, string> = {
  page: 'Page',
  platform: 'Platform',
  feature: 'Feature',
  vision: 'Vision',
  learn: 'Academy',
  faq: 'FAQ',
  legal: 'Legal',
  pricing: 'Pricing',
};

interface SiteSearchProps {
  open: boolean;
  onClose: () => void;
  dark?: boolean;
}

export function SiteSearch({ open, onClose, dark = false }: SiteSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('find');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SiteSearchEntry[]>(() => buildSiteSearchEntries());
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askSources, setAskSources] = useState<SiteSearchEntry[]>([]);
  const [askLoading, setAskLoading] = useState(false);
  const [askHistory, setAskHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [suggestSignup, setSuggestSignup] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setAskAnswer(null);
    setAskSources([]);
    setAskHistory([]);
    setSuggestSignup(false);
    setMode('find');
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    siteSearchApi.index().then((r) => {
      if (r.entries?.length) setEntries(r.entries);
    }).catch(() => {
      /* local fallback already loaded */
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return entries.filter((e) => e.category === 'page' || e.category === 'faq').slice(0, 8);
    }
    return searchSiteEntries(entries, query, 12);
  }, [entries, query]);

  const goTo = useCallback(
    (href: string) => {
      onClose();
      if (href.startsWith('http') || href.endsWith('.html')) {
        window.location.href = href;
      } else {
        navigate(href);
      }
    },
    [navigate, onClose],
  );

  const submitAsk = async () => {
    const q = query.trim();
    if (!q || askLoading) return;
    setAskLoading(true);
    setAskAnswer(null);
    try {
      const res = await siteSearchApi.ask(q, askHistory);
      setAskAnswer(res.answer);
      setAskSources(res.sources ?? []);
      setSuggestSignup(!!res.suggest_signup);
      setAskHistory((h) =>
        [
          ...h,
          { role: 'user' as const, content: q },
          { role: 'assistant' as const, content: res.answer },
        ].slice(-8),
      );
      setQuery('');
    } catch {
      setAskAnswer('Something went wrong. Try browsing /explore or /pricing, or sign in for Clara in the app.');
    } finally {
      setAskLoading(false);
    }
  };

  if (!open) return null;

  const panel = dark ? 'bg-chef border-white/15 text-white' : 'bg-white border-steel/80 text-chef';
  const muted = dark ? 'text-white/55' : 'text-chef-subtle';
  const inputCls = dark
    ? 'bg-white/5 border-white/15 text-white placeholder:text-white/35'
    : 'bg-stainless-50 border-steel/80 text-chef placeholder:text-chef-subtle/70';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search SousChef site"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close search"
        onClick={onClose}
      />
      <div className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${panel}`}>
        <div className={`flex items-center gap-2 border-b px-3 py-2 ${dark ? 'border-white/10' : 'border-steel/60'}`}>
          <div className="flex rounded-lg p-0.5 bg-black/5 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setMode('find')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'find'
                  ? dark
                    ? 'bg-white/15 text-white'
                    : 'bg-white text-chef shadow-sm'
                  : muted
              }`}
            >
              <Search size={14} /> Find
            </button>
            <button
              type="button"
              onClick={() => setMode('ask')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'ask'
                  ? dark
                    ? 'bg-white/15 text-white'
                    : 'bg-white text-chef shadow-sm'
                  : muted
              }`}
            >
              <Sparkles size={14} /> Ask
            </button>
          </div>
          <div className="flex-1" />
          <button type="button" onClick={onClose} className={`p-2 rounded-lg ${muted}`} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-3 py-3">
          <div className="relative">
            {mode === 'find' ? (
              <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
            ) : (
              <MessageCircle size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
            )}
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mode === 'ask') {
                  e.preventDefault();
                  submitAsk();
                }
              }}
              placeholder={
                mode === 'find'
                  ? 'Search pages, features, pricing, Kitchen Academy…'
                  : 'Ask about SousChef — pricing, features, how it works…'
              }
              className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-copper-500/40 ${inputCls}`}
              autoComplete="off"
            />
          </div>
          {mode === 'ask' && (
            <p className={`mt-2 text-[11px] ${muted}`}>
              Answers use site content only. For your pantry and meal plans,{' '}
              <Link to="/login" className="underline" onClick={onClose}>
                sign in to the app
              </Link>
              .
            </p>
          )}
        </div>

        <div className={`max-h-[min(50vh,420px)] overflow-y-auto border-t ${dark ? 'border-white/10' : 'border-steel/60'}`}>
          {mode === 'find' && (
            <ul className="py-1">
              {results.length === 0 && query.trim() && (
                <li className={`px-4 py-6 text-sm text-center ${muted}`}>
                  No matches — try Ask mode or browse{' '}
                  <button type="button" className="underline" onClick={() => goTo('/explore')}>
                    Platform
                  </button>
                </li>
              )}
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => goTo(r.href)}
                    className={`w-full text-left px-4 py-3 transition ${
                      dark ? 'hover:bg-white/5' : 'hover:bg-stainless-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{r.title}</span>
                      <span className={`text-[10px] uppercase tracking-wider ${muted}`}>
                        {CATEGORY_LABEL[r.category] ?? r.category}
                      </span>
                      {r.status && r.status !== 'live' && (
                        <span className="text-[10px] text-amber-600 uppercase">{r.status}</span>
                      )}
                    </div>
                    <p className={`mt-0.5 text-xs line-clamp-2 ${muted}`}>{r.summary}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mode === 'ask' && (
            <div className="px-4 py-3 space-y-4">
              {askHistory.length === 0 && !askAnswer && !askLoading && (
                <div className={`text-sm ${muted}`}>
                  <p className="font-medium text-inherit mb-2">Try asking:</p>
                  <ul className="space-y-1.5 text-xs">
                    {[
                      'What is included in the free plan?',
                      'How does receipt scanning work?',
                      'What is Kitchen Academy?',
                      'What is the difference between Brain and Clara?',
                    ].map((s) => (
                      <li key={s}>
                        <button type="button" className="underline text-left" onClick={() => setQuery(s)}>
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {askHistory.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-xl px-3 py-2 ${
                    m.role === 'user'
                      ? dark
                        ? 'bg-white/10 ml-6'
                        : 'bg-stainless-100 ml-6'
                      : dark
                        ? 'bg-white/5 mr-6'
                        : 'bg-stainless-50 mr-6'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}

              {askLoading && (
                <p className={`text-sm animate-pulse ${muted}`}>Thinking…</p>
              )}

              {askSources.length > 0 && askAnswer && (
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${muted}`}>Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {askSources.slice(0, 5).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => goTo(s.href)}
                        className={`text-xs rounded-full px-3 py-1 border ${
                          dark ? 'border-white/20 hover:bg-white/10' : 'border-steel hover:bg-stainless-50'
                        }`}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestSignup && (
                <button
                  type="button"
                  onClick={() => goTo('/login')}
                  className="w-full rounded-xl bg-copper-600 text-white text-sm font-semibold py-2.5 hover:bg-copper-700"
                >
                  Sign in for Clara & your kitchen →
                </button>
              )}

              {mode === 'ask' && query.trim() && (
                <button
                  type="button"
                  disabled={askLoading}
                  onClick={submitAsk}
                  className="w-full rounded-xl bg-chef text-white text-sm font-semibold py-2.5 hover:bg-chef-muted disabled:opacity-50"
                >
                  {askLoading ? 'Asking…' : 'Ask'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={`px-4 py-2 text-[10px] flex justify-between ${muted} border-t ${dark ? 'border-white/10' : 'border-steel/60'}`}>
          <span>
            <kbd className="font-mono">Esc</kbd> close
          </span>
          <span>
            <kbd className="font-mono">Ctrl</kbd>+<kbd className="font-mono">K</kbd> open
          </span>
        </div>
      </div>
    </div>
  );
}

/** Hook: global Cmd/Ctrl+K to open site search */
export function useSiteSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpen]);
}
