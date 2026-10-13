// ============================================================
//  PARCEIROS — edite este arquivo para adicionar/remover sites
// ============================================================
//
//  Campos:
//    name        — nome do grupo/site (obrigatório)
//    url         — link externo (obrigatório)
//    description — descrição curta exibida no card (obrigatório)
//    logo        — URL da imagem/logo (opcional — use string vazia para sem logo)
//    category    — ex: "Translation Group", "Visual Novel", "Manga" (opcional)
//
// ============================================================

export interface Partner {
  name: string;
  url: string;
  description: string;
  logo?: string;
  category?: string;
}

export interface SocialLink {
  name: string;
  url: string;
  description: string;
  shortLabel: string;
  callToAction: string;
  accent: string;
}

export const socials: SocialLink[] = [
  {
    name: 'Telegram',
    url: 'https://t.me/nsfwerogames',
    description: 'Follow our official channel for new translations, project updates, and announcements.',
    shortLabel: 'TG',
    callToAction: 'Join the channel',
    accent: '#229ed9',
  },
  {
    name: 'Discord',
    url: 'https://discord.gg/k5d5X485mM',
    description: 'Join the StarsTranslations community to chat, share feedback, and follow our projects.',
    shortLabel: 'DS',
    callToAction: 'Join the server',
    accent: '#5865f2',
  },
  {
    name: 'Reddit',
    url: 'https://www.reddit.com/r/StarstransEroGames/',
    description: 'Find releases, discussions, and updates from StarsTranslations on Reddit.',
    shortLabel: 'RD',
    callToAction: 'Visit the subreddit',
    accent: '#ff4500',
  },
  {
    name: 'Patreon',
    url: 'https://www.patreon.com/cw/StarsTranslations',
    description: 'Support our translation work and receive the benefits available to Patreon members.',
    shortLabel: 'PT',
    callToAction: 'Support on Patreon',
    accent: '#ff424d',
  },
  {
    name: 'SubscribeStar',
    url: 'https://subscribestar.adult/starsford',
    description: 'Support StarsTranslations through SubscribeStar and help us keep releasing new projects.',
    shortLabel: 'SS',
    callToAction: 'Support on SubscribeStar',
    accent: '#f4a51c',
  },
];

export const partners: Partner[] = [
  // ── Adicione novos parceiros aqui ───────────────────────────
  // {
  //   name: 'Nome do Parceiro',
  //   url: 'https://site-parceiro.com',
  //   description: 'Descrição curta do que o grupo faz.',
  //   logo: 'https://site-parceiro.com/logo.png',
  //   category: 'Translation Group',
  // },
  {
    name: 'hentaiKuni',
    url: 'https://hentaikuni.com/',
    description: "HentaiKuni it's a platform for downloading adult anime, CGs, doujins and mangás, focusing mostly on lolicon and shotacon niche.",
    logo: 'https://hentaikuni.com/favicon.ico',
    category: 'Downloads Platform',
  }, 
  {
    name: 'DoujinBlog',
    url: 'https://doujinblog.org/',
    description: "DoujinBlog it's a platform focused on adult games, doujin and idols appreciations mostly on JP content, broading niche access to a wider audience.",
    logo: 'https://doujinblog.org/favicon.ico',
    category: 'Downloads Platform',
  },
  {
    name: 'Velvet Dinasty',
    url: 'https://t.me/HentaiDinasty',
    description: 'A Telegram community for sharing Pixiv posts, doujinshi, artwork, and conversations with fellow fans.',
    logo: '',
    category: 'Community',
  },
  {
    name: 'Hentai Games and +18 chat',
    url: 'https://t.me/hentai69chat',
    description: "A telegram server focused on sharing and discussing adult games, doujin, manga and anime, with a welcoming community for fans of the genre.",
    logo: '',
    category: 'Community',
  }
];
