import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { MarketingLayout, DrillCard } from '@/components/marketing/MarketingLayout';
import { ProductMock, SiteStatsStrip } from '@/components/marketing/MarketingBlocks';
import { PageMeta } from '@/components/marketing/PageMeta';
import { MarketingFAQ } from '@/components/marketing/MarketingFAQ';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { StickyMobileCTA } from '@/components/marketing/StickyMobileCTA';
import { DEEP_CATALOG } from '@/lib/deepCatalog';
import { MARKETING_FAQ } from '@/content/marketingContent';
import { useApp } from '@/hooks/useApp';

const VALUE_PROPS = [
  'Receipt scan → verified pantry in minutes',
  'Meal plans built from what you actually have',
  'Why this? explains every pick — no fake history',
  'Kitchen Academy: origins, timelines, teach-me moments',
];

export default function Landing() {
  const { user } = useApp();
  const navigate = useNavigate();
  const cta = () => (user ? navigate('/') : navigate('/login'));

  return (
    <MarketingLayout dark>
      <PageMeta
        title="SousChef — Your Kitchen Has A Memory"
        description="Household Food Operating System — pantry inventory, AI meal planning, Clara sous chef, and a culinary knowledge graph. Start free."
        path="/landing"
        faq={MARKETING_FAQ.map((f) => ({ question: f.question, answer: f.answer }))}
      />
      <StickyMobileCTA dark />

      <section className="relative mx-auto max-w-5xl px-5 pt-8 pb-16 md:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="marketing-animate-in">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
              Household Food Operating System
            </p>
            <h1 className="font-display mt-5 text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05] tracking-tight text-white">
              Your kitchen deserves a memory.
            </h1>
            <p className="mt-5 text-base text-white/65 leading-relaxed max-w-md">
              Not another recipe app. A system that learns how you shop, cook, and repeat — with evidence you can read.
            </p>
            <ul className="mt-6 space-y-2">
              {VALUE_PROPS.map((v) => (
                <li key={v} className="flex items-start gap-2 text-sm text-white/70">
                  <CheckCircle2 size={16} className="text-copper-400 shrink-0 mt-0.5" aria-hidden />
                  {v}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={cta}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-chef hover:bg-stainless-100 min-h-[52px]"
              >
                {user ? 'Open your kitchen' : 'Start free'}
                <ArrowRight size={16} />
              </button>
              <Link
                to="/explore"
                className="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/5 min-h-[52px]"
              >
                Explore platform
              </Link>
            </div>
            <p className="mt-8 text-sm text-white/40">
              <Link to="/story" className="underline hover:text-white/60">Our story</Link>
              {' · '}
              <Link to="/how" className="underline hover:text-white/60">How it works</Link>
              {' · '}
              <Link to="/pricing" className="underline hover:text-white/60">Pricing</Link>
            </p>
          </div>

          <div className="flex justify-center lg:justify-end marketing-animate-in marketing-animate-in-delay-2">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-copper-600/20 blur-3xl" aria-hidden />
              <ProductMock variant="planner" className="relative rotate-1 hover:rotate-0 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-12">
        <SiteStatsStrip dark />
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <TrustStrip dark />
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-5">Choose your path</p>
        <div className="grid gap-4 md:grid-cols-3">
          <DrillCard dark to="/explore" badge="What" title="The Kitchen Stack" subtitle="Five layers. Every live feature mapped. Drill into each one." />
          <DrillCard dark to="/how" badge="How" title="Capture → Remember → Act" subtitle="Three moves that power the whole system." />
          <DrillCard dark to="/learn" badge="Learn" title="Kitchen Academy" subtitle={`Origins, timelines, and what Clara can teach — ${DEEP_CATALOG.length}+ deep dives today.`} />
        </div>

        <div className="mt-4">
          <DrillCard dark to="/vision" badge="Deep" title="Vision & Roadmap" subtitle="Smart kitchen, social, famous styles — the full rabbit hole." />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
          <div className="flex items-center gap-3">
            <Sparkles className="text-copper-400" size={20} aria-hidden />
            <div>
              <p className="text-sm font-semibold text-white">Plus $9 · Family $18</p>
              <p className="text-xs text-white/45">No surprise AI bills. Pantry always works.</p>
            </div>
          </div>
          <Link to="/pricing" className="text-sm font-semibold text-copper-300 hover:text-copper-200 min-h-[44px] inline-flex items-center">
            Compare plans →
          </Link>
        </div>
      </section>

      <MarketingFAQ items={MARKETING_FAQ} dark />

      <section className="mx-auto max-w-5xl px-5 pb-24 md:pb-16 text-center">
        <h2 className="font-display text-2xl text-white tracking-tight">Ready when you are.</h2>
        <p className="text-white/55 mt-2 text-sm max-w-md mx-auto">Scan a receipt. Plan the week. Ask Clara why.</p>
        <button
          onClick={cta}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-chef hover:bg-stainless-100 min-h-[52px]"
        >
          {user ? 'Open your kitchen' : 'Start free today'}
          <ArrowRight size={16} />
        </button>
      </section>
    </MarketingLayout>
  );
}
