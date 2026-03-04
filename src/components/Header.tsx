import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin, isTranslator } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homepageDropdownOpen, setHomepageDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const url = process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/auth/patreon` : 'https://starstranslations-backend-805236256394.us-central1.run.app/auth/patreon';

  const handleLogin = () => {
    window.location.href = url;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">⭐</span>
            <span className="logo-text">StarsTranslations</span>
          </Link>

          <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <div
              className="nav-dropdown"
              onMouseEnter={() => setHomepageDropdownOpen(true)}
              onMouseLeave={() => setHomepageDropdownOpen(false)}
            >
              <button className="nav-link dropdown-trigger">
                Homepage
                <span className="dropdown-arrow">▼</span>
              </button>
              <div className={`dropdown-menu ${homepageDropdownOpen ? 'dropdown-open' : ''}`}>
                <Link to="/" className="dropdown-item">All Posts</Link>
                <Link to="/category/doujin-game" className="dropdown-item">Doujin Game</Link>
                <Link to="/category/visual-novel" className="dropdown-item">Visual Novel</Link>
                <Link to="/category/doujin-manga" className="dropdown-item">Doujin Manga</Link>
              </div>
            </div>

            <Link to="/search" className="nav-link">Search</Link>

            {isAuthenticated() && (
              <Link to="/following" className="nav-link">Following</Link>
            )}

            {isTranslator() && (
              <Link to="/admin" className="nav-link nav-link-admin">
                Admin
              </Link>
            )}
          </nav>

          <div className="header-actions">
            {isAuthenticated() && user ? (
              <div className="user-menu">
                <div className="user-info">
                  {user.avatar_url && (
                    <img src={user.avatar_url} alt={user.username} className="user-avatar" />
                  )}
                  <span className="user-name">{user.username}</span>
                  {(isAdmin() || isTranslator()) && (
                    <span className="user-role">{user.role}</span>
                  )}
                </div>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="btn btn-primary">
                Login with Patreon
              </button>
            )}
          </div>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
