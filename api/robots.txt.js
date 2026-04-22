import { buildRobots, resolveSeoConfig } from './_seo.js';

export default function handler(req, res) {
  const { siteUrl } = resolveSeoConfig();
  const robots = buildRobots(siteUrl);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
  res.status(200).send(robots);
}
