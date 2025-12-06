import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import './Home.css';

const Home = () => {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, [category, filter]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (category) params.category = category;
      if (filter !== 'all') params.translated = filter === 'translated';

      const response = await api.get('/api/posts', { params });
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = () => {
    if (!category) return 'Latest Updates';
    return category.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="home">
      <div className="container">
        <div className="home-header">
          <h1>{getCategoryTitle()}</h1>

          <div className="filter-group">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'translated' ? 'active' : ''}`}
              onClick={() => setFilter('translated')}
            >
              Translated
            </button>
            <button
              className={`filter-btn ${filter === 'untranslated' ? 'active' : ''}`}
              onClick={() => setFilter('untranslated')}
            >
              Not Translated
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="no-posts">
            <p>No posts found in this category.</p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
