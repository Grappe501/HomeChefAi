import { useNavigate } from 'react-router-dom';
import { MarketingLayout, PageHeader } from '@/components/marketing/MarketingLayout';
import { PRICING_COMPARISON } from '@/content/siteContent';
import { useApp } from '@/hooks/useApp';

const TIERS = [
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

function CellValue({ v }: { v: boolean | string }) {
  if (v === true) return <span className="text-emerald-600 font-medium">✓</span>;
  if (v === false) return <span className="text-chef-subtle">—</span>;
  return <span className="text-sm">{v}</span>;
}

export default function PricingPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const cta = () => (user ? navigate('/') : navigate('/login'));

  return (
    <MarketingLayout crumbs={[{ label: 'Pricing' }]}>
      <PageHeader
        eyebrow="Pricing"
        title="Clean prices. No surprise AI bills."
        lead="Your pantry, recipes, and kitchen data always work — even when AI credits are exhausted."
      />

      <div className="mx-auto max-w-5xl px-5 pb-12 grid gap-5 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-7 ${
              tier.highlight ? 'border-chef bg-chef text-white shadow-elevated md:scale-[1.02]' : 'border-steel/80 bg-white'
            }`}
          >
            <h3 className="text-lg font-semibold">{tier.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl tracking-tight">{tier.price}</span>
              <span className={`text-sm ${tier.highlight ? 'text-white/60' : 'text-chef-subtle'}`}>{tier.period}</span>
            </div>
            <p className={`mt-3 text-sm ${tier.highlight ? 'text-white/70' : 'text-chef-subtle'}`}>{tier.blurb}</p>
            <ul className={`mt-6 space-y-2 text-sm ${tier.highlight ? 'text-white/85' : 'text-chef-muted'}`}>
              {tier.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className={tier.highlight ? 'text-copper-400' : 'text-copper-500'}>·</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={cta}
              className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition ${
                tier.highlight ? 'bg-white text-chef hover:bg-stainless-100' : 'bg-chef text-white hover:bg-chef-muted'
              }`}
            >
              {user ? 'Open App' : `Start ${tier.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16 overflow-x-auto">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-4">Full comparison</h2>
        <table className="w-full text-sm border-collapse min-w-[520px]">
          <thead>
            <tr className="border-b border-steel">
              <th className="text-left py-3 pr-4 font-medium text-chef-subtle">Feature</th>
              <th className="text-center py-3 px-2 font-medium">Free</th>
              <th className="text-center py-3 px-2 font-medium">Plus</th>
              <th className="text-center py-3 px-2 font-medium">Family</th>
            </tr>
          </thead>
          <tbody>
            {PRICING_COMPARISON.map((row) => (
              <tr key={row.feature} className="border-b border-steel/60">
                <td className="py-3 pr-4 text-chef">{row.feature}</td>
                <td className="text-center py-3"><CellValue v={row.free} /></td>
                <td className="text-center py-3"><CellValue v={row.plus} /></td>
                <td className="text-center py-3"><CellValue v={row.family} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-auto max-w-2xl px-5 pb-16 text-center text-sm text-chef-subtle">
        <p>Full access during beta. Billing via Stripe at launch.</p>
        <a href="/legal/ai-usage.html" className="underline hover:text-chef mt-2 inline-block">AI fair-use policy</a>
      </div>
    </MarketingLayout>
  );
}
