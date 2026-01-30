import React from 'react';
import { Link } from 'react-router-dom';
import './PostCard.css';

interface PostCardData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  is_translated: number;
  category_name: string;
  author_name: string;
  author_avatar: string | null;
  latest_version: string | null;
  updated_at: string;
  comment_count: number;
}

interface PostCardProps {
  post: PostCardData;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="post-card">
      {post.thumbnail_url && (
        <div className="post-card-image">
          <img src={post.thumbnail_url} alt={post.title} />
          <div className="post-card-badges">
            {post.is_translated ? (
              <span className="badge badge-success">Translated</span>
            ) : (
              <span className="badge badge-warning">Not Translated</span>
            )}
            <span className="badge badge-info">{post.category_name}</span>
          </div>
        </div>
      )}

      <div className="post-card-content">
        <h3 className="post-card-title">
          <Link to={`/post/${post.slug}`}>{post.title}</Link>
        </h3>

        {post.description && (
          <p className="post-card-description">{post.description}</p>
        )}

        <div className="post-card-meta">
          <div className="post-card-author">
            {post.author_avatar && (
              <img src={post.author_avatar} alt={post.author_name} className="author-avatar" />
            )}
            <span>{post.author_name}</span>
          </div>

          <div className="post-card-info">
            {post.latest_version && (
              <span className="post-version">v{post.latest_version}</span>
            )}
            <span className="post-date">{formatDate(post.updated_at)}</span>
            {post.comment_count > 0 && (
              <span className="post-comments">{post.comment_count} comments</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
