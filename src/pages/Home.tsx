import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import { useSeo } from '../hooks/useSeo';
import './Home.css';
import { PostData } from '../types/post';

const POSTS_PER_PAGE = 12;

const Home: React.FC = () => {
  const { category } = useParams<{ category?: string }>();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'translated' | 'untranslated'>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    setPage(1);
  }, [category]);

  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string | number | boolean> = {
          limit: POSTS_PER_PAGE,
          offset: (page - 1) * POSTS_PER_PAGE,
          include_total: true
        };
        if (category) params.category = category;
        if (filter !== 'all') params.translated = filter === 'translated';

        const response = await api.get('/api/posts', { params });
        if (!cancelled) {
          setPosts(response.data.posts);
          setTotalPages(response.data.pagination.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching posts:', err);
          setError('Failed to load posts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPosts();
    return () => {
      cancelled = true;
    };
  }, [category, filter, page]);

  const changeFilter = (nextFilter: 'all' | 'translated' | 'untranslated'): void => {
    setFilter(nextFilter);
    setPage(1);
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
              onClick={() => changeFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'translated' ? 'active' : ''}`}
              onClick={() => changeFilter('translated')}
            >
              Translated
            </button>
            <button
              className={`filter-btn ${filter === 'untranslated' ? 'active' : ''}`}
              onClick={() => changeFilter('untranslated')}
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
          <>
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="pagination" aria-label="Posts pagination">
                <button
                  type="button"
                  className="pagination-button"
                  onClick={() => setPage(current => Math.max(current - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="pagination-status" aria-live="polite">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="pagination-button"
                  onClick={() => setPage(current => Math.min(current + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
