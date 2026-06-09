import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, Brain, Camera, PartyPopper, Wrench } from 'lucide-react';
import { MarketingLayout, DrillCard } from '@/components/marketing/MarketingLayout';
import { ProductMock, SiteStatsStrip, Brain4Strip } from '@/components/marketing/MarketingBlocks';
import { PageMeta } from '@/components/marketing/PageMeta';
import { MarketingFAQ } from '@/components/marketing/MarketingFAQ';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { StickyMobileCTA } from '@/components/marketing/StickyMobileCTA';
import { DEEP_CATALOG } from '@/lib/deepCatalog';
import { BRAIN_4_PILLARS, MARKETING_FAQ, TESTIMONIALS, SITE_VERSION } from '@/content/marketingContent';
import { useApp } from '@/hooks/useApp';

const VALUE_PROPS = [
  'Tool router — graph lookups before GPT',
  'Proactive cards — expiring food, likely meals, zero credits',
  'Pantry photo + receipt scan → verified inventory',
  'Hosting Studio — menu, timeline, shopping list',
];

const PILLAR_ICONS = {
  'tool-router': Wrench,
  proactive: Brain,
  'pantry-vision': Camera,
  'hosting-studio': PartyPopper,
} as const;

export default function Landing() {
  const { user } = useApp();
  const navigate = useNavigate();
  const cta = () => (user ? navigate('/') : navigate('/login'));

  return (
    <MarketingLayout dark>
      <PageMeta
        title="SousChef — Your Kitchen Has A Memory"
        description="Household Food Operating System — Brain 4.0 Clara, proactive intelligence, pantry vision, meal planning, and a 270+ node knowledge graph. Start free."
        path="/landing"
        faq={MARKETING_FAQ.map((f) => ({ question: f.question, answer: f.answer }))}
      />
      <StickyMobileCTA dark />

      {/* Hero */}
      <section className="marketing-hero-mesh relative mx-auto max-w-5xl px-5 pt-10 pb-14 md:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 relative z-[1]">
          <div className="marketing-animate-in">
            <p className="marketing-eyebrow text-copper-400/90">
              Brain {SITE_VERSION} · Household Food OS
            </p>
            <h1 className="font-display mt-4 text-[clamp(2.35rem,6.5vw,4rem)] leading-[1.04] tracking-tight text-white">
              Clara thinks in tools,<br className="hidden sm:block" /> not guesses.
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/70 leading-relaxed max-w-lg">
              SousChef learns how you shop, cook, and repeat — then surfaces what to do next before you ask.
              Evidence you can read. Pantry that always works.
            </p>
            <ul className="mt-6 space-y-2.5">
              {VALUE_PROPS.map((v) => (
                <li key={v} className="flex items-start gap-2.5 text-sm text-white/75">
                  <CheckCircle2 size={17} className="text-copper-400 shrink-0 mt-0.5" aria-hidden />
                  {v}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cta}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-chef hover:bg-stainless-100 min-h-[52px] shadow-glow transition"
              >
                {user ? 'Open your kitchen' : 'Start free'}
                <ArrowRight size={16} />
              </button>
              <Link
                to="/explore/intelligence/clara-tool-router"
                className="inline-flex items-center rounded-full border border-white/25 px-6 py-3.5 text-sm font-medium text-white/90 hover:bg-white/8 min-h-[52px] transition"
              >
                See Brain 4.0
              </Link>
            </div>
            <p className="mt-8 text-sm text-white/40">
              <Link to="/story" className="underline hover:text-white/65">Our story</Link>
              {' · '}
              <Link to="/how" className="underline hover:text-white/65">How it works</Link>
              {' · '}
              <Link to="/pricing" className="underline hover:text-white/65">Pricing</Link>
            </p>
          </div>

          <div className="flex justify-center lg:justify-end marketing-animate-in marketing-animate-in-delay-2">
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-copper-500/15 blur-3xl" aria-hidden />
              <ProductMock variant="proactive" className="relative mock-phone-glow rotate-1 hover:rotate-0 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-12">
        <SiteStatsStrip dark />
      </section>

      {/* Brain 4 pillars */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="marketing-eyebrow text-copper-400/80">Brain 4.0</p>
            <h2 className="font-display text-2xl md:text-3xl text-white mt-2 tracking-tight">The Clara Reasoning Loop</h2>
          </div>
          <Link to="/explore/intelligence" className="text-sm font-semibold text-copper-300 hover:text-copper-200">
            Intelligence layer →
          </Link>
        </div>
        <Brain4Strip dark pillars={BRAIN_4_PILLARS} icons={PILLAR_ICONS} />
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <TrustStrip dark />
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <p className="marketing-eyebrow text-white/35 mb-5">Early kitchens</p>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="marketing-pillar marketing-pillar-dark rounded-2xl p-5"
            >
              <p className="text-sm text-white/80 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 text-xs text-white/45">
                <span className="font-semibold text-white/60">{t.name}</span>
                <br />
                {t.context}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Paths */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <p className="marketing-eyebrow text-white/35 mb-5">Choose your path</p>
        <div className="grid gap-4 md:grid-cols-3">
          <DrillCard dark to="/explore" badge="What" title="The Kitchen Stack" subtitle="Five layers. Every live feature mapped — including Brain 4.0." />
          <DrillCard dark to="/how" badge="How" title="Capture → Remember → Act" subtitle="Receipt, photo, cook log, proactive Brain, Clara tools." />
          <DrillCard dark to="/learn" badge="Learn" title="Kitchen Academy" subtitle={`Origins, timelines, teach-me — ${DEEP_CATALOG.length}+ deep dives.`} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <DrillCard dark to="/vision" badge="Deep" title="Vision & Roadmap" subtitle="Smart kitchen, social, famous styles — honest status." />
          <DrillCard dark to="/explore/legacy/hosting" badge="Live" title="Hosting Studio" subtitle="Dinner party timelines from your pantry — in the app today." />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-sm px-6 py-5">
          <div className="flex items-center gap-3">
            <Sparkles className="text-copper-400" size={22} aria-hidden />
            <div>
              <p className="text-sm font-semibold text-white">Plus $9 · Family $18</p>
              <p className="text-xs text-white/45">No surprise AI bills. Proactive Brain free at zero credits.</p>
            </div>
          </div>
          <Link to="/pricing" className="text-sm font-semibold text-copper-300 hover:text-copper-200 min-h-[44px] inline-flex items-center">
            Compare plans →
          </Link>
        </div>
      </section>

      <MarketingFAQ items={MARKETING_FAQ} dark />

      <section className="mx-auto max-w-5xl px-5 pb-24 md:pb-16 text-center">
        <h2 className="font-display text-2xl md:text-3xl text-white tracking-tight">Ready when you are, Chef.</h2>
        <p className="text-white/55 mt-2 text-sm max-w-md mx-auto">Scan a receipt. Photo the pantry. Let Clara read your kitchen.</p>
        <button
          type="button"
          onClick={cta}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-chef hover:bg-stainless-100 min-h-[52px] shadow-glow"
        >
          {user ? 'Open your kitchen' : 'Start free today'}
          <ArrowRight size={16} />
        </button>
      </section>
    </MarketingLayout>
  );
}
