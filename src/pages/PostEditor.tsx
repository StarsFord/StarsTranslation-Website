

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './PostEditor.css';
  import UploadProgress from "../components/UploadProgress";

const PostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTranslator } = useAuth();
  const isEditing = !!id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    category_id: '',
    is_translated: false,
    thumbnail_url: ''
  });

  const [files, setFiles] = useState({
    translated: [],
    original: [],
    images: []
  });

  const [versionData, setVersionData] = useState({
    version_number: '',
    changelog: ''
  });

  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
    fileName: '',
    percentage: 0
  });

  const [externalLinks, setExternalLinks] = useState([
    { label: '', url: '' }
  ]);
  const handleAddLink = () => {
    setExternalLinks([...externalLinks, { label: '', url: '' }]);
  };
  const handleLinkChange = (index, field, value) => {
    const newLinks = [...externalLinks];
    newLinks[index][field] = value;
    setExternalLinks(newLinks);
  };
  const handleRemoveLink = (index) => {
    setExternalLinks(externalLinks.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchPost();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await api.get(`/api/posts/id/${id}`);
      const post = response.data;
      setFormData({
        title: post.title,
        slug: post.slug,
        description: post.description || '',
        content: post.content || '',
        category_id: post.category_id,
        is_translated: post.is_translated,
        thumbnail_url: post.thumbnail_url || ''
      });

      if (post.external_links && post.external_links.length > 0) {
        setExternalLinks(post.external_links);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Failed to load post');
    }
  };

  const handleChange = (e ) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug from title
    if (name === 'title' && !isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleFileChange = (e, type) => {
    setFiles(prev => ({
      ...prev,
      [type]: Array.from(e.target.files)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

  try {
    let postId;

    // Create or update post
    if (isEditing) {
      await api.put(`/api/posts/${id}`, {
        ...formData,
        external_links: externalLinks
      });
      postId = id;
    } else {
      const response = await api.post('/api/posts', {
        ...formData,
        external_links: externalLinks
      });
      postId = response.data.id;
    }

    // Add version if provided
    if (versionData.version_number && versionData.changelog) {
      await api.post(`/api/posts/${postId}/versions`, versionData);
    }

    // Upload files
    const uploadFile = async (file, attachmentType, index, total) => {
    const formData = new FormData();

    formData.append("file", file);

    formData.append("post_id", postId);

    formData.append("attachment_type", attachmentType);

    setUploadProgress({
      current: index + 1,

      total,

      fileName: file.name,

      percentage: Math.round(((index + 1) / total) * 100),
    });

    await api.post("/api/upload/attachment", formData, {
      headers: { "Content-Type": "multipart/form-data" },

      onUploadProgress: (progressEvent) => {
        const fileProgress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );

        const totalProgress = Math.round(
          ((index + fileProgress / 100) / total) * 100
        );

        setUploadProgress((prev) => ({
          ...prev,

          percentage: totalProgress,
        }));
      },
    });
  };

  const allFiles = [...files.translated, ...files.original, ...files.images];

  const totalFiles = allFiles.length;

  let currentIndex = 0;

  // Upload translated files

  for (const file of files.translated) {
    await uploadFile(file, "translated", currentIndex++, totalFiles);
  }

  // Upload original files

  for (const file of files.original) {
    await uploadFile(file, "original", currentIndex++, totalFiles);
  }

  // Upload images

  for (const file of files.images) {
    await uploadFile(file, "image", currentIndex++, totalFiles);
  }

  // Reset progress

  setUploadProgress({ current: 0, total: 0, fileName: "", percentage: 0 });

    alert(isEditing ? 'Post updated successfully!' : 'Post created successfully!');
      navigate('/admin');
  } catch (error) {
    console.error('Error saving post:', error);
    alert('Failed to save post: ' + (error.response?.data?.error || error.message));
  } finally {
    setLoading(false);
  }
  };

  if (!isTranslator()) {
    return <Navigate to="/" />;
  }

  // In the return:

  {
    uploadProgress.total > 0 && (
      <UploadProgress
        current={uploadProgress.current}
        total={uploadProgress.total}
        fileName={uploadProgress.fileName}
        percentage={uploadProgress.percentage}
      />
    );
  }

  return (
    <div className="post-editor">
      <div className="container">
        <div className="editor-header">
          <h1>{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="editor-form">
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label className="label">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="input"
                required
                pattern="[a-z0-9-]+"
              />
              <small>URL-friendly name (lowercase, hyphens only)</small>
            </div>

            <div className="form-group">
              <label className="label">Category *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">
                <input
                  type="checkbox"
                  name="is_translated"
                  checked={formData.is_translated}
                  onChange={handleChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Translated
              </label>
            </div>

            <div className="form-group">
              <label className="label">Thumbnail URL</label>
              <input
                type="url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleChange}
                className="input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input"
                rows={3}
                placeholder="Short description of the game/content"
              />
            </div>

            <div className="form-group">
              <label className="label">Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="input"
                rows={10}
                placeholder="Detailed information, instructions, etc."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Version Information (Optional)</h2>

            <div className="form-group">
              <label className="label">Version Number</label>
              <input
                type="text"
                value={versionData.version_number}
                onChange={(e) => setVersionData(prev => ({ ...prev, version_number: e.target.value }))}
                className="input"
                placeholder="1.0.0"
              />
            </div>

            <div className="form-group">
              <label className="label">Changelog</label>
              <textarea
                value={versionData.changelog}
                onChange={(e) => setVersionData(prev => ({ ...prev, changelog: e.target.value }))}
                className="input"
                rows={3}
                placeholder="What's new in this version?"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>External Download Links</h2>

            <p className="section-description">
              Add alternative download links (Pixeldrain, Gofile, etc.) as backup options
            </p>

            {externalLinks.map((link, index) => (
              <div key={index} className="external-link-row">
                <div className="form-group">
                  <label className="label">Label</label>

                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleLinkChange(index, "label", e.target.value)}
                    className="input"
                    placeholder="e.g., Pixeldrain, Gofile"
                  />
                </div>

                <div className="form-group">
                  <label className="label">URL</label>

                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                    className="input"
                    placeholder="https://..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="btn btn-danger btn-small"
                >
                  Remove
                </button>
              </div>
            ))}

            <button type="button" onClick={handleAddLink} className="btn btn-secondary">
              + Add Link
            </button>
          </div>

          <div className="form-section">
            <h2>File Uploads</h2>

            <div className="form-group">
              <label className="label">Translated Version Files</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'translated')}
                className="input"
                multiple
                accept=".zip,.rar,.7z"
              />
              <small>ZIP, RAR, or 7Z files for the translated version</small>
            </div>

            <div className="form-group">
              <label className="label">Original (Japanese) Version Files</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'original')}
                className="input"
                multiple
                accept=".zip,.rar,.7z"
              />
              <small>ZIP, RAR, or 7Z files for the original version</small>
            </div>

            <div className="form-group">
              <label className="label">Screenshots/Images</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'images')}
                className="input"
                multiple
                accept="image/*"
              />
              <small>PNG, JPG, or other image files</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEditor;
