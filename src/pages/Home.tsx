import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import { useSeo } from '../hooks/useSeo';
import './Home.css';
import { PostData } from '../types/post';

const Home: React.FC = () => {
  const { category } = useParams<{ category?: string }>();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'translated' | 'untranslated'>('all');

  useEffect(() => {
    fetchPosts();
  }, [category, filter]);

  const fetchPosts = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {};
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

  const getCategoryTitle = (): string => {
    if (!category) return 'Latest Updates';
    return category.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const categoryTitle = getCategoryTitle();

  useSeo({
    title: category ? `${categoryTitle} Translations` : 'Game & Visual Novel Translations',
    description: category
      ? `Browse ${categoryTitle} translations, release updates, and download links on StarsTranslations.`
      : 'Discover game and visual novel translations, release notes, screenshots, and updates on StarsTranslations.',
    canonicalPath: category ? `/category/${category}` : '/',
    keywords: 'game translation, visual novel translation, patch download, translation updates',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'StarsTranslations',
      url: import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
      potentialAction: {
        '@type': 'SearchAction',
        target: `${import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/search?query={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  });

  return (
    <div className="home">
      <div className="container">
        <div className="home-header">
          <h1>{categoryTitle}</h1>

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
