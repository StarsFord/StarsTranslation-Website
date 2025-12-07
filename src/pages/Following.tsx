import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Following.css';

interface Post {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  category_name: string;
  author_name: string;
  is_translated: boolean;
  updated_at: string;
  latest_version: string;
}

const Following = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchFollowingPosts();
    }
  }, []);

  const fetchFollowingPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/posts/following');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching following posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (postId: number) => {
    try {
      await api.post(`/api/posts/${postId}/follow`);
      fetchFollowingPosts();
    } catch (error) {
      console.error('Error unfollowing post:', error);
      alert('Failed to unfollow post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="following-page">
      <div className="container">
        <div className="following-header">
          <h1>Following</h1>
          <p>Posts you're following for updates</p>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="no-following">
            <div className="empty-state">
              <span className="empty-icon">📌</span>
              <h2>You're not following any posts yet</h2>
              <p>Start following posts to get notified about updates and new versions</p>
              <Link to="/" className="btn btn-primary">
                Browse Posts
              </Link>
            </div>
          </div>
        ) : (
          <div className="following-grid">
            {posts.map((post) => (
              <div key={post.id} className="following-card">
                <Link to={`/post/${post.slug}`} className="card-link">
                  {post.thumbnail_url && (
                    <div className="card-thumbnail">
                      <img src={post.thumbnail_url} alt={post.title} />
                    </div>
                  )}
                  <div className="card-content">
                    <div className="card-badges">
                      {post.is_translated && (
                        <span className="badge badge-translated">Translated</span>
                      )}
                      <span className="badge badge-category">{post.category_name}</span>
                    </div>
                    <h3>{post.title}</h3>
                    {post.description && (
                      <p className="card-description">{post.description}</p>
                    )}
                    <div className="card-meta">
                      <span className="author">By {post.author_name}</span>
                      <span className="date">Updated: {formatDate(post.updated_at)}</span>
                      {post.latest_version && (
                        <span className="version">v{post.latest_version}</span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="card-actions">
                  <button
                    onClick={() => handleUnfollow(post.id)}
                    className="btn btn-secondary btn-small"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Following;
