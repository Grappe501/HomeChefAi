import { MarketingLayout, PageHeader, DrillCard, GoDeeperCTA } from '@/components/marketing/MarketingLayout';
import { PageMeta } from '@/components/marketing/PageMeta';
import { SITE_STATS, SITE_VERSION } from '@/content/marketingContent';

export default function StoryPage() {
  return (
    <MarketingLayout crumbs={[{ label: 'Story' }]}>
      <PageMeta
        title="Our Story"
        description="Why SousChef exists — a Household Food Operating System that builds kitchen memory, not another recipe feed."
        path="/story"
      />
      <PageHeader
        eyebrow="Why we exist"
        title="Your Kitchen Has A Memory."
        lead="SousChef is a Household Food Operating System — not a meal planner, not a recipe app, not a chatbot with a pantry list."
      />

      <div className="mx-auto max-w-3xl px-5 pb-12 space-y-8 text-sm leading-relaxed text-chef">
        <section>
          <h2 className="font-display text-xl text-chef mb-3">The problem</h2>
          <p className="text-chef-subtle">
            Families lose $1,500+ a year to food waste. Traditions scatter across notes and screenshots. Dinner stress repeats nightly.
            Hundreds of apps offer recipes or lists — none build a memory of <em>your</em> kitchen that compounds over years.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-chef mb-3">Our belief</h2>
          <p className="text-chef-subtle">
            The moat is not inventory alone. Not recipes alone. <strong className="text-chef">The moat is memory that compounds.</strong>{' '}
            Every receipt, cook log, and meal decision writes to a Household Food Graph that becomes too valuable to abandon.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-chef mb-3">Brain {SITE_VERSION} — Everything connected</h2>
          <p className="text-chef-subtle">
            Brain {SITE_VERSION} is the AI Impact Suite: a {SITE_STATS.recipeCount} recipe library across {SITE_STATS.cuisines} cuisines,
            Training Kitchen ({SITE_STATS.techniques} techniques, {SITE_STATS.flavorProfiles} taste profiles, {SITE_STATS.foodSources} food sources),
            nine Clara tools that run before GPT, household memories and ledger learning injected into every planner call,
            proactive cards with inline recipe directions, and multi-course meal planning with per-slot drill-down — all grounded in evidence you can read.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-chef mb-3">Clara thinks in tools</h2>
          <p className="text-chef-subtle">
            Every Clara message runs deterministic tools first: pantry lookup, dish library match, knowledge and skill coach,
            local food sourcing, brain memories, ledger context, substitutions. Recipe lookups and Kitchen Academy browse use zero credits.
            Complex asks invoke an expert council merged into one voice with evidence chips.
          </p>
        </section>

        <section className="rounded-2xl border border-sage-200 bg-sage-50 p-6">
          <h2 className="font-display text-xl mb-3">Privacy promise</h2>
          <p className="text-chef-subtle">
            SousChef learns your kitchen — not to sell you, but to serve you. We do not sell household food data, shopping habits, or family traditions.
          </p>
          <a href="/legal/privacy.html" className="inline-block mt-3 text-sm font-semibold text-sage-700 hover:underline">
            Privacy policy →
          </a>
        </section>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16 grid gap-4 sm:grid-cols-3">
        <DrillCard to="/explore" title="Platform" subtitle="Every live feature mapped" badge="What" />
        <DrillCard to="/how" title="How it works" subtitle="Capture → Remember → Act" badge="How" />
        <DrillCard to="/vision" title="Vision" subtitle="Roadmap for deep readers" badge="Deep" />
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16">
        <GoDeeperCTA to="/landing" label="← Back home" />
      </div>
    </MarketingLayout>
  );
}
