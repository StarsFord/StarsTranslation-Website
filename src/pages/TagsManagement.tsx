import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './TagsManagement.css';

interface TagType {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface Tag {
  id: number;
  tag_type_id: number;
  name: string;
  slug: string;
  description: string;
  type_name: string;
  type_slug: string;
}

const TagsManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  const [newTag, setNewTag] = useState({
    tag_type_id: '',
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, tagsRes] = await Promise.all([
        api.get('/api/tags/types'),
        api.get('/api/tags')
      ]);

      setTagTypes(typesRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/tags', newTag);
      setNewTag({ tag_type_id: '', name: '', description: '' });
      await fetchData();
      alert('Tag created successfully!');
    } catch (error: any) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await api.delete(`/api/tags/${tagId}`);
      await fetchData();
      alert('Tag deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag: ' + (error.response?.data?.error || error.message));
    }
  };

  const groupTagsByType = () => {
    const grouped: { [key: string]: Tag[] } = {};
    tags.forEach(tag => {
      if (!grouped[tag.type_slug]) {
        grouped[tag.type_slug] = [];
      }
      grouped[tag.type_slug].push(tag);
    });
    return grouped;
  };

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  const groupedTags = groupTagsByType();

  return (
    <div className="tags-management">
      <div className="container">
        <div className="page-header">
          <h1>Tags Management</h1>
          <p>Create and manage tags for categorizing posts</p>
        </div>

        <div className="management-grid">
          <div className="create-section">
            <h2>Create New Tag</h2>
            <form onSubmit={handleCreateTag} className="create-form">
              <div className="form-group">
                <label>Tag Type *</label>
                <select
                  value={newTag.tag_type_id}
                  onChange={(e) => setNewTag({ ...newTag, tag_type_id: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Select type</option>
                  {tagTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tag Name *</label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  required
                  className="input"
                  placeholder="e.g., NTR, Pregnancy, etc."
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Tag'}
              </button>
            </form>
          </div>

          <div className="tags-list-section">
            <h2>Existing Tags</h2>

            {tagTypes.map(type => (
              <div key={type.slug} className="tag-type-section">
                <h3>{type.name}</h3>
                <div className="tags-grid">
                  {groupedTags[type.slug]?.length > 0 ? (
                    groupedTags[type.slug].map(tag => (
                      <div key={tag.id} className="tag-item">
                        <div className="tag-item-content">
                          <span className="tag-name">{tag.name}</span>
                          {tag.description && (
                            <span className="tag-desc">{tag.description}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="btn btn-danger btn-small"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-tags">No tags yet. Create one above!</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsManagement;
