import { Link, Navigate, useParams } from 'react-router-dom';
import { MarketingLayout, PageHeader, DrillCard, GoDeeperCTA, StatusBadge } from '@/components/marketing/MarketingLayout';
import { PageMeta } from '@/components/marketing/PageMeta';
import { VISION_TOPICS, getVisionTopic, ROADMAP_PHASES } from '@/content/siteContent';

export function VisionIndex() {
  return (
    <MarketingLayout crumbs={[{ label: 'Vision' }]}>
      <PageMeta
        title="Vision & Roadmap"
        description="SousChef future vision — smart kitchen, social cookbook, knowledge graph expansion, and honest phase timeline."
        path="/vision"
      />
      <PageHeader
        eyebrow="Go deeper"
        title="The rabbit hole."
        lead="Future vision, paused engines, and the honest roadmap. Nothing here is marketed as live unless the platform pages say so."
      />

      <div className="mx-auto max-w-5xl px-5 pb-10">
        <blockquote className="text-sm text-chef-subtle italic border-l-2 border-violet-500 pl-4">
          For committed readers, investors, and early believers who want the whole map.
        </blockquote>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-4">Phase timeline</h2>
        <div className="space-y-4">
          {ROADMAP_PHASES.map((p) => (
            <div key={p.phase} className="rounded-xl border border-steel/80 bg-white p-5">
              <div className="flex items-center gap-3">
                <StatusBadge status={p.status} />
                <h3 className="font-semibold">{p.phase}</h3>
              </div>
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {p.items.map((item) => (
                  <li key={item} className="text-sm text-chef-subtle flex gap-2">
                    <span className="text-violet-500">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-4">Topics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {VISION_TOPICS.map((topic) => {
            const Icon = topic.icon;
            return (
              <Link key={topic.id} to={`/vision/${topic.id}`} className="block group">
                <article className="rounded-2xl border border-steel/80 bg-white p-6 h-full hover:border-violet-500/30 hover:shadow-elevated transition">
                  <div className="flex items-center gap-2 text-violet-700">
                    <Icon size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Deep dive</span>
                  </div>
                  <h2 className="font-display text-xl mt-3 tracking-tight">{topic.title}</h2>
                  <p className="text-sm text-chef-subtle mt-2 line-clamp-2">{topic.summary}</p>
                </article>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16">
        <GoDeeperCTA to="/explore" label="← Back to live platform" />
      </div>
    </MarketingLayout>
  );
}

export function VisionTopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const topic = topicId ? getVisionTopic(topicId) : undefined;

  if (!topic) return <Navigate to="/vision" replace />;

  const Icon = topic.icon;

  return (
    <MarketingLayout crumbs={[{ label: 'Vision', href: '/vision' }, { label: topic.title }]}>
      <PageMeta title={topic.title} description={topic.summary} path={`/vision/${topic.id}`} />
      <PageHeader title={topic.title} lead={topic.summary} />

      <div className="mx-auto max-w-5xl px-5 flex flex-wrap items-center gap-3 -mt-4 mb-8 text-sm text-chef-subtle">
        <Icon size={18} className="text-violet-600" />
        <span>{topic.tagline}</span>
        <span className="text-xs rounded-full bg-violet-100 text-violet-800 px-2 py-0.5">{topic.audience}</span>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16 space-y-10">
        {topic.sections.map((section, i) => (
          <section key={i} className="rounded-xl border border-steel/60 bg-white p-6">
            <h2 className="font-display text-xl tracking-tight">{section.heading}</h2>
            {section.body && <p className="text-sm text-chef-subtle mt-2 leading-relaxed">{section.body}</p>}
            {section.bullets && (
              <ul className="mt-4 space-y-2">
                {section.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-sm text-chef">
                    <span className="text-violet-500 shrink-0">→</span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {topic.relatedExplore && (
          <DrillCard
            to={`/explore/${topic.relatedExplore}`}
            title="See what's live today"
            subtitle={`Related platform layer`}
            badge="Live"
          />
        )}

        <div className="flex flex-wrap gap-6 pt-4 border-t border-steel">
          <GoDeeperCTA to="/vision" label="← All vision topics" />
          <GoDeeperCTA to="/vision/roadmap" label="Full roadmap" />
        </div>
      </div>
    </MarketingLayout>
  );
}
