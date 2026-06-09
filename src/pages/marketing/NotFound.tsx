import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { PageMeta } from '@/components/marketing/PageMeta';
import { DrillCard } from '@/components/marketing/MarketingLayout';
import { appEntryPath } from '@/lib/siteNav';
import { useApp } from '@/hooks/useApp';

export default function MarketingNotFound() {
  const { user } = useApp();

  return (
    <MarketingLayout dark crumbs={[{ label: 'Not found' }]}>
      <PageMeta
        title="Page not found"
        description="This page does not exist on SousChef."
        path="/404"
        noindex
      />
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <p className="text-6xl font-display text-white/20">404</p>
        <h1 className="font-display text-3xl text-white mt-4 tracking-tight">This page isn&apos;t on the menu</h1>
        <p className="text-white/55 mt-3 text-sm leading-relaxed">
          The link may be outdated or mistyped. Head back to explore the platform or open your kitchen.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/landing"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-chef hover:bg-stainless-100 min-h-[52px]"
          >
            Back to home
          </Link>
          <Link
            to={appEntryPath(!!user)}
            className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/5 min-h-[52px]"
          >
            {user ? 'Open app' : 'Sign in'}
          </Link>
        </div>
        <div className="mt-12 grid gap-3 text-left">
          <DrillCard dark to="/explore" badge="Explore" title="Platform" subtitle="Five layers, every feature mapped" />
          <DrillCard dark to="/pricing" badge="Pricing" title="Plans" subtitle="Free, Plus $9, Family $18" />
        </div>
      </div>
    </MarketingLayout>
  );
}
