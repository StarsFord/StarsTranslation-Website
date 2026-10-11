const DOWNLOAD_HOST_LABELS: Record<string, string> = {
  'pixeldrain.com': 'PixelDrain',
  'mediafire.com': 'MediaFire',
  'workupload.com': 'WorkUpload',
  'modsfire.com': 'ModsFire',
  'gofile.io': 'GoFile',
  'mega.io': 'MEGA',
  'mega.nz': 'MEGA',
  'drive.google.com': 'Google Drive',
  'dropbox.com': 'Dropbox',
  'onedrive.live.com': 'OneDrive',
  '1fichier.com': '1fichier',
  'catbox.moe': 'Catbox',
  'krakenfiles.com': 'KrakenFiles',
  'buzzheavier.com': 'Buzzheavier',
  'send.cm': 'Send.cm',
};

const COUNTRY_CODE_SECOND_LEVEL_DOMAINS = new Set([
  'co',
  'com',
  'net',
  'org',
]);

const toReadableLabel = (domainPart: string): string => {
  return domainPart
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const inferDownloadLinkLabel = (directUrl: string): string => {
  const trimmedUrl = directUrl.trim();

  if (!trimmedUrl) {
    return '';
  }

  try {
    const normalizedUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;
    const hostname = new URL(normalizedUrl).hostname.toLowerCase().replace(/^www\./, '');

    if (!hostname.includes('.')) {
      return '';
    }

    const knownHost = Object.keys(DOWNLOAD_HOST_LABELS).find(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );

    if (knownHost) {
      return DOWNLOAD_HOST_LABELS[knownHost];
    }

    const parts = hostname.split('.').filter(Boolean);
    const hasCountryCodeSecondLevelDomain =
      parts.length >= 3 &&
      parts.at(-1)?.length === 2 &&
      COUNTRY_CODE_SECOND_LEVEL_DOMAINS.has(parts.at(-2) || '');
    const domainPart = hasCountryCodeSecondLevelDomain ? parts.at(-3) : parts.at(-2);

    return domainPart ? toReadableLabel(domainPart) : '';
  } catch {
    return '';
  }
};
