import { Link } from 'react-router-dom';
import { MarketingLayout, PageHeader, DrillCard } from '@/components/marketing/MarketingLayout';
import { StackDiagram } from '@/components/marketing/MarketingBlocks';
import { PageMeta } from '@/components/marketing/PageMeta';
import { HOW_IT_WORKS, PLATFORM_LAYERS } from '@/content/siteContent';

export default function HowItWorks() {
  return (
    <MarketingLayout crumbs={[{ label: 'How it works' }]}>
      <PageMeta
        title="How it works"
        description="Capture, remember, act — three moves that power SousChef's Household Food Operating System."
        path="/how"
      />
      <div className="marketing-hero-light border-b border-steel/60">
        <PageHeader
          eyebrow="Our approach · Brain 5.1"
          title="Capture. Remember. Act."
          lead="Photo the pantry. Let Brain predict. Clara runs tools — then speaks."
        />
      </div>

      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-6 md:grid-cols-3 relative">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.step} className="marketing-pillar marketing-pillar-light marketing-animate-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-chef text-white text-xs font-bold">{s.step}</span>
              <h3 className="font-display text-xl mt-4">{s.title}</h3>
              <p className="text-sm text-chef-subtle mt-2 leading-relaxed">{s.body}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <span className="hidden md:block absolute -right-3 top-1/2 text-chef-subtle text-lg">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-12 grid gap-10 lg:grid-cols-2 items-center">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Then the five layers</h2>
          <p className="text-sm text-chef-subtle mt-2 leading-relaxed">
            Each layer builds on the last. Inventory feeds Memory. Memory feeds Intelligence. Growth and Legacy compound over years.
          </p>
          <Link to="/explore" className="inline-block mt-4 text-sm font-semibold text-copper-600 hover:underline">
            Explore full platform →
          </Link>
        </div>
        <StackDiagram linkToLayers />
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-12">
        <div className="rounded-2xl border border-sage-200 bg-sage-50 p-6 md:p-8">
          <h3 className="font-display text-xl">We learn to serve you — not to sell you.</h3>
          <p className="text-sm text-chef-subtle mt-2 max-w-2xl leading-relaxed">
            No selling household food data, shopping habits, or family traditions.
          </p>
          <Link to="/story" className="inline-block mt-4 text-sm font-semibold text-sage-700 hover:underline">
            Read our story →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-4">Drill into each layer</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_LAYERS.map((l) => (
            <DrillCard key={l.id} to={`/explore/${l.id}`} title={l.title} subtitle={l.tagline} badge={l.level} />
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
