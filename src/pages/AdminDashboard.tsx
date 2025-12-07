import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { isTranslator, isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/posts', { params: { limit: 100 } });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/api/posts/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  if (!isTranslator()) {
    return <Navigate to="/" />;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            {isAdmin() && (
              <Link to="/admin/users" className="btn btn-secondary">
                Manage Users
              </Link>
            )}
            <Link to="/admin/tags" className="btn btn-secondary">
              Manage Tags
            </Link>
            <Link to="/admin/post/new" className="btn btn-primary">
              Create New Post
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="admin-posts-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Comments</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link to={`/post/${post.slug}`} className="post-title-link">
                        {post.title}
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge-info">{post.category_name}</span>
                    </td>
                    <td>
                      {post.is_translated ? (
                        <span className="badge badge-success">Translated</span>
                      ) : (
                        <span className="badge badge-warning">Not Translated</span>
                      )}
                    </td>
                    <td>{post.comment_count || 0}</td>
                    <td>{formatDate(post.updated_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/admin/post/edit/${post.id}`} className="btn btn-secondary btn-sm">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {posts.length === 0 && (
              <div className="no-posts">
                <p>No posts yet. Create your first post!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
