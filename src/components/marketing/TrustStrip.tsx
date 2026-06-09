import { Shield, Sparkles } from 'lucide-react';
import { TESTIMONIALS, TRUST_PILLARS } from '@/content/marketingContent';

interface TrustStripProps {
  dark?: boolean;
}

export function TrustStrip({ dark }: TrustStripProps) {
  return (
    <div className="space-y-12">
      <section aria-label="Why households trust SousChef">
        <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${dark ? '' : ''}`}>
          {TRUST_PILLARS.map((p) => (
            <div
              key={p.label}
              className={`rounded-xl border px-4 py-4 ${
                dark ? 'border-white/10 bg-white/[0.04]' : 'border-steel/80 bg-white'
              }`}
            >
              <p className={`text-sm font-semibold flex items-center gap-2 ${dark ? 'text-white' : 'text-chef'}`}>
                <Shield size={14} className="text-copper-500 shrink-0" aria-hidden />
                {p.label}
              </p>
              <p className={`text-xs mt-1 ${dark ? 'text-white/50' : 'text-chef-subtle'}`}>{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Early household feedback">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-5 ${dark ? 'text-white/35' : 'text-chef-subtle'}`}>
          Early kitchens
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name + t.context}
              className={`rounded-xl border p-5 ${
                dark ? 'border-white/10 bg-white/[0.03]' : 'border-steel/80 bg-stainless-50'
              }`}
            >
              <Sparkles size={16} className="text-copper-500 mb-3" aria-hidden />
              <p className={`text-sm leading-relaxed ${dark ? 'text-white/80' : 'text-chef'}`}>&ldquo;{t.quote}&rdquo;</p>
              <footer className={`mt-4 text-xs ${dark ? 'text-white/45' : 'text-chef-subtle'}`}>
                <cite className="not-italic font-semibold text-copper-600">{t.name}</cite>
                <span className="block mt-0.5">{t.context}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  );
}
