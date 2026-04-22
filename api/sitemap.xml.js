import { buildSitemap } from './_seo.js';

export default async function handler(req, res) {
  const sitemap = await buildSitemap();

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
  res.status(200).send(sitemap);
}
