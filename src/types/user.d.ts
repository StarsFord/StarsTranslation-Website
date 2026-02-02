export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: 'admin' | 'translator' | 'user';
  patron_tier?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  role: string;
  is_banned: boolean;
  ban_reason: string | null;
  ban_expires_at: string | null;
  created_at: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isTranslator: () => boolean;
  isAuthenticated: () => boolean;
}