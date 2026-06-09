import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { SiteSearch, useSiteSearchShortcut } from '@/components/marketing/SiteSearch';
import { useApp } from '@/hooks/useApp';
import { PLATFORM_LAYERS } from '@/content/siteContent';
import { SUPPORT_EMAIL } from '@/content/marketingContent';
import { appEntryPath } from '@/lib/siteNav';
import '@/styles/marketing.css';

interface MarketingLayoutProps {
  children: ReactNode;
  crumbs?: { label: string; href?: string }[];
  dark?: boolean;
}

const NAV = [
  { to: '/explore', label: 'Platform' },
  { to: '/learn', label: 'Learn' },
  { to: '/how', label: 'How' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/story', label: 'Story' },
  { to: '/vision', label: 'Vision ↓' },
];

function appNavItem(isLoggedIn: boolean) {
  return { to: appEntryPath(isLoggedIn), label: 'App' };
}

export function MarketingLayout({ children, crumbs = [], dark = false }: MarketingLayoutProps) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useSiteSearchShortcut(() => setSearchOpen(true));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [crumbs]);

  const cta = () => navigate(appEntryPath(!!user));
  const navItems = [...NAV, appNavItem(!!user)];

  return (
    <div className={`${dark ? 'bg-chef text-white' : 'bg-stainless-50 text-chef'} min-h-dvh marketing-grain`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-chef focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <header
        className={`sticky top-0 z-50 transition-all ${
          scrolled
            ? dark
              ? 'bg-chef/95 backdrop-blur-xl border-b border-white/10'
              : 'bg-stainless-50/95 backdrop-blur-xl border-b border-steel/60 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link to="/landing" className={`font-display text-xl tracking-tight ${dark ? 'text-white' : 'text-chef'}`}>
            SousChef
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className={
                  n.label === 'App'
                    ? dark
                      ? 'text-copper-300 hover:text-copper-200 font-semibold'
                      : 'text-copper-600 hover:text-copper-700 font-semibold'
                    : n.to === '/vision'
                      ? dark
                        ? 'text-white/45 hover:text-white/80'
                        : 'text-chef-subtle hover:text-chef-muted'
                      : dark
                        ? 'text-white/70 hover:text-white'
                        : 'text-chef-muted hover:text-chef'
                }
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                dark
                  ? 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                  : 'border-steel/80 text-chef-subtle hover:border-copper-500/40 hover:text-chef'
              }`}
              aria-label="Search site"
            >
              <Search size={14} />
              <span>Search</span>
              <kbd className={`hidden lg:inline font-mono text-[10px] ${dark ? 'text-white/35' : 'text-chef-subtle/70'}`}>
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`sm:hidden p-2 rounded-lg ${dark ? 'text-white/70' : 'text-chef-muted'}`}
              aria-label="Search site"
            >
              <Search size={20} />
            </button>
            <button
              onClick={cta}
              className={`hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-semibold transition ${
                dark ? 'bg-white text-chef hover:bg-stainless-100' : 'bg-chef text-white hover:bg-chef-muted'
              }`}
            >
              {user ? 'Open App' : 'Start Free'}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className={`md:hidden p-2 rounded-lg ${dark ? 'text-white' : 'text-chef'}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div id="mobile-nav" className={`md:hidden border-t px-5 py-4 space-y-3 ${dark ? 'border-white/10 bg-chef' : 'border-steel bg-white'}`}>
            {navItems.map((n) => (
              <Link key={n.label} to={n.to} className={`block text-sm font-medium ${dark ? 'text-white/80' : 'text-chef'}`}>
                {n.label}
              </Link>
            ))}
            <button onClick={cta} className="btn-primary w-full text-sm !min-h-[44px]">
              {user ? 'Open App' : 'Start Free'}
            </button>
          </div>
        )}
      </header>

      {crumbs.length > 0 && (
        <div className={`mx-auto max-w-5xl px-5 pt-4 ${dark ? 'text-white/45' : 'text-chef-subtle'}`}>
          <nav className="flex flex-wrap items-center gap-1.5 text-xs">
            <Link to="/landing" className="hover:underline">Home</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span>/</span>
                {c.href ? <Link to={c.href} className="hover:underline">{c.label}</Link> : (
                  <span className={dark ? 'text-white/70' : 'text-chef-muted'}>{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      )}

      <SiteSearch open={searchOpen} onClose={() => setSearchOpen(false)} dark={dark} />

      <main id="main-content">{children}</main>

      <footer className={`mt-16 border-t px-5 py-12 ${dark ? 'border-white/10' : 'border-steel/60'}`}>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <p className={`font-display text-lg ${dark ? 'text-white' : ''}`}>SousChef</p>
              <p className={`mt-2 text-xs leading-relaxed ${dark ? 'text-white/45' : 'text-chef-subtle'}`}>
                Your Kitchen Has A Memory.<br />Operated by HomeChef AI.
              </p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-white/35' : 'text-chef-subtle'}`}>Explore</p>
              <div className={`space-y-2 text-sm ${dark ? 'text-white/55' : 'text-chef-subtle'}`}>
                <Link to="/explore" className="block hover:underline">Platform</Link>
                <Link to="/learn" className="block hover:underline">Kitchen Academy</Link>
                <Link to="/how" className="block hover:underline">How it works</Link>
                <Link to="/pricing" className="block hover:underline">Pricing</Link>
                <Link to="/story" className="block hover:underline">Our story</Link>
              </div>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-white/35' : 'text-chef-subtle'}`}>Layers</p>
              <div className={`space-y-2 text-sm ${dark ? 'text-white/55' : 'text-chef-subtle'}`}>
                {PLATFORM_LAYERS.map((l) => (
                  <Link key={l.id} to={`/explore/${l.id}`} className="block hover:underline">
                    {l.title}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-white/35' : 'text-chef-subtle'}`}>Deep</p>
              <div className={`space-y-2 text-sm ${dark ? 'text-white/55' : 'text-chef-subtle'}`}>
                <Link to="/vision" className="block hover:underline">Vision & roadmap</Link>
                <Link to="/vision/roadmap" className="block hover:underline">Full roadmap</Link>
                <Link to={appEntryPath(!!user)} className="block hover:underline font-semibold">
                  {user ? 'Open app →' : 'Sign in to app →'}
                </Link>
                <a href="/legal/privacy.html" className="block hover:underline">Privacy</a>
                <a href="/legal/terms.html" className="block hover:underline">Terms</a>
                <a href="/legal/ai-usage.html" className="block hover:underline">AI Usage</a>
                <a href="/legal/community.html" className="block hover:underline">Community</a>
                <a href="/legal/sub-processors.html" className="block hover:underline">Sub-processors</a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="block hover:underline">{SUPPORT_EMAIL}</a>
              </div>
            </div>
          </div>
          <p className={`mt-10 text-[11px] ${dark ? 'text-white/30' : 'text-chef-subtle/80'}`}>
            © {new Date().getFullYear()} HomeChef AI · SousChef v2.2 · Legal frameworks v2.2 — attorney review before first charge.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function DrillCard({ to, title, subtitle, badge, dark }: {
  to: string; title: string; subtitle: string; badge?: string; dark?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group block rounded-2xl border p-6 transition marketing-animate-in ${
        dark
          ? 'border-white/15 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07]'
          : 'border-steel/80 bg-white hover:border-copper-500/40 hover:shadow-elevated'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {badge && (
            <span className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-copper-400' : 'text-copper-600'}`}>
              {badge}
            </span>
          )}
          <h3 className={`mt-1 font-display text-xl tracking-tight ${dark ? 'text-white' : 'text-chef'}`}>{title}</h3>
          <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-white/60' : 'text-chef-subtle'}`}>{subtitle}</p>
        </div>
        <span className={`text-lg transition group-hover:translate-x-0.5 ${dark ? 'text-white/40' : 'text-chef-subtle'}`}>→</span>
      </div>
    </Link>
  );
}

export function StatusBadge({ status }: { status: 'live' | 'beta' | 'vision' }) {
  const styles = {
    live: 'bg-emerald-500/15 text-emerald-700',
    beta: 'bg-amber-500/15 text-amber-800',
    vision: 'bg-violet-500/15 text-violet-700',
  };
  const labels = { live: 'Live', beta: 'Beta', vision: 'Roadmap' };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
      aria-label={`Status: ${labels[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function PageHeader({ eyebrow, title, lead, dark }: {
  eyebrow?: string; title: string; lead?: string; dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:py-12 marketing-animate-in">
      {eyebrow && (
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${dark ? 'text-white/45' : 'text-copper-600'}`}>{eyebrow}</p>
      )}
      <h1 className={`font-display mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-tight tracking-tight ${dark ? 'text-white' : ''}`}>{title}</h1>
      {lead && <p className={`mt-4 max-w-2xl text-base leading-relaxed ${dark ? 'text-white/65' : 'text-chef-subtle'}`}>{lead}</p>}
    </div>
  );
}

export function GoDeeperCTA({ to, label, dark }: { to: string; label: string; dark?: boolean }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 text-sm font-semibold mt-6 ${dark ? 'text-copper-300 hover:text-copper-200' : 'text-copper-600 hover:text-copper-700'}`}
    >
      {label} <span aria-hidden>→</span>
    </Link>
  );
}

export function SectionBlock({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`mx-auto max-w-5xl px-5 py-8 ${className}`}>
      {title && <h2 className="text-xs font-semibold uppercase tracking-wider text-chef-subtle mb-4">{title}</h2>}
      {children}
    </section>
  );
}
