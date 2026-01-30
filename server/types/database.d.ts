export interface User {
  id: number;
  patreon_id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: 'admin' | 'translator' | 'user';
  access_token: string | null;
  refresh_token: string | null;
  is_banned: number;
  ban_reason: string | null;
  ban_expires_at: string | null;
  banned_at: string | null;
  banned_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  category_id: number;
  author_id: number;
  thumbnail_url: string | null;
  is_translated: number;
  external_links: string | null; // JSON string
  status: 'pending' | 'published' | 'rejected';
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithDetails extends Post {
  category_name: string;
  category_slug: string;
  author_name: string;
  author_avatar: string | null;
  comment_count: number;
  latest_version: string | null;
}

export interface PostVersion {
  id: number;
  post_id: number;
  version_number: string;
  changelog: string | null;
  created_by: number;
  created_at: string;
}

export interface Attachment {
  id: number;
  post_id: number;
  version_id: number | null;
  filename: string;
  original_filename: string;
  file_path: string; // Cloud Storage URL
  file_size: number;
  mime_type: string;
  attachment_type: 'translated' | 'original' | 'image';
  description: string | null;
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

export interface CommentWithUser extends Comment {
  username: string;
  avatar_url: string | null;
  user_role: string;
}

export interface PostFollower {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

export interface TagType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  tag_type_id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface TagWithType extends Tag {
  type_name: string;
  type_slug: string;
}

export interface PostTag {
  post_id: number;
  tag_id: number;
  created_at: string;
}

export interface DatabaseMethods {
  prepare(sql: string): {
    run(...params: any[]): { lastInsertRowid: number; changes: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
    free(): void;
  };
  exec(sql: string): void;
}

export interface Database extends DatabaseMethods {
  close(): void;
}

// API Request/Response types
export interface CreatePostRequest {
  title: string;
  slug: string;
  description?: string;
  content?: string;
  category_id: number;
  is_translated: boolean;
  thumbnail_url?: string;
  external_links?: Array<{ label: string; url: string }>;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: number;
}

export interface CreateCommentRequest {
  post_id: number;
  content: string;
  parent_id?: number;
}

export interface BanUserRequest {
  reason: string;
  duration?: number; // days, null for permanent
}

export interface ApproveRejectPostRequest {
  reason?: string;
}
