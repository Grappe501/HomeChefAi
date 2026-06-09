import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, BookOpen } from 'lucide-react';
import { brainApi } from '@/lib/api';
import { useApp } from '@/hooks/useApp';
import type { BrainInsight } from '@/types/brain';
import type { InferredCookingStyle } from '@/types/householdGraph';
import type { KitchenPrediction } from '@/types/kitchenPredictions';
import BrainInsightCard from '@/components/BrainInsightCard';
import ProactiveKitchenCards from '@/components/ProactiveKitchenCards';
import SousChefMark from '@/components/SousChefMark';
import { assistantFirstName } from '@/lib/assistant';
import { useToast } from '@/hooks/useToast';

export default function BrainPage() {
  const { profile } = useApp();
  const assistantName = assistantFirstName(profile?.assistant_name);
  const [insights, setInsights] = useState<BrainInsight[]>([]);
  const [learning, setLearning] = useState(0);
  const [cookingStyle, setCookingStyle] = useState<InferredCookingStyle | null>(null);
  const [predictions, setPredictions] = useState<KitchenPrediction[]>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    setPredictionsLoading(true);
    brainApi
      .insights()
      .then((r) => {
        setInsights(r.insights);
        setLearning(r.learning);
        setCookingStyle(r.inferred_cooking_style ?? null);
      })
      .catch(() => toast.error(`Could not load ${assistantName}'s notes`))
      .finally(() => setLoading(false));
    brainApi
      .predictions()
      .then((r) => setPredictions(r.predictions))
      .catch(() => {})
      .finally(() => setPredictionsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await brainApi.sync();
      toast.success(`${assistantName} updated — ${r.insights_count} notes`);
      load();
    } catch {
      toast.error('Could not refresh kitchen memory');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <SousChefMark name={assistantName} />
          <p className="text-sm text-chef-subtle mt-2">What {assistantName} has learned about your kitchen</p>
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={syncing}
          className="btn-secondary text-sm py-2 px-3 min-h-[52px]"
          aria-label="Refresh kitchen memory"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
        </button>
      </header>

      {cookingStyle?.primary_label && (
        <section className="card bg-stainless-100 border-chef/20">
          <p className="text-xs font-semibold text-chef-subtle uppercase tracking-wide">Kitchen identity</p>
          <p className="text-lg font-semibold text-chef mt-1">{cookingStyle.primary_label}</p>
          {cookingStyle.evidence?.length > 0 && (
            <p className="text-xs text-chef-subtle mt-2">
              Based on {cookingStyle.evidence.length} signals including receipts, cook logs, and your meal plan feedback.
            </p>
          )}
        </section>
      )}

      <ProactiveKitchenCards predictions={predictions} loading={predictionsLoading} />

      {loading && (
        <div className="card text-sm text-chef-subtle min-h-[52px] flex items-center">Loading…</div>
      )}

      {!loading && insights.length === 0 && (
        <div className="card space-y-3">
          <p className="text-chef-subtle leading-relaxed">
            Chef, I&apos;m still learning your kitchen. Scan a few receipts and log some meals — I&apos;ll start remembering patterns soon.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/receipt" className="btn-primary text-sm flex-1 min-w-[140px]">Scan a receipt</Link>
            <Link to="/cook" className="btn-secondary text-sm flex-1 min-w-[140px]">Log a meal</Link>
          </div>
        </div>
      )}

      {!loading && insights.length > 0 && (
        <section className="space-y-3">
          {insights.map((insight) => (
            <BrainInsightCard key={insight.id} insight={insight} />
          ))}
        </section>
      )}

      {learning > 0 && (
        <p className="text-xs text-chef-subtle text-center">
          {learning} more pattern{learning === 1 ? '' : 's'} building confidence…
        </p>
      )}

      <Link
        to="/learn"
        className="flex items-center justify-center gap-2 rounded-xl border border-steel bg-white px-4 py-3 text-sm font-semibold text-chef hover:border-copper-400/50 transition min-h-[52px]"
      >
        <BookOpen size={18} className="text-copper-600" />
        Kitchen Academy — history & teach-me moments
      </Link>
    </div>
  );
}
