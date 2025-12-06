import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Search.css';

interface Tag {
  id: number;
  name: string;
  slug: string;
  tag_type_id: number;
  type_name: string;
  type_slug: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  category_name: string;
  is_translated: boolean;
  created_at: string;
  matching_tags?: number;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedFetish, setSelectedFetish] = useState('');

  const [platforms, setPlatforms] = useState<Tag[]>([]);
  const [genres, setGenres] = useState<Tag[]>([]);
  const [fetishes, setFetishes] = useState<Tag[]>([]);

  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const [platformsRes, genresRes, fetishesRes] = await Promise.all([
        api.get('/api/tags?type=platform'),
        api.get('/api/tags?type=genre'),
        api.get('/api/tags?type=fetish')
      ]);

      setPlatforms(platformsRes.data);
      setGenres(genresRes.data);
      setFetishes(fetishesRes.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();

      if (query) params.append('query', query);
      if (selectedPlatform) params.append('platform', selectedPlatform);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (selectedFetish) params.append('fetish', selectedFetish);

      const response = await api.get(`/api/tags/search?${params.toString()}`);
      setResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedPlatform('');
    setSelectedGenre('');
    setSelectedFetish('');
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="search-page">
      <div className="container">
        <div className="search-header">
          <h1>Search Posts</h1>
          <p>Find content by title, description, or tags</p>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or description..."
              className="search-input"
            />
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label>Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="filter-select"
              >
                <option value="">All Platforms</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.slug}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="filter-select"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.slug}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Fetish</label>
              <select
                value={selectedFetish}
                onChange={(e) => setSelectedFetish(e.target.value)}
                className="filter-select"
              >
                <option value="">All Tags</option>
                {fetishes.map((fetish) => (
                  <option key={fetish.id} value={fetish.slug}>
                    {fetish.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="search-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button type="button" onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          </div>
        </form>

        {searched && (
          <div className="search-results">
            <div className="results-header">
              <h2>
                {results.length} {results.length === 1 ? 'Result' : 'Results'} Found
              </h2>
            </div>

            {results.length === 0 ? (
              <div className="no-results">
                <p>No posts found matching your search criteria.</p>
                <p className="hint">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="results-grid">
                {results.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.slug}`}
                    className="result-card"
                  >
                    {post.thumbnail_url && (
                      <div className="result-thumbnail">
                        <img src={post.thumbnail_url} alt={post.title} />
                      </div>
                    )}
                    <div className="result-content">
                      <h3>{post.title}</h3>
                      {post.description && (
                        <p className="result-description">{post.description}</p>
                      )}
                      <div className="result-meta">
                        <span className="category-badge">{post.category_name}</span>
                        {post.is_translated && (
                          <span className="translated-badge">Translated</span>
                        )}
                        {post.matching_tags && post.matching_tags > 0 && (
                          <span className="match-badge">
                            {post.matching_tags} tag{post.matching_tags > 1 ? 's' : ''} matched
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
