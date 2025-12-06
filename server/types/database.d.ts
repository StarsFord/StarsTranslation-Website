export interface User {
  id: number;
  patreon_id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: 'admin' | 'translator' | 'user';
  access_token: string | null;
  refresh_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  category: string;
  subcategory: string | null;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  author_id: number;
  status: 'draft' | 'published';
  is_translated: boolean;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface PostVersion {
  id: number;
  post_id: number;
  version: string;
  content: string;
  change_notes: string | null;
  created_at: string;
}

export interface Attachment {
  id: number;
  post_id: number;
  type: 'translated' | 'original';
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMethods {
  prepare(sql: string): {
    run(...params: any[]): { lastInsertRowid: number; changes: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  };
}

export interface Database extends DatabaseMethods {
  close(): void;
}
