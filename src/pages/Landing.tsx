import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  ChefHat,
  Heart,
  Layers,
  Leaf,
  ScanLine,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useReveal } from '@/hooks/useReveal';

function RevealSection({
  id,
  className = '',
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, visible } = useReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </section>
  );
}

const STACK = [
  {
    level: '01',
    title: 'Inventory',
    tagline: 'Know what you have.',
    body: 'Receipt scanning, pantry wizard, fridge and freezer tracking. Every item linked to a 250+ node food knowledge graph.',
    features: ['OpenAI Vision receipt parse', 'Expiration-aware pantry', 'Knowledge-linked ingredients'],
    icon: ScanLine,
  },
  {
    level: '02',
    title: 'Kitchen Memory',
    tagline: 'Your kitchen remembers.',
    body: 'Brain 2.0 builds a household food graph from every shop, cook, and waste event — patterns that compound week after week.',
    features: ['Explainable Brain insights', 'Decision ledger learning', 'Kitchen identity & archetypes'],
    icon: Brain,
  },
  {
    level: '03',
    title: 'Kitchen Intelligence',
    tagline: 'Cook with confidence.',
    body: 'Three-direction meal reasoning, Why this? explanations, one-tap replace, and a Sous Chef that learns from your rejections.',
    features: ['3-direction meal flow', 'Why this? + replace meal', 'Clara assistant with intent routing'],
    icon: Sparkles,
  },
  {
    level: '04',
    title: 'Kitchen Growth',
    tagline: 'Get better every cook.',
    body: 'Technique micro-lessons, Cook Together coaching, and skill memories earned from your actual cook log — not generic tutorials.',
    features: ['15+ technique micro-lessons', 'Cook Together coach', 'Skill journey from real practice'],
    icon: ChefHat,
  },
  {
    level: '05',
    title: 'Kitchen Legacy',
    tagline: 'Preserve what matters.',
    body: 'Hosting timelines for dinner parties and holidays, tradition memories, and recipe lineage that tracks what your family actually cooks.',
    features: ['Experience hosting plans', 'Tradition & legacy memories', 'Recipe serve count & lineage'],
    icon: Heart,
  },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    blurb: 'Prove the loop. Your kitchen always works.',
    items: ['30 AI credits / month', 'Pantry & receipt scanning', 'Brain insights (deterministic)', 'Voice Sous Chef'],
  },
  {
    name: 'Plus',
    price: '$9',
    period: '/ month',
    highlight: true,
    blurb: 'The busy family kitchen. Clean price, no tricks.',
    items: ['150 AI credits / month', 'Full Brain 2.0 intelligence', 'Meal plans & Why this?', 'Hosting experience plans'],
  },
  {
    name: 'Family',
    price: '$18',
    period: '/ month',
    highlight: false,
    blurb: 'Cook Together. Share the whole kitchen.',
    items: ['300 AI credits / month', 'Household members & shared pantry', 'Priority AI responses', 'Everything in Plus'],
  },
];

export default function Landing() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cta = () => (user ? navigate('/') : navigate('/login'));

  return (
    <div className="bg-stainless-50 text-chef selection:bg-copper-500/20">
      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-stainless-50/90 backdrop-blur-xl border-b border-steel/60 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/landing" className="font-display text-2xl tracking-tight text-chef">
            SousChef
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-chef-muted md:flex">
            <a href="#belief" className="hover:text-chef transition-colors">Belief</a>
            <a href="#approach" className="hover:text-chef transition-colors">Approach</a>
            <a href="#platform" className="hover:text-chef transition-colors">Platform</a>
            <a href="#pricing" className="hover:text-chef transition-colors">Pricing</a>
          </nav>
          <button onClick={cta} className="rounded-full bg-chef px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-chef-muted">
            {user ? 'Open App' : 'Start Free'}
          </button>
        </div>
      </header>

      {/* WHY — Hero + belief */}
      <section id="belief" className="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden bg-chef text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-1/4 left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-copper-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[50vh] w-[50vh] rounded-full bg-sage-600/15 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#111315_70%)]" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-24 pt-32 md:pb-32 md:pt-40">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            Household Food Operating System
          </p>
          <h1 className="font-display max-w-4xl text-[clamp(2.75rem,8vw,5.5rem)] leading-[1.05] tracking-tight">
            Your kitchen deserves a memory.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
            Not another recipe app. Not another meal planner. A system that learns how your household shops,
            cooks, wastes, and repeats — then helps you act on it with confidence.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <button onClick={cta} className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-chef transition hover:bg-stainless-100">
              {user ? 'Open your kitchen' : 'Start free — scan your first receipt'}
              <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </button>
            <a
              href="#platform"
              className="inline-flex items-center rounded-full border border-white/25 px-8 py-4 text-base font-medium text-white/90 transition hover:border-white/50 hover:bg-white/5"
            >
              See the full platform
            </a>
          </div>
          <p className="mt-16 max-w-xl text-sm leading-relaxed text-white/45">
            Families lose $1,500+ a year to food waste. Traditions scatter across notes and screenshots.
            Dinner stress repeats nightly. The problem isn&apos;t recipes — it&apos;s that your kitchen forgets.
          </p>
        </div>
      </section>

      {/* WHY — Emotional pillars */}
      <RevealSection className="border-b border-steel/60 bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-600">Why SousChef exists</p>
          <h2 className="font-display mt-4 max-w-3xl text-[clamp(2rem,5vw,3.25rem)] leading-tight tracking-tight text-chef">
            Cook with confidence. Waste less. Preserve what your family built.
          </h2>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Know what you have',
                body: 'Stop buying duplicates. Stop discovering expired yogurt. Your pantry becomes truth, not guesswork.',
              },
              {
                title: 'Build better habits',
                body: 'Brain detects patterns — what you repeat, what you waste, what you crave. Intelligence grounded in your history, not the internet.',
              },
              {
                title: 'Preserve your legacy',
                body: 'Grandma\'s potato salad. Sunday chili. The meals your family actually makes — remembered, not lost.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-steel/80 bg-stainless-50 p-8">
                <h3 className="text-lg font-semibold text-chef">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-chef-subtle">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* HOW — Approach & philosophy */}
      <RevealSection id="approach" className="bg-stainless-100 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-600">Our approach</p>
              <h2 className="font-display mt-4 text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight">
                Memory that compounds. Intelligence you can trust.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-chef-subtle">
                Most kitchen apps are features — a list, a planner, a chatbot. SousChef is a{' '}
                <strong className="font-semibold text-chef">Household Food Operating System</strong>: a graph
                that connects purchases, inventory, consumption, waste, preferences, and traditions into one
                compounding asset.
              </p>
              <p className="mt-4 text-base leading-relaxed text-chef-subtle">
                Every receipt, cook log, and meal decision writes to your graph. Switching cost rises every
                week you cook. That&apos;s the moat — and it&apos;s yours.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Capture',
                  body: 'Scan receipts. Log cooks. Track pantry. Low friction, voice-first where it matters.',
                  icon: ScanLine,
                },
                {
                  step: '02',
                  title: 'Remember',
                  body: 'Brain 2.0 detects patterns with evidence. Every insight shows its reasoning — no black box.',
                  icon: Brain,
                },
                {
                  step: '03',
                  title: 'Act',
                  body: 'Plan meals from your pantry. Ask Why this? Replace what doesn\'t fit. Host with confidence.',
                  icon: Sparkles,
                },
              ].map(({ step, title, body, icon: Icon }) => (
                <div
                  key={step}
                  className="flex gap-5 rounded-2xl border border-steel/80 bg-white p-6 shadow-card"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chef text-sm font-bold text-white">
                    {step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-copper-500" />
                      <h3 className="font-semibold">{title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-chef-subtle">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 rounded-3xl border border-sage-200 bg-sage-50 p-8 md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <Shield className="mt-1 shrink-0 text-sage-600" size={28} />
                <div>
                  <h3 className="font-display text-2xl tracking-tight">We learn to serve you — not to sell you.</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-chef-subtle">
                    We do not sell household food data, shopping habits, or family traditions. Your kitchen
                    graph stays yours. OpenAI API data is not used to train public models.
                  </p>
                </div>
              </div>
              <a href="/legal/privacy.html" className="shrink-0 text-sm font-semibold text-sage-700 hover:underline">
                Read privacy →
              </a>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* WHAT — Full platform stack */}
      <RevealSection id="platform" className="bg-chef py-24 text-white md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">The platform</p>
          <h2 className="font-display mt-4 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
            Five layers. One kitchen that gets smarter.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60">
            SousChef ships the full stack — from receipt scan to legacy hosting. This isn&apos;t a roadmap slide.
            It&apos;s live today.
          </p>

          <div className="mt-16 space-y-6">
            {STACK.map(({ level, title, tagline, body, features, icon: Icon }) => (
              <div
                key={level}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-white/20 hover:bg-white/[0.06] md:p-10"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold tracking-widest text-copper-400">{level}</span>
                      <Icon size={18} className="text-white/50" />
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Live
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-3xl tracking-tight">{title}</h3>
                    <p className="mt-1 text-copper-300/90">{tagline}</p>
                    <p className="mt-4 text-sm leading-relaxed text-white/55">{body}</p>
                  </div>
                  <ul className="min-w-[220px] space-y-2 text-sm text-white/70">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-copper-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { icon: Layers, label: '250+ knowledge nodes', sub: 'Ingredients, techniques, cuisines, hosting' },
              { icon: Users, label: 'Cook Together', sub: 'Household invites, shared pantry & plans' },
              { icon: Leaf, label: 'Deterministic Brain', sub: 'Insights without burning credits on math' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-2xl border border-white/10 p-6 text-center">
                <Icon className="mx-auto text-copper-400" size={24} />
                <p className="mt-4 font-semibold">{label}</p>
                <p className="mt-1 text-xs text-white/45">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* WHAT — Product moment */}
      <RevealSection className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-600">In practice</p>
          <h2 className="font-display mx-auto mt-4 max-w-3xl text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight">
            Receipt in. Brain learns. Dinner handled.
          </h2>
          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              { emoji: '📸', title: 'Scan', detail: 'Groceries hit your pantry in seconds. No manual entry.' },
              { emoji: '🧠', title: 'Remember', detail: '"Running low on milk." "You haven\'t had chili in 6 weeks."' },
              { emoji: '👨‍🍳', title: 'Cook', detail: 'Three directions. Why this? Replace. Log. Repeat.' },
            ].map(({ emoji, title, detail }) => (
              <div key={title} className="rounded-2xl bg-stainless-50 p-8">
                <div className="text-4xl">{emoji}</div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-chef-subtle">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Product preview — visual proof */}
      <RevealSection className="overflow-hidden bg-stainless-100 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-copper-600">Built &amp; shipping</p>
          <h2 className="font-display mx-auto mt-4 max-w-2xl text-center text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight">
            One app. The whole kitchen stack.
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                label: 'Pantry',
                title: '14 items expiring this week',
                lines: ['Whole milk · 2 days', 'Chicken breast · 4 days', 'Basil · today'],
                accent: 'bg-sage-500',
              },
              {
                label: 'Brain',
                title: 'Kitchen Memory',
                lines: ['You cook Italian 3× more than you think', 'Waste down 18% this month', 'Try chili — 6 weeks since last'],
                accent: 'bg-copper-500',
              },
              {
                label: 'Planner',
                title: 'Why this?',
                lines: ['Uses chicken + basil in pantry', 'Matches your Tue pattern', '30 min · crowd favorite'],
                accent: 'bg-chef',
              },
            ].map((card) => (
              <div key={card.label} className="rounded-3xl border border-steel/80 bg-white p-6 shadow-elevated">
                <div className={`mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${card.accent}`}>
                  {card.label}
                </div>
                <p className="font-semibold text-chef">{card.title}</p>
                <ul className="mt-4 space-y-2">
                  {card.lines.map((line) => (
                    <li key={line} className="rounded-lg bg-stainless-50 px-3 py-2 text-sm text-chef-subtle">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Category / investor-quality signal — framed as product truth */}
      <RevealSection className="border-y border-steel/60 bg-stainless-100 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-snug tracking-tight text-chef">
            &ldquo;Inventory alone is not the moat. Recipes alone are not the moat.{' '}
            <span className="text-copper-600">The moat is memory that compounds.</span>&rdquo;
          </p>
          <p className="mt-6 text-sm text-chef-subtle">
            Explainable AI · Household-scoped graph · Recipe lineage · Zero data resale
          </p>
        </div>
      </RevealSection>

      {/* Pricing */}
      <RevealSection id="pricing" className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-600">Pricing</p>
            <h2 className="font-display mt-4 text-[clamp(2rem,4vw,3rem)] tracking-tight">
              Clean prices. No surprise AI bills.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-chef-subtle">
              Your pantry, recipes, and kitchen data always work — even when AI credits are exhausted.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-8 ${
                  tier.highlight
                    ? 'border-chef bg-chef text-white shadow-elevated scale-[1.02]'
                    : 'border-steel/80 bg-stainless-50'
                }`}
              >
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl tracking-tight">{tier.price}</span>
                  <span className={tier.highlight ? 'text-white/60' : 'text-chef-subtle'}>{tier.period}</span>
                </div>
                <p className={`mt-4 text-sm ${tier.highlight ? 'text-white/70' : 'text-chef-subtle'}`}>
                  {tier.blurb}
                </p>
                <ul className={`mt-8 space-y-3 text-sm ${tier.highlight ? 'text-white/85' : 'text-chef-muted'}`}>
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tier.highlight ? 'bg-copper-400' : 'bg-copper-500'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={cta}
                  className={`mt-8 w-full rounded-xl py-3.5 text-sm font-semibold transition ${
                    tier.highlight
                      ? 'bg-white text-chef hover:bg-stainless-100'
                      : 'bg-chef text-white hover:bg-chef-muted'
                  }`}
                >
                  {user ? 'Open App' : `Start ${tier.name}`}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-chef-subtle">
            Full access during beta. Billing via Stripe at launch.{' '}
            <a href="/legal/ai-usage.html" className="underline hover:text-chef">AI fair-use policy</a>
          </p>
        </div>
      </RevealSection>

      {/* Final CTA */}
      <section id="start" className="bg-chef py-24 text-white md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-tight tracking-tight">
            SousChef
          </h2>
          <p className="mt-2 font-display text-2xl text-white/70 md:text-3xl">Your Kitchen Has A Memory.</p>
          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-white/55">
            Join the households building a smarter kitchen — one receipt, one cook, one tradition at a time.
          </p>
          <button
            onClick={cta}
            className="mt-12 inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-base font-semibold text-chef transition hover:bg-stainless-100"
          >
            {user ? 'Open your kitchen' : 'Start free today'}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-steel/60 bg-stainless-50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="font-display text-xl">SousChef</p>
            <p className="mt-1 text-xs text-chef-subtle">Operated by HomeChef AI · © 2026</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-chef-subtle">
            <a href="/legal/terms.html" className="hover:text-chef">Terms</a>
            <a href="/legal/privacy.html" className="hover:text-chef">Privacy</a>
            <a href="/legal/ai-usage.html" className="hover:text-chef">AI Usage</a>
            <Link to="/login" className="hover:text-chef">Sign in</Link>
          </nav>
        </div>
        <p className="mx-auto mt-8 max-w-xl px-6 text-center text-[11px] leading-relaxed text-chef-subtle/80">
          Legal documents are draft frameworks — attorney review required before first charge.
        </p>
      </footer>
    </div>
  );
}
