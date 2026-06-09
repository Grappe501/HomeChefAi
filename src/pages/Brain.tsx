import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, RefreshCw } from 'lucide-react';
import { brainApi } from '@/lib/api';
import type { BrainInsight } from '@/types/brain';
import BrainInsightCard from '@/components/BrainInsightCard';
import { useToast } from '@/hooks/useToast';

export default function BrainPage() {
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
      .catch(() => toast.error('Could not load Kitchen Brain'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await brainApi.sync();
      toast.success(`Kitchen Brain updated — ${r.insights_count} insights`);
      load();
    } catch {
      toast.error('Brain sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Brain size={22} className="text-chef-muted" />
            Kitchen Brain
          </h2>
          <p className="text-sm text-chef-subtle mt-1">Recent learnings about your kitchen</p>
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={syncing}
          className="btn-secondary text-sm py-2 px-3 min-h-0"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
        </button>
      </header>

      {loading && (
        <div className="card text-sm text-chef-subtle">Loading memories…</div>
      )}

      {!loading && insights.length === 0 && (
        <div className="card space-y-3">
          <p className="text-chef-subtle">
            Chef, I'm still learning your kitchen. Scan a few receipts and log some meals — I'll start remembering patterns soon.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/receipt" className="btn-primary text-sm py-2.5">Scan a receipt</Link>
            <Link to="/cook" className="btn-secondary text-sm py-2.5">Log a meal</Link>
          </div>
        </div>
      )}

      {!loading && insights.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-chef-subtle">Recent Learnings</h3>
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
