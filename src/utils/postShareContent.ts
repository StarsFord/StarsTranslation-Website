import { PostData, Tag } from '../types/post';

export interface ShareImage {
  label: string;
  url: string;
  alt: string;
}

export interface PostShareInput {
  post: PostData;
  tags: Tag[];
  postUrl: string;
  images: ShareImage[];
}

export interface RichShareContent {
  html: string;
  text: string;
}

const ROSETTA_GAMING_URL = 'https://github.com/StarsFord/Roseta-Gaming';
const JOIPLAY_URL = 'https://t.me/nsfwhgames/519';

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const originalSiteLabel = (originalLink: string | null): string => {
  if (!originalLink) return 'Original';

  try {
    const hostname = new URL(originalLink).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname.endsWith('dlsite.com')) return 'DLsite';
    if (hostname.endsWith('fanza.co.jp') || hostname.endsWith('dmm.co.jp')) return 'FANZA';
    if (hostname.endsWith('steamcommunity.com') || hostname.endsWith('steampowered.com')) return 'Steam';
    if (hostname.endsWith('itch.io')) return 'itch.io';

    const domainPart = hostname.split('.')[0];
    return domainPart ? domainPart.charAt(0).toUpperCase() + domainPart.slice(1) : 'Original';
  } catch {
    return 'Original';
  }
};

const tagGroups = (tags: Tag[]): Array<{ label: string; values: string[] }> => {
  const groups = [
    { type: 'platform', label: 'Platforms' },
    { type: 'genre', label: 'Genres' },
    { type: 'fetish', label: 'Tags' },
  ];

  return groups
    .map(({ type, label }) => ({
      label,
      values: tags.filter((tag) => tag.type_slug === type).map((tag) => tag.name),
    }))
    .filter((group) => group.values.length > 0);
};

const descriptionParagraphs = (description: string | null): string[] => {
  return (description || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

const platformRecommendationMarkdown = (tags: Tag[]): string[] => {
  const platforms = tags
    .filter((tag) => tag.type_slug === 'platform')
    .map((tag) => tag.name);

  if (platforms.length === 0) return [];

  const lines = [`*This work is produced for ${platforms.join(' / ')}.*`];
  const supportsAndroidEmulators = platforms.some((platform) => /rpg maker/i.test(platform));

  if (supportsAndroidEmulators) {
    lines.push(
      `*We recommend playing through our emulator [Rosetta Gaming](${ROSETTA_GAMING_URL}) or [JoiPlay](${JOIPLAY_URL}).*`,
    );
  }

  return lines;
};

export const buildTelegramShareText = ({ post, tags, postUrl, images }: PostShareInput): string => {
  const lines: string[] = [
    '**New game Translated!!**',
    '',
    `***${post.title}***`,
  ];

  if (post.developer) lines.push(`Developer: **${post.developer}**`);
  if (post.original_title) lines.push(`Original title: *${post.original_title}*`);

  const translatedLink = `[StarsTranslations](${postUrl})`;
  if (post.original_link) {
    lines.push(`Raw: [${originalSiteLabel(post.original_link)}](${post.original_link}) | Translated: ${translatedLink}`);
  } else {
    lines.push(`Translated: ${translatedLink}`);
  }

  const paragraphs = descriptionParagraphs(post.description);
  if (paragraphs.length > 0) lines.push('', ...paragraphs.flatMap((paragraph) => [paragraph, '']));

  tagGroups(tags).forEach((group) => {
    lines.push(`**${group.label}:** ${group.values.join(', ')}`);
  });

  const recommendation = platformRecommendationMarkdown(tags);
  if (recommendation.length > 0) lines.push('', ...recommendation);

  if (images.length > 0) {
    lines.push('', '**Images:**', ...images.map((image) => `[${image.label}](${image.url})`));
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

export const buildSupporterShareContent = ({ post, tags, postUrl, images }: PostShareInput): RichShareContent => {
  const groups = tagGroups(tags);
  const paragraphs = descriptionParagraphs(post.description);
  const originalLabel = originalSiteLabel(post.original_link);
  const metadataText = [
    post.developer ? `Developer: ${post.developer}` : '',
    post.original_title ? `Original title: ${post.original_title}` : '',
    post.original_link ? `Raw: ${originalLabel} — ${post.original_link}` : '',
    `Translated: StarsTranslations — ${postUrl}`,
  ].filter(Boolean);
  const tagText = groups.map((group) => `${group.label}: ${group.values.join(', ')}`);
  const imageText = images.map((image) => `${image.label}: ${image.url}`);
  const text = [
    'New Game Translated!',
    post.title,
    ...metadataText,
    '',
    ...paragraphs.flatMap((paragraph) => [paragraph, '']),
    ...tagText,
    ...(imageText.length > 0 ? ['', 'Images:', ...imageText] : []),
  ].join('\n').replace(/\n{3,}/g, '\n\n').trim();

  const metadataHtml = [
    post.developer ? `<p><strong>Developer:</strong> ${escapeHtml(post.developer)}</p>` : '',
    post.original_title ? `<p><strong>Original title:</strong> <em>${escapeHtml(post.original_title)}</em></p>` : '',
    post.original_link
      ? `<p><strong>Raw:</strong> <a href="${escapeHtml(post.original_link)}">${escapeHtml(originalLabel)}</a></p>`
      : '',
    `<p><strong>Translated:</strong> <a href="${escapeHtml(postUrl)}">StarsTranslations</a></p>`,
  ].filter(Boolean).join('');
  const descriptionHtml = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
  const tagsHtml = groups
    .map((group) => `<p><strong>${group.label}:</strong> ${group.values.map(escapeHtml).join(', ')}</p>`)
    .join('');
  const imagesHtml = images.length > 0
    ? `<h3>Images</h3>${images.map((image) => `<figure><img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt)}"><figcaption>${escapeHtml(image.label)}</figcaption></figure>`).join('')}`
    : '';

  return {
    text,
    html: `<article><h2>New Game Translated!</h2><h1>${escapeHtml(post.title)}</h1>${metadataHtml}${descriptionHtml}${tagsHtml}${imagesHtml}</article>`,
  };
};
