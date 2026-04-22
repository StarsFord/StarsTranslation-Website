const DEFAULT_SITE_URL = 'https://stars-translation-website.vercel.app';
const DEFAULT_API_URL = 'https://starstranslations-backend-805236256394.us-central1.run.app';

const normalizeUrl = (url, fallback) => {
  const trimmed = (url || '').trim();
  const resolved = trimmed || fallback;
  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
};

const xmlEscape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const isIsoDate = (value) => value && !Number.isNaN(Date.parse(value));

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
};

export const resolveSeoConfig = () => {
  const siteUrl = normalizeUrl(
    process.env.VITE_SITE_URL || process.env.SITE_URL,
    DEFAULT_SITE_URL
  );
  const apiUrl = normalizeUrl(
    process.env.SITEMAP_API_URL || process.env.VITE_API_URL || process.env.BACKEND_URL,
    DEFAULT_API_URL
  );

  return { siteUrl, apiUrl };
};

export const buildRobots = (siteUrl) => `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

export const buildSitemap = async () => {
  const { siteUrl, apiUrl } = resolveSeoConfig();
  const generatedAt = new Date().toISOString();

  let posts = [];
  let categories = [];

  try {
    const [rawPosts, rawCategories] = await Promise.all([
      fetchJson(`${apiUrl}/api/posts?limit=10000&offset=0`),
      fetchJson(`${apiUrl}/api/categories`),
    ]);

    posts = Array.isArray(rawPosts) ? rawPosts : [];
    categories = Array.isArray(rawCategories) ? rawCategories : [];
  } catch (error) {
    console.warn('[SEO] Failed to fetch posts/categories for dynamic sitemap:', error.message);
  }

  const staticRoutes = ['/', '/search', '/partners'];
  const staticUrls = staticRoutes.map(
    (route) => `  <url>
    <loc>${xmlEscape(`${siteUrl}${route}`)}</loc>
    <lastmod>${generatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
  </url>`
  );

  const categoryUrls = categories
    .filter((category) => category && category.slug)
    .map((category) => String(category.slug))
    .map(
      (slug) => `  <url>
    <loc>${xmlEscape(`${siteUrl}/category/${slug}`)}</loc>
    <lastmod>${generatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
    );

  const postUrls = posts
    .filter((post) => post && post.slug)
    .map((post) => {
      const updatedAt = isIsoDate(post.updated_at) ? new Date(post.updated_at).toISOString() : generatedAt;
      return `  <url>
    <loc>${xmlEscape(`${siteUrl}/post/${post.slug}`)}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...categoryUrls, ...postUrls].join('\n')}
</urlset>
`;
};
