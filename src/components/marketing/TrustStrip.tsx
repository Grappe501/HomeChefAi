import { Shield } from 'lucide-react';
import { TRUST_PILLARS } from '@/content/marketingContent';

interface TrustStripProps {
  dark?: boolean;
}

export function TrustStrip({ dark }: TrustStripProps) {
  return (
    <section aria-label="Why households trust SousChef">
      <p className={`marketing-eyebrow mb-4 ${dark ? 'text-white/35' : 'text-chef-subtle'}`}>
        Built for trust
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_PILLARS.map((p) => (
          <div
            key={p.label}
            className={`marketing-pillar ${dark ? 'marketing-pillar-dark py-4 px-4' : 'marketing-pillar-light py-4 px-4'}`}
          >
            <p className={`text-sm font-semibold flex items-center gap-2 ${dark ? 'text-white' : 'text-chef'}`}>
              <Shield size={14} className="text-copper-500 shrink-0" aria-hidden />
              {p.label}
            </p>
            <p className={`text-xs mt-1.5 leading-relaxed ${dark ? 'text-white/50' : 'text-chef-subtle'}`}>{p.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
