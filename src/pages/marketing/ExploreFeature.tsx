import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  MarketingLayout,
  PageHeader,
  StatusBadge,
  GoDeeperCTA,
} from '@/components/marketing/MarketingLayout';
import { ProductMock, FEATURE_MOCKS } from '@/components/marketing/MarketingBlocks';
import { PageMeta } from '@/components/marketing/PageMeta';
import { getFeature, getAdjacentFeatures, FEATURE_IN_APP } from '@/content/siteContent';
import { useApp } from '@/hooks/useApp';

export default function ExploreFeature() {
  const { layerId, featureId } = useParams<{ layerId: string; featureId: string }>();
  const result = layerId && featureId ? getFeature(layerId, featureId) : undefined;
  const { user } = useApp();
  const navigate = useNavigate();

  if (!result) return <Navigate to={layerId ? `/explore/${layerId}` : '/explore'} replace />;

  const { layer, feature, parent } = result;
  const mock = FEATURE_MOCKS[feature.id];
  const inApp = FEATURE_IN_APP[feature.id];
  const related = getAdjacentFeatures(layer.id, feature.id);

  return (
    <MarketingLayout
      crumbs={[
        { label: 'Platform', href: '/explore' },
        { label: layer.title, href: `/explore/${layer.id}` },
        ...(parent ? [{ label: parent.title, href: `/explore/${layer.id}/${parent.id}` }] : []),
        { label: feature.title },
      ]}
    >
      <PageMeta title={feature.title} description={feature.summary} path={`/explore/${layer.id}/${feature.id}`} />
      <div className="mx-auto max-w-5xl px-5 py-8 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PageHeader title={feature.title} lead={feature.summary} />
          <div className="-mt-4 mb-6">
            <StatusBadge status={feature.status} />
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-3">What it does</h2>
          <ul className="space-y-3">
            {feature.details.map((d, i) => (
              <li key={i} className="flex gap-3 text-sm text-chef leading-relaxed">
                <span className="text-copper-500 shrink-0 font-bold">·</span>
                {d}
              </li>
            ))}
          </ul>

          {(feature.origins || feature.history || feature.teachings?.length) && (
            <div className="mt-10 space-y-6">
              {feature.origins && (
                <div className="rounded-xl border border-steel/80 bg-stainless-50 p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-2">Origins</h2>
                  <p className="text-sm text-chef leading-relaxed">{feature.origins}</p>
                </div>
              )}
              {feature.history && (
                <div className="rounded-xl border border-steel/80 bg-stainless-50 p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-2">History</h2>
                  <p className="text-sm text-chef leading-relaxed">{feature.history}</p>
                </div>
              )}
              {feature.teachings && feature.teachings.length > 0 && (
                <div className="rounded-xl border border-copper-200 bg-copper-50/40 p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-copper-700 mb-3">What Clara teaches</h2>
                  <ul className="space-y-2">
                    {feature.teachings.map((t, i) => (
                      <li key={i} className="text-sm text-chef flex gap-2">
                        <span className="text-copper-500 font-bold">{i + 1}.</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <Link to="/learn" className="inline-block text-sm font-semibold text-copper-700 mt-4 hover:underline">
                    Browse Kitchen Academy →
                  </Link>
                </div>
              )}
            </div>
          )}

          {feature.children && feature.children.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-4">Drill deeper</h2>
              <div className="grid gap-3">
                {feature.children.map((child) => (
                  <Link
                    key={child.id}
                    to={`/explore/${layer.id}/${child.id}`}
                    className="rounded-xl border border-steel/80 bg-stainless-50 p-4 hover:border-copper-500/40 transition"
                  >
                    <StatusBadge status={child.status} />
                    <p className="font-semibold mt-2">{child.title}</p>
                    <p className="text-sm text-chef-subtle mt-1">{child.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {inApp && feature.status !== 'vision' && (
            <div className="mt-10 rounded-xl border border-copper-200 bg-copper-50/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-copper-700">In the app</p>
              <p className="text-sm text-chef mt-1">
                {user ? (
                  <button onClick={() => navigate(inApp)} className="font-semibold text-copper-700 underline">
                    Open {feature.title} →
                  </button>
                ) : (
                  <>
                    Available at <code className="text-xs bg-white px-1 rounded">{inApp}</code> after signup.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <aside className="lg:col-span-2 space-y-6">
          {mock && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-3">Preview</p>
              <ProductMock variant={mock} className="mx-auto lg:mx-0" />
            </div>
          )}

          {related.length > 0 && (
            <div className="rounded-xl border border-steel/80 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-3">Related in {layer.title}</p>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link to={`/explore/${layer.id}/${r.id}`} className="text-sm text-chef-muted hover:text-chef font-medium">
                      {r.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16 flex flex-wrap gap-6">
        <GoDeeperCTA to={`/explore/${layer.id}`} label={`← All ${layer.title} features`} />
        {feature.status === 'vision' && <GoDeeperCTA to="/vision" label="Full roadmap" />}
      </div>
    </MarketingLayout>
  );
}
