import { useEffect } from 'react';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/content/marketingContent';

export interface PageMetaProps {
  title: string;
  description?: string;
  /** Path only, e.g. /pricing */
  path?: string;
  /** Disable indexing for draft/404 pages */
  noindex?: boolean;
  /** FAQ items for JSON-LD */
  faq?: { question: string; answer: string }[];
}

const DEFAULT_DESCRIPTION =
  'SousChef — Your kitchen has a memory. Track inventory, plan meals from your pantry, and cook with Clara, your AI sous chef.';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function PageMeta({ title, description, path, noindex, faq }: PageMetaProps) {
  const desc = description ?? DEFAULT_DESCRIPTION;
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:image', `${SITE_URL}/og-image.png`);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', `${SITE_URL}/og-image.png`);
    upsertLink('canonical', url);

    upsertJsonLd('jsonld-org', {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      description: SITE_TAGLINE,
      url: SITE_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    });

    if (faq?.length) {
      upsertJsonLd('jsonld-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      });
    } else {
      document.getElementById('jsonld-faq')?.remove();
    }

    return () => {
      document.getElementById('jsonld-faq')?.remove();
    };
  }, [fullTitle, desc, url, noindex, faq]);

  return null;
}
