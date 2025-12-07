import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './UsersManagement.css';

interface User {
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

interface PendingPost {
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

const UsersManagement = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'pending'>('users');

  // Ban modal state
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<number | ''>('');

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchPendingPosts();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/pending-posts');
      setPendingPosts(response.data);
    } catch (error) {
      console.error('Error fetching pending posts:', error);
      alert('Failed to fetch pending posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      await api.put(`/api/users/${userId}/role`, { role: newRole });
      fetchUsers();
      alert('Role updated successfully!');
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.error || 'Failed to update role');
    }
  };

  const openBanModal = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    setBanDuration('');
    setShowBanModal(true);
  };

  const handleBan = async () => {
    if (!selectedUser) return;

    try {
      await api.post(`/api/users/${selectedUser.id}/ban`, {
        reason: banReason,
        duration: banDuration || null
      });
      setShowBanModal(false);
      fetchUsers();
      alert('User banned successfully!');
    } catch (error: any) {
      console.error('Error banning user:', error);
      alert(error.response?.data?.error || 'Failed to ban user');
    }
  };

  const handleUnban = async (userId: number) => {
    if (!confirm('Unban this user?')) return;

    try {
      await api.post(`/api/users/${userId}/unban`);
      fetchUsers();
      alert('User unbanned successfully!');
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      alert(error.response?.data?.error || 'Failed to unban user');
    }
  };

  const handleApprovePost = async (postId: number) => {
    if (!confirm('Approve this post for publication?')) return;

    try {
      await api.post(`/api/users/posts/${postId}/approve`);
      fetchPendingPosts();
      alert('Post approved successfully!');
    } catch (error: any) {
      console.error('Error approving post:', error);
      alert(error.response?.data?.error || 'Failed to approve post');
    }
  };

  const handleRejectPost = async (postId: number) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;

    try {
      await api.post(`/api/users/posts/${postId}/reject`, { reason });
      fetchPendingPosts();
      alert('Post rejected successfully!');
    } catch (error: any) {
      console.error('Error rejecting post:', error);
      alert(error.response?.data?.error || 'Failed to reject post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  return (
    <div className="users-management">
      <div className="container">
        <div className="page-header">
          <h1>User Management</h1>
          <p>Manage users, roles, bans, and pending posts</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users ({users.length})
          </button>
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Posts ({pendingPosts.length})
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : activeTab === 'users' ? (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={user.is_banned ? 'banned' : ''}>
                    <td>
                      <div className="user-cell">
                        {user.avatar_url && (
                          <img src={user.avatar_url} alt={user.username} className="user-avatar" />
                        )}
                        <span>{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`role-select role-${user.role}`}
                      >
                        <option value="user">User</option>
                        <option value="translator">Translator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      {user.is_banned ? (
                        <div className="ban-status">
                          <span className="badge badge-danger">Banned</span>
                          {user.ban_expires_at && (
                            <small>Until {formatDate(user.ban_expires_at)}</small>
                          )}
                          {user.ban_reason && (
                            <small className="ban-reason">{user.ban_reason}</small>
                          )}
                        </div>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        {user.is_banned ? (
                          <button
                            onClick={() => handleUnban(user.id)}
                            className="btn btn-small btn-success"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => openBanModal(user)}
                            className="btn btn-small btn-danger"
                          >
                            Ban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pending-posts-grid">
            {pendingPosts.length === 0 ? (
              <div className="no-pending">
                <p>No pending posts to review</p>
              </div>
            ) : (
              pendingPosts.map((post) => (
                <div key={post.id} className="pending-post-card">
                  <div className="post-header">
                    <h3>{post.title}</h3>
                    <span className="badge badge-warning">{post.status}</span>
                  </div>
                  <p className="post-description">{post.description}</p>
                  <div className="post-meta">
                    <div className="author-info">
                      {post.author_avatar && (
                        <img src={post.author_avatar} alt={post.author_name} />
                      )}
                      <span>By {post.author_name}</span>
                    </div>
                    <span className="category">{post.category_name}</span>
                  </div>
                  <div className="post-date">
                    Submitted: {formatDate(post.created_at)}
                  </div>
                  <div className="post-actions">
                    <a
                      href={`/post/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-small"
                    >
                      Preview
                    </a>
                    <button
                      onClick={() => handleApprovePost(post.id)}
                      className="btn btn-success btn-small"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectPost(post.id)}
                      className="btn btn-danger btn-small"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Ban User: {selectedUser.username}</h2>
            <div className="form-group">
              <label>Reason</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Duration (days)</label>
              <input
                type="number"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Leave empty for permanent ban"
                min="1"
              />
              <small>Leave empty for permanent ban</small>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowBanModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleBan} className="btn btn-danger">
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
