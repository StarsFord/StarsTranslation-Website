import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Comments.css';

interface CommentData {
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

interface CommentProps {
  comment: CommentData;
  onReply: () => void;
  onEdit: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

const Comment: React.FC<CommentProps> = ({ comment, onReply, onEdit, onDelete }) => {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>(comment.content);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);

  const canEdit = user && (user.id === comment.user_id || isAdmin());
  const canDelete = user && (user.id === comment.user_id || isAdmin());

  const handleEdit = async () => {
    await onEdit(comment.id, editContent);
    setIsEditing(false);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="comment">
      <div className="comment-header">
        <div className="comment-author">
          {comment.avatar_url && (
            <img src={comment.avatar_url} alt={comment.username} className="comment-avatar" />
          )}
          <span className="comment-username">{comment.username}</span>
          {comment.role !== 'user' && (
            <span className={`comment-role role-${comment.role}`}>{comment.role}</span>
          )}
        </div>
        <span className="comment-date">{formatDate(comment.created_at)}</span>
      </div>

      <div className="comment-body">
        {isEditing ? (
          <div className="comment-edit">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input"
            />
            <div className="comment-edit-actions">
              <button onClick={handleEdit} className="btn btn-primary btn-sm">Save</button>
              <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-content">{comment.content}</p>
        )}
      </div>

      <div className="comment-actions">
        <button onClick={() => setShowReplyForm(!showReplyForm)} className="comment-action-btn">
          Reply
        </button>
        {canEdit && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="comment-action-btn">
            Edit
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(comment.id)} className="comment-action-btn delete">
            Delete
          </button>
        )}
      </div>

      {showReplyForm && (
        <div className="comment-reply-form">
          <CommentForm
            postId={comment.post_id}
            parentId={comment.id}
            onSubmit={() => {
              setShowReplyForm(false);
              onReply();
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CommentFormProps {
  postId: number;
  parentId?: number | null;
  onSubmit: () => void;
  onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, parentId, onSubmit, onCancel }) => {
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/api/comments', {
        post_id: postId,
        parent_id: parentId,
        content: content.trim()
      });
      setContent('');
      onSubmit();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="input"
        rows="3"
        disabled={submitting}
      />
      <div className="comment-form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting || !content.trim()}>
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

interface CommentsProps {
  postId: number;
}

const Comments: React.FC<CommentsProps> = ({ postId }) => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/comments/post/${postId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: number, content: string): Promise<void> => {
    try {
      await api.put(`/api/comments/${commentId}`, { content });
      fetchComments();
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment');
    }
  };

  const handleDelete = async (commentId: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/api/comments/${commentId}`);
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="comments">
      {isAuthenticated() ? (
        <CommentForm postId={postId} onSubmit={fetchComments} />
      ) : (
        <div className="comments-login-prompt">
          <p>Please login to comment</p>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="no-comments">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onReply={fetchComments}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;
