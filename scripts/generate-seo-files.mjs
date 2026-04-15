import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

const normalizeSiteUrl = (url) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return 'http://localhost:5173';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const siteUrl = normalizeSiteUrl(process.env.VITE_SITE_URL);
const apiUrl = normalizeSiteUrl(
  process.env.VITE_API_URL || process.env.BACKEND_URL || 'http://localhost:3000'
);
const now = new Date().toISOString();

const staticRoutes = ['/', '/search'];

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

const generateSitemap = async () => {
  const posts = await fetchPublishedPosts();

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

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls].join('\n')}
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
