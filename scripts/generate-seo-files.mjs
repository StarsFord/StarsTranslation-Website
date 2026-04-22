import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const DEFAULT_SITE_URL = 'https://stars-translation-website.vercel.app';
const DEFAULT_API_URL = 'https://starstranslations-backend-805236256394.us-central1.run.app';

const normalizeSiteUrl = (url) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return DEFAULT_SITE_URL;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const siteUrl = normalizeSiteUrl(process.env.VITE_SITE_URL);
const apiUrl = normalizeSiteUrl(
  process.env.VITE_API_URL || process.env.BACKEND_URL || process.env.SITEMAP_API_URL || DEFAULT_API_URL
);
const now = new Date().toISOString();

const staticRoutes = ['/', '/search', '/partners'];

const xmlEscape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const isIsoDate = (value) => {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
};

const fetchPublishedPosts = async () => {
  const endpoint = `${apiUrl}/api/posts?limit=10000&offset=0`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      console.warn(`Could not fetch posts for sitemap (${response.status}) from ${endpoint}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((post) => post && post.slug)
      .map((post) => ({
        slug: String(post.slug),
        updatedAt: isIsoDate(post.updated_at) ? new Date(post.updated_at).toISOString() : now,
      }));
  } catch (error) {
    console.warn(`Could not fetch posts for sitemap from ${endpoint}:`, error.message);
    return [];
  }
};

const fetchCategories = async () => {
  const endpoint = `${apiUrl}/api/categories`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      console.warn(`Could not fetch categories for sitemap (${response.status}) from ${endpoint}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((category) => category && category.slug)
      .map((category) => String(category.slug));
  } catch (error) {
    console.warn(`Could not fetch categories for sitemap from ${endpoint}:`, error.message);
    return [];
  }
};

const generateSitemap = async () => {
  const [posts, categories] = await Promise.all([fetchPublishedPosts(), fetchCategories()]);

  const staticUrls = staticRoutes.map(
    (route) => `  <url>
    <loc>${xmlEscape(`${siteUrl}${route}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
  </url>`
  );

  const postUrls = posts.map(
    (post) => `  <url>
    <loc>${xmlEscape(`${siteUrl}/post/${post.slug}`)}</loc>
    <lastmod>${post.updatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  );

  const categoryUrls = categories.map(
    (categorySlug) => `  <url>
    <loc>${xmlEscape(`${siteUrl}/category/${categorySlug}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...categoryUrls, ...postUrls].join('\n')}
</urlset>
`;
};

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

const main = async () => {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemap = await generateSitemap();
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');

  console.log(`SEO files generated for ${siteUrl}`);
};

await main();
