import { useState } from 'react';
import { PartyPopper, Clock, ShoppingBag } from 'lucide-react';
import { experienceApi, billingApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { ExperiencePlanResult, ExperienceType } from '@/types/experience';

const EXPERIENCE_TYPES: { id: ExperienceType; label: string; hint: string }[] = [
  { id: 'dinner_party', label: 'Dinner party', hint: 'Multi-course menu with timeline' },
  { id: 'game_day', label: 'Game day', hint: 'Crowd snacks and make-ahead' },
  { id: 'potluck', label: 'Potluck', hint: 'Shareable dishes that travel well' },
  { id: 'holiday', label: 'Holiday feast', hint: 'Seasonal centerpiece menu' },
];

export default function HostingStudio() {
  const toast = useToast();
  const [type, setType] = useState<ExperienceType>('dinner_party');
  const [guests, setGuests] = useState(6);
  const [startTime, setStartTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [useAi, setUseAi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ExperiencePlanResult | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | undefined>();

  const generate = async () => {
    setLoading(true);
    try {
      const { plan: result } = await experienceApi.plan({
        experience_type: type,
        guest_count: guests,
        start_time: startTime,
        message: notes || undefined,
        use_ai: useAi,
      });
      setPlan(result);
      billingApi.status().then((s) => {
        if (s.credits) setCreditsRemaining(s.credits.remaining);
      }).catch(() => {});
      toast.success('Hosting plan ready');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2">
          <PartyPopper className="text-copper-600" size={24} />
          <h2 className="font-sans font-semibold text-xl text-chef">Hosting Studio</h2>
        </div>
        <p className="text-sm text-chef-subtle mt-2">
          Menu, timeline, and shopping list from your pantry. 5 credits per plan.
          {creditsRemaining != null && ` · ${creditsRemaining} credits left`}
        </p>
      </header>

      {!plan ? (
        <div className="space-y-4">
          <section className="card space-y-3">
            <p className="section-label">Experience type</p>
            <div className="grid grid-cols-2 gap-2">
              {EXPERIENCE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`rounded-xl border px-3 py-3 text-left min-h-[72px] transition ${
                    type === t.id ? 'border-chef bg-stainless-100' : 'border-steel hover:border-steel-dark'
                  }`}
                >
                  <p className="font-semibold text-sm text-chef">{t.label}</p>
                  <p className="text-[10px] text-chef-subtle mt-1">{t.hint}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="card space-y-3">
            <label className="block">
              <span className="section-label">Guests</span>
              <input
                type="number"
                min={2}
                max={24}
                value={guests}
                onChange={(e) => setGuests(Math.min(24, Math.max(2, parseInt(e.target.value, 10) || 2)))}
                className="input-field mt-2"
              />
            </label>
            <label className="block">
              <span className="section-label">Serve time</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-field mt-2"
              />
            </label>
            <label className="block">
              <span className="section-label">Notes for Clara (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field mt-2 min-h-[80px]"
                placeholder="Budget-friendly, one vegetarian guest, Cajun theme…"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-chef">
              <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
              Refine menu with AI (recommended)
            </label>
          </section>

          <button type="button" onClick={generate} disabled={loading} className="btn-primary w-full min-h-[52px]">
            {loading ? 'Building your plan…' : 'Generate hosting plan'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card bg-copper-50/40 border-copper-200/60">
            <p className="font-semibold text-chef capitalize">{plan.experience_type.replace(/_/g, ' ')} · {plan.guest_count} guests</p>
            <p className="text-sm text-chef-subtle mt-2 leading-relaxed">{plan.summary}</p>
          </div>

          <section className="card">
            <h3 className="section-label mb-3">Menu</h3>
            <ul className="space-y-2">
              {plan.menu.map((m, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-chef">{m.course}:</span>{' '}
                  <span className="text-chef-muted">{m.name}</span>
                  {m.description && (
                    <p className="text-xs text-chef-subtle mt-0.5">{m.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h3 className="section-label mb-3 flex items-center gap-2">
              <Clock size={16} /> Timeline
            </h3>
            <ul className="space-y-2">
              {plan.timeline.map((s, i) => (
                <li key={i} className="text-sm flex gap-3">
                  <span className="font-mono text-chef-subtle shrink-0 w-14">{s.time}</span>
                  <span className="text-chef">{s.task}</span>
                </li>
              ))}
            </ul>
          </section>

          {plan.shopping_list.length > 0 && (
            <section className="card">
              <h3 className="section-label mb-3 flex items-center gap-2">
                <ShoppingBag size={16} /> Shopping list
              </h3>
              <ul className="space-y-1">
                {plan.shopping_list.map((s, i) => (
                  <li key={i} className="text-sm text-chef">
                    {s.quantity} {s.unit} {s.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button type="button" onClick={() => setPlan(null)} className="btn-secondary w-full">
            Plan another event
          </button>
        </div>
      )}
    </div>
  );
}
