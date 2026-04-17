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
    logo: '',
    category: 'Downloads Platform',
  },
  {
    name: 'Hentai Games and +18 chat',
    url: 't.me/hentai69chat',
    description: "A Discord server focused on sharing and discussing adult games, doujin, manga and anime, with a welcoming community for fans of the genre.",
    logo: '',
    category: 'Community',
  }
];
