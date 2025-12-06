import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Comments from '../components/Comments';
import './PostDetail.css';

const PostDetail = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/posts/${slug}`);
      setPost(response.data);
      setFollowing(response.data.isFollowing);

      // Fetch tags for this post
      if (response.data.id) {
        const tagsResponse = await api.get(`/api/tags/post/${response.data.id}`);
        setTags(tagsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated()) {
      alert('Please login to follow posts');
      return;
    }

    try {
      const response = await api.post(`/api/posts/${post.id}/follow`);
      setFollowing(response.data.following);
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Failed to update follow status');
    }
  };

  const handleDownload = async (attachmentId) => {
    window.open(`http://localhost:3000/api/upload/attachment/${attachmentId}`, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const groupAttachments = () => {
    if (!post?.attachments) return { translated: [], original: [], images: [], other: [] };

    return post.attachments.reduce((acc, att) => {
      if (att.attachment_type === 'translated') acc.translated.push(att);
      else if (att.attachment_type === 'original') acc.original.push(att);
      else if (att.attachment_type === 'image') acc.images.push(att);
      else acc.other.push(att);
      return acc;
    }, { translated: [], original: [], images: [], other: [] });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container">
        <div className="error-message">{error || 'Post not found'}</div>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  const attachments = groupAttachments();

  return (
    <div className="post-detail">
      <div className="container">
        <div className="post-header">
          {post.thumbnail_url && (
            <div className="post-thumbnail">
              <img src={post.thumbnail_url} alt={post.title} />
            </div>
          )}

          <div className="post-title-section">
            <div className="post-badges">
              {post.is_translated ? (
                <span className="badge badge-success">Translated</span>
              ) : (
                <span className="badge badge-warning">Not Translated</span>
              )}
              <span className="badge badge-info">{post.category_name}</span>
            </div>

            <h1>{post.title}</h1>

            <div className="post-meta">
              <div className="post-author">
                {post.author_avatar && (
                  <img src={post.author_avatar} alt={post.author_name} />
                )}
                <span>By {post.author_name}</span>
              </div>
              <span>Updated: {formatDate(post.updated_at)}</span>
            </div>

            {isAuthenticated() && (
              <button
                onClick={handleFollow}
                className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`}
              >
                {following ? 'Unfollow' : 'Follow for Updates'}
              </button>
            )}
          </div>
        </div>

        {post.description && (
          <div className="post-description">
            <h2>Description</h2>
            <p>{post.description}</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="post-section tags-section">
            <h2>Tags</h2>
            <div className="tags-container">
              {tags.filter(tag => tag.type_slug === 'platform').length > 0 && (
                <div className="tag-type-group">
                  <h3>Platform</h3>
                  <div className="tags-list">
                    {tags.filter(tag => tag.type_slug === 'platform').map(tag => (
                      <Link
                        key={tag.id}
                        to={`/search?platform=${tag.slug}`}
                        className="tag tag-platform"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {tags.filter(tag => tag.type_slug === 'genre').length > 0 && (
                <div className="tag-type-group">
                  <h3>Genre</h3>
                  <div className="tags-list">
                    {tags.filter(tag => tag.type_slug === 'genre').map(tag => (
                      <Link
                        key={tag.id}
                        to={`/search?genre=${tag.slug}`}
                        className="tag tag-genre"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {tags.filter(tag => tag.type_slug === 'fetish').length > 0 && (
                <div className="tag-type-group">
                  <h3>Fetish</h3>
                  <div className="tags-list">
                    {tags.filter(tag => tag.type_slug === 'fetish').map(tag => (
                      <Link
                        key={tag.id}
                        to={`/search?fetish=${tag.slug}`}
                        className="tag tag-fetish"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {post.content && (
          <div className="post-content">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        )}

        {/* Versions */}
        {post.versions && post.versions.length > 0 && (
          <div className="post-section">
            <h2>Version History</h2>
            <div className="versions-list">
              {post.versions.map((version) => (
                <div key={version.id} className="version-item">
                  <div className="version-header">
                    <span className="version-number">v{version.version_number}</span>
                    <span className="version-date">{formatDate(version.created_at)}</span>
                  </div>
                  {version.changelog && (
                    <p className="version-changelog">{version.changelog}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downloads - Translated */}
        {attachments.translated.length > 0 && (
          <div className="post-section downloads-section">
            <h2>Download - Translated Version</h2>
            <div className="attachments-list">
              {attachments.translated.map((att) => (
                <div key={att.id} className="attachment-item">
                  <div className="attachment-info">
                    <div className="attachment-icon">📦</div>
                    <div>
                      <div className="attachment-name">{att.original_filename}</div>
                      <div className="attachment-meta">
                        {formatFileSize(att.file_size)}
                        {att.description && ` • ${att.description}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(att.id)}
                    className="btn btn-success"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downloads - Original */}
        {attachments.original.length > 0 && (
          <div className="post-section downloads-section">
            <h2>Download - Original (Japanese)</h2>
            <div className="attachments-list">
              {attachments.original.map((att) => (
                <div key={att.id} className="attachment-item">
                  <div className="attachment-info">
                    <div className="attachment-icon">📦</div>
                    <div>
                      <div className="attachment-name">{att.original_filename}</div>
                      <div className="attachment-meta">
                        {formatFileSize(att.file_size)}
                        {att.description && ` • ${att.description}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(att.id)}
                    className="btn btn-secondary"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External Download Links */}
        {post.external_links && post.external_links.length > 0 && (
          <div className="post-section external-links-section">
            <h2>Alternative Download Links</h2>
            <div className="external-links-list">
              {post.external_links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link-button"
                >
                  <span className="link-icon">🔗</span>
                  <span className="link-label">{link.label}</span>
                  <span className="link-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        {attachments.images.length > 0 && (
          <div className="post-section">
            <h2>Screenshots</h2>
            <div className="images-grid">
              {attachments.images.map((att) => (
                <div key={att.id} className="image-item">
                  <img
                    src={`http://localhost:3000${att.file_path.replace(/\\/g, '/').split('uploads')[1] ? '/uploads' + att.file_path.replace(/\\/g, '/').split('uploads')[1] : ''}`}
                    alt={att.description || att.original_filename}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="post-section">
          <h2>Comments</h2>
          <Comments postId={post.id} />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
