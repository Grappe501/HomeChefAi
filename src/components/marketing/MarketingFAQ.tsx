import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/content/marketingContent';

interface MarketingFAQProps {
  items: FaqItem[];
  dark?: boolean;
  title?: string;
}

export function MarketingFAQ({ items, dark, title = 'Questions, answered' }: MarketingFAQProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <section className="mx-auto max-w-3xl px-5 py-12" aria-labelledby="faq-heading" id="faq">
      <h2
        id="faq-heading"
        className={`font-display text-2xl tracking-tight mb-6 ${dark ? 'text-white' : 'text-chef'}`}
      >
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-xl border overflow-hidden ${
                dark ? 'border-white/10 bg-white/[0.04]' : 'border-steel/80 bg-white'
              }`}
            >
              <button
                type="button"
                id={`faq-btn-${item.id}`}
                aria-expanded={open}
                aria-controls={`faq-panel-${item.id}`}
                onClick={() => setOpenId(open ? null : item.id)}
                className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold min-h-[52px] ${
                  dark ? 'text-white hover:bg-white/5' : 'text-chef hover:bg-stainless-50'
                }`}
              >
                {item.question}
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-white/50' : 'text-chef-subtle'}`}
                />
              </button>
              <div
                id={`faq-panel-${item.id}`}
                role="region"
                aria-labelledby={`faq-btn-${item.id}`}
                hidden={!open}
                className={`px-5 pb-4 text-sm leading-relaxed ${dark ? 'text-white/65' : 'text-chef-subtle'}`}
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
