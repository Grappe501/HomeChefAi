import { Link } from 'react-router-dom';
import {
  MarketingLayout,
  PageHeader,
  GoDeeperCTA,
  StatusBadge,
} from '@/components/marketing/MarketingLayout';
import { StackDiagram, SiteStatsStrip } from '@/components/marketing/MarketingBlocks';
import { PageMeta } from '@/components/marketing/PageMeta';
import { PLATFORM_LAYERS } from '@/content/siteContent';
import { SITE_STATS } from '@/content/marketingContent';

export default function ExploreIndex() {
  return (
    <MarketingLayout crumbs={[{ label: 'Platform' }]}>
      <PageMeta
        title="Platform"
        description="Five layers of SousChef — inventory, memory, intelligence, growth, and legacy. Every live feature mapped with honest status badges."
        path="/explore"
      />
      <PageHeader
        eyebrow={`The platform · SousChef v${SITE_STATS.productVersion}`}
        title="Five layers. One kitchen that gets smarter."
        lead="22 live functions mapped with honest status badges — including proactive Brain, pantry vision, and Hosting Studio."
      />

      <div className="mx-auto max-w-5xl px-5 pb-10">
        <SiteStatsStrip />
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-12 grid gap-10 lg:grid-cols-2 items-start">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {PLATFORM_LAYERS.map((layer) => {
            const Icon = layer.icon;
            return (
              <Link key={layer.id} to={`/explore/${layer.id}`} className="block group">
                <article className="marketing-pillar marketing-pillar-light group-hover:shadow-elevated">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-copper-600">{layer.level}</span>
                      <Icon size={16} className="text-chef-subtle" />
                    </div>
                    <StatusBadge status={layer.status} />
                  </div>
                  <h2 className="font-display text-xl mt-2 tracking-tight">{layer.title}</h2>
                  <p className="text-sm text-copper-600/90">{layer.tagline}</p>
                  <p className="text-xs text-chef-subtle mt-2">{layer.features.length} features →</p>
                </article>
              </Link>
            );
          })}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-4 text-center">The stack</p>
          <StackDiagram />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16">
        <GoDeeperCTA to="/vision" label="Future vision — for committed readers" />
      </div>
    </MarketingLayout>
  );
}
