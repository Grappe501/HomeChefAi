import { Link } from 'react-router-dom';

export type MockVariant =
  | 'pantry'
  | 'receipt'
  | 'brain'
  | 'planner'
  | 'why-panel'
  | 'cook'
  | 'assistant'
  | 'hosting'
  | 'skills'
  | 'household';

interface ProductMockProps {
  variant: MockVariant;
  className?: string;
}

export function ProductMock({ variant, className = '' }: ProductMockProps) {
  return (
    <div className={`mock-phone max-w-[280px] ${className}`}>
      <div className="mock-statusbar">
        <span />
      </div>
      <div className="p-4 min-h-[200px] text-left">{renderMock(variant)}</div>
    </div>
  );
}

function renderMock(variant: MockVariant) {
  switch (variant) {
    case 'receipt':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Receipt Scan</p>
          <div className="rounded-lg bg-stainless-100 p-3 border border-dashed border-steel">
            <p className="text-chef-subtle">Walmart · 12 items</p>
            <p className="text-chef mt-1">Milk, eggs, chicken, basil…</p>
          </div>
          <p className="text-emerald-700 font-medium">✓ 12 added to pantry</p>
        </div>
      );
    case 'pantry':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Pantry</p>
          {['Black beans · 2 cans', 'Quinoa · 1 bag', 'BBQ sauce · 1 bottle'].map((i) => (
            <div key={i} className="flex justify-between rounded-lg bg-stainless-50 px-2 py-1.5 border border-steel/60">
              <span>{i}</span>
              <span className="text-chef-subtle">− +</span>
            </div>
          ))}
        </div>
      );
    case 'brain':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Kitchen Memory</p>
          <div className="rounded-lg border-l-2 border-l-copper-500 bg-stainless-50 p-2">
            <p className="font-medium">Italian 3× more than you think</p>
            <p className="text-chef-subtle mt-0.5">Evidence: 14 cook logs</p>
          </div>
          <div className="rounded-lg border-l-2 border-l-sage-500 bg-stainless-50 p-2">
            <p className="font-medium">Waste down 18% this month</p>
          </div>
        </div>
      );
    case 'planner':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Meal Plan · Day 1</p>
          <div className="rounded-lg border border-steel p-2">
            <p className="font-medium">BBQ Black Bean Quinoa Bowl</p>
            <p className="text-chef-subtle">5/5 in pantry</p>
            <div className="flex gap-1 mt-2">
              {['Keep', 'Replace', 'Why?'].map((b) => (
                <span key={b} className="rounded px-1.5 py-0.5 bg-stainless-200 text-[10px]">{b}</span>
              ))}
            </div>
          </div>
        </div>
      );
    case 'why-panel':
      return (
        <div className="space-y-1.5 text-[10px]">
          <p className="font-semibold text-chef text-xs">Why this?</p>
          <p className="text-chef-subtle">All 5 ingredients in pantry now.</p>
          <p className="text-chef-subtle italic border-t border-steel pt-1">
            Quinoa isn&apos;t a grain — it&apos;s a seed.
          </p>
        </div>
      );
    case 'cook':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Cook Log</p>
          <p className="rounded-lg bg-stainless-100 p-2">I made grilled cheese</p>
          <p className="text-chef-subtle">−2 bread · −2 cheese · −1 butter</p>
        </div>
      );
    case 'assistant':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Clara</p>
          <p className="rounded-lg bg-stainless-100 p-2 text-chef-subtle">Three directions from your pantry:</p>
          <p className="rounded-lg border border-copper-200 p-2">1. Cajun · 2. Italian · 3. Comfort</p>
        </div>
      );
    case 'hosting':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Dinner Party</p>
          <p className="text-chef-subtle">6 guests · 6:00 PM</p>
          <p className="rounded bg-stainless-50 px-2 py-1">−48h Shop perishables</p>
          <p className="rounded bg-stainless-50 px-2 py-1">−1h Start cooking sequence</p>
        </div>
      );
    case 'skills':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Skill Coach</p>
          <p className="rounded-lg bg-copper-50 p-2 border border-copper-100">
            Roux tip: notice the color shift at peanut-butter stage.
          </p>
        </div>
      );
    case 'household':
      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-chef">Cook Together</p>
          <p className="text-chef-subtle">The Grappe Kitchen · 4 members</p>
          <p className="rounded-lg bg-stainless-50 p-2">Shared pantry · shared Brain</p>
        </div>
      );
    default:
      return null;
  }
}

/** Map feature ids to mock variants */
export const FEATURE_MOCKS: Record<string, MockVariant> = {
  'receipt-scan': 'receipt',
  'pantry-wizard': 'pantry',
  'inventory-mgmt': 'pantry',
  'knowledge-graph': 'pantry',
  'brain-insights': 'brain',
  'decision-ledger': 'planner',
  'household-graph': 'household',
  'meal-planner': 'planner',
  'why-this': 'why-panel',
  'three-directions': 'assistant',
  clara: 'assistant',
  'cook-coach': 'skills',
  hosting: 'hosting',
  'cook-together': 'household',
};

import { SITE_STATS } from '@/content/marketingContent';

export function SiteStatsStrip({ dark }: { dark?: boolean }) {
  const stats = [
    { n: SITE_STATS.knowledgeNodes, l: 'Knowledge nodes' },
    { n: SITE_STATS.platformLayers, l: 'Platform layers' },
    { n: SITE_STATS.liveFunctions, l: 'Live functions' },
    { n: SITE_STATS.visionTopics, l: 'Vision topics' },
  ];
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${dark ? 'text-white' : ''}`}>
      {stats.map((s) => (
        <div key={s.l} className={`text-center ${dark ? '' : 'rounded-xl border border-steel/60 bg-white py-4'}`}>
          <p className={`font-display text-2xl ${dark ? 'text-white' : 'text-chef'}`}>{s.n}</p>
          <p className={`text-xs mt-0.5 ${dark ? 'text-white/45' : 'text-chef-subtle'}`}>{s.l}</p>
        </div>
      ))}
    </div>
  );
}

export function StackDiagram({ linkToLayers = true }: { linkToLayers?: boolean }) {
  const layers = [
    { id: 'inventory', label: 'Inventory', sub: 'Know what you have' },
    { id: 'memory', label: 'Kitchen Memory', sub: 'Your kitchen remembers' },
    { id: 'intelligence', label: 'Intelligence', sub: 'Cook with confidence' },
    { id: 'growth', label: 'Growth', sub: 'Get better every cook' },
    { id: 'legacy', label: 'Legacy', sub: 'Preserve what matters' },
  ];

  const inner = (l: (typeof layers)[0], i: number) => (
    <div className="marketing-animate-in" style={{ animationDelay: `${i * 0.06}s` }}>
      <div className="rounded-xl border border-steel/80 bg-white px-4 py-3 text-left shadow-card hover:border-copper-500/40 transition">
        <p className="text-[10px] font-bold text-copper-600">0{i + 1}</p>
        <p className="font-semibold text-sm">{l.label}</p>
        <p className="text-xs text-chef-subtle">{l.sub}</p>
      </div>
      {i < layers.length - 1 && <div className="stack-connector" />}
    </div>
  );

  return (
    <div className="flex flex-col items-stretch max-w-xs mx-auto">
      {layers.map((l, i) =>
        linkToLayers ? (
          <Link key={l.id} to={`/explore/${l.id}`}>
            {inner(l, i)}
          </Link>
        ) : (
          <div key={l.id}>{inner(l, i)}</div>
        ),
      )}
    </div>
  );
}

export function LayerNav({ currentId }: { currentId: string }) {
  const ids = ['inventory', 'memory', 'intelligence', 'growth', 'legacy'];
  const idx = ids.indexOf(currentId);
  const prev = idx > 0 ? ids[idx - 1] : null;
  const next = idx < ids.length - 1 ? ids[idx + 1] : null;
  const titles: Record<string, string> = {
    inventory: 'Inventory',
    memory: 'Kitchen Memory',
    intelligence: 'Intelligence',
    growth: 'Growth',
    legacy: 'Legacy',
  };

  return (
    <div className="flex justify-between gap-4 text-sm">
      {prev ? (
        <Link to={`/explore/${prev}`} className="text-chef-muted hover:text-chef font-medium">
          ← {titles[prev]}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link to={`/explore/${next}`} className="text-chef-muted hover:text-chef font-medium">
          {titles[next]} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
