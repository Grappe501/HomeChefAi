import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { brainApi } from '@/lib/api';
import { useApp } from '@/hooks/useApp';
import type { BrainInsight } from '@/types/brain';
import BrainInsightCard from '@/components/BrainInsightCard';
import SousChefMark from '@/components/SousChefMark';
import { assistantFirstName } from '@/lib/assistant';
import { useToast } from '@/hooks/useToast';

export default function BrainPage() {
  const { profile } = useApp();
  const assistantName = assistantFirstName(profile?.assistant_name);
  const [insights, setInsights] = useState<BrainInsight[]>([]);
  const [learning, setLearning] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    brainApi
      .insights()
      .then((r) => {
        setInsights(r.insights);
        setLearning(r.learning);
      })
      .catch(() => toast.error(`Could not load ${assistantName}'s notes`))
      .finally(() => setLoading(false));
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
    </div>
  );
}
