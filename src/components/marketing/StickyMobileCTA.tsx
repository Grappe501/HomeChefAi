import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { appEntryPath } from '@/lib/siteNav';

interface StickyMobileCTAProps {
  dark?: boolean;
  label?: string;
}

/** Fixed bottom CTA on mobile — sits above safe area, hidden on md+ */
export function StickyMobileCTA({ dark, label }: StickyMobileCTAProps) {
  const { user } = useApp();
  const navigate = useNavigate();
  const text = label ?? (user ? 'Open your kitchen' : 'Start free — no card required');

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-4 py-3 safe-area-pb ${
        dark ? 'border-white/10 bg-chef/95 backdrop-blur-xl' : 'border-steel bg-white/95 backdrop-blur-xl'
      }`}
    >
      <button
        type="button"
        onClick={() => navigate(appEntryPath(!!user))}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold min-h-[52px] ${
          dark ? 'bg-white text-chef hover:bg-stainless-100' : 'bg-chef text-white hover:bg-chef-muted'
        }`}
      >
        {text}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
