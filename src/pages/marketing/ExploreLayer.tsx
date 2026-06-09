import { Link, Navigate, useParams } from 'react-router-dom';
import {
  MarketingLayout,
  DrillCard,
  GoDeeperCTA,
  StatusBadge,
} from '@/components/marketing/MarketingLayout';
import { ProductMock, LayerNav, FEATURE_MOCKS } from '@/components/marketing/MarketingBlocks';
import { getLayer, LAYER_HERO_CLASS } from '@/content/siteContent';

const LAYER_MOCK: Record<string, 'pantry' | 'brain' | 'planner' | 'skills' | 'hosting'> = {
  inventory: 'pantry',
  memory: 'brain',
  intelligence: 'planner',
  growth: 'skills',
  legacy: 'hosting',
};

export default function ExploreLayer() {
  const { layerId } = useParams<{ layerId: string }>();
  const layer = layerId ? getLayer(layerId) : undefined;

  if (!layer) return <Navigate to="/explore" replace />;

  const Icon = layer.icon;
  const heroClass = LAYER_HERO_CLASS[layer.id] ?? '';
  const mock = LAYER_MOCK[layer.id] ?? 'planner';
  const liveCount = layer.features.filter((f) => f.status === 'live').length;

  return (
    <MarketingLayout crumbs={[{ label: 'Platform', href: '/explore' }, { label: layer.title }]}>
      <div className={`${heroClass} border-b border-steel/40`}>
        <div className="mx-auto max-w-5xl px-5 py-10 md:py-14 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Layer {layer.level}</p>
            <h1 className="font-display mt-2 text-[clamp(2rem,4vw,2.75rem)] tracking-tight">{layer.title}</h1>
            <p className="mt-2 opacity-80">{layer.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed opacity-70 max-w-lg">{layer.intro}</p>
            <div className="mt-4 flex items-center gap-3">
              <Icon size={18} className="opacity-50" />
              <StatusBadge status={layer.status} />
              <span className="text-xs opacity-60">{liveCount} live features</span>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <ProductMock variant={mock} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-4">Features</p>
        <div className="grid gap-3">
          {layer.features.map((f) => (
            <Link
              key={f.id}
              to={`/explore/${layer.id}/${f.id}`}
              className="flex items-start justify-between gap-4 rounded-xl border border-steel/80 bg-white p-5 hover:border-copper-500/40 transition group"
            >
              <div className="flex gap-4 min-w-0">
                {FEATURE_MOCKS[f.id] && (
                  <div className="hidden sm:block shrink-0 scale-75 origin-top-left opacity-80">
                    <ProductMock variant={FEATURE_MOCKS[f.id]} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={f.status} />
                    {f.children && f.children.length > 0 && (
                      <span className="text-[10px] text-chef-subtle">+{f.children.length} sub-topics</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-chef mt-2">{f.title}</h3>
                  <p className="text-sm text-chef-subtle mt-1 leading-relaxed">{f.summary}</p>
                </div>
              </div>
              <span className="text-chef-subtle group-hover:text-chef shrink-0 pt-2">→</span>
            </Link>
          ))}
        </div>
      </div>

      {layer.goDeeper && layer.goDeeper.length > 0 && (
        <div className="mx-auto max-w-5xl px-5 pb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-chef-subtle">Go deeper</p>
          {layer.goDeeper.map((d) => (
            <DrillCard key={d.href} to={d.href} title={d.label} subtitle="Vision & roadmap" badge="Roadmap" />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-5xl px-5 pb-16 space-y-6">
        <LayerNav currentId={layer.id} />
        <GoDeeperCTA to="/explore" label="← All platform layers" />
      </div>
    </MarketingLayout>
  );
}
