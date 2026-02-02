export interface Attachment {
  id: number;
  post_id: number;
  version_id: number | null;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  attachment_type: 'translated' | 'original' | 'image';
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  tag_type_id: number;
  name: string;
  slug: string;
  type_name: string;
  type_slug: string;
  description: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ExternalLink {
  label: string;
  url: string;
}

export interface PostFormData {
  title: string;
  slug: string;
  description: string;
  content: string;
  category_id: string;
  is_translated: boolean;
  thumbnail_url: string;
}

export interface SelectedTags {
  platforms: number[];
  genres: number[];
  fetishes: number[];
}

export interface Files {
  translated: File[];
  original: File[];
  images: File[];
}

export interface VersionData {
  version_number: string;
  changelog: string;
}

export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
  percentage: number;
}

export interface TagType {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface UploadProgressProps {
  current: number;
  total: number;
  fileName: string;
  percentage: number;
}

export interface PendingPost {
  id: number;
  title: string;
  slug: string;
  description: string;
  category_name: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
  status: string;
}

export interface PostData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  thumbnail_url: string | null;
  is_translated: number;
  category_name: string;
  author_name: string;
  author_avatar: string | null;
  updated_at: string;
  isFollowing: boolean;
  attachments?: Attachment[];
  versions?: any[];
  comment_count?: number;
  latest_version?: string | null;
  external_links?: ExternalLink[];
}

export interface PostCardData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  is_translated: number;
  category_name: string;
  author_name: string;
  author_avatar: string | null;
  latest_version?: string | null;
  updated_at: string;
  comment_count?: number;
}

export interface PostCardProps {
  post: PostCardData;
}

export interface CommentData {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  username: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  replies?: CommentData[];
}

export interface CommentProps {
  comment: CommentData;
  onReply: () => void;
  onEdit: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  postId?: number;
}

export interface CommentsProps {
  postId: number;
}

export interface CommentFormProps {
  postId: number;
  parentId?: number | null;
  onSubmit: () => void;
  onCancel?: () => void;
}

export interface GroupedAttachments {
  translated: Attachment[];
  original: Attachment[];
  images: Attachment[];
  other: Attachment[];
}