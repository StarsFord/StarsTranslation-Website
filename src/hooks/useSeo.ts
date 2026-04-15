import { useEffect } from 'react';

type JsonLd = Record<string, unknown> | null;

interface SeoConfig {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'article';
  robots?: string;
  keywords?: string;
  jsonLd?: JsonLd;
}

const DEFAULT_SITE_NAME = 'StarsTranslations';

const normalizeSiteUrl = (siteUrl: string): string => {
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
};

const getSiteUrl = (): string => {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return normalizeSiteUrl(fromEnv.trim());
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};

const buildAbsoluteUrl = (urlOrPath?: string): string => {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }

  const siteUrl = getSiteUrl();
  if (!siteUrl) return urlOrPath;

  const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${siteUrl}${path}`;
};

const upsertMeta = (
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void => {
  if (!content) return;

  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${attrValue}"]`
  );

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
};

const upsertCanonical = (href: string): void => {
  if (!href) return;

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
};

const upsertJsonLd = (data: JsonLd): void => {
  const scriptId = 'seo-structured-data';
  const existing = document.getElementById(scriptId);

  if (!data) {
    existing?.remove();
    return;
  }

  const json = JSON.stringify(data);
  if (existing) {
    existing.textContent = json;
    return;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.type = 'application/ld+json';
  script.textContent = json;
  document.head.appendChild(script);
};

export const useSeo = ({
  title,
  description,
  canonicalPath,
  image,
  type = 'website',
  robots = 'index, follow',
  keywords,
  jsonLd = null,
}: SeoConfig): void => {
  useEffect(() => {
    const fullTitle = title.includes(DEFAULT_SITE_NAME)
      ? title
      : `${title} | ${DEFAULT_SITE_NAME}`;
    const canonicalUrl = buildAbsoluteUrl(canonicalPath || window.location.pathname);
    const imageUrl = buildAbsoluteUrl(image || '/vite.svg');

    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);

    if (keywords) {
      upsertMeta('name', 'keywords', keywords);
    }

    upsertMeta('property', 'og:site_name', DEFAULT_SITE_NAME);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'og:locale', 'en_US');
    upsertCanonical(canonicalUrl);
    upsertJsonLd(jsonLd);
  }, [title, description, canonicalPath, image, type, robots, keywords, jsonLd]);
};
