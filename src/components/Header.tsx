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

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setHomepageDropdownOpen(false);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo" onClick={closeMenu}>
            <span className="logo-icon">⭐</span>
            <span className="logo-text">StarsTranslations</span>
          </Link>

          <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <div
              className={`nav-dropdown ${homepageDropdownOpen ? 'dropdown-active' : ''}`}
              onMouseEnter={() => setHomepageDropdownOpen(true)}
              onMouseLeave={() => setHomepageDropdownOpen(false)}
            >
              <button
                className="nav-link dropdown-trigger"
                onClick={() => setHomepageDropdownOpen(!homepageDropdownOpen)}
              >
                Homepage
                <span className="dropdown-arrow">▼</span>
              </button>
              <div className={`dropdown-menu ${homepageDropdownOpen ? 'dropdown-open' : ''}`}>
                <Link to="/" className="dropdown-item" onClick={closeMenu}>All Posts</Link>
                <Link to="/category/doujin-game" className="dropdown-item" onClick={closeMenu}>Doujin Game</Link>
                <Link to="/category/visual-novel" className="dropdown-item" onClick={closeMenu}>Visual Novel</Link>
                <Link to="/category/doujin-manga" className="dropdown-item" onClick={closeMenu}>Doujin Manga</Link>
              </div>
            </div>

            <Link to="/search" className="nav-link" onClick={closeMenu}>Search</Link>

            {isAuthenticated() && (
              <Link to="/following" className="nav-link" onClick={closeMenu}>Following</Link>
            )}

            {isTranslator() && (
              <Link to="/admin" className="nav-link nav-link-admin" onClick={closeMenu}>
                Admin
              </Link>
            )}

            {/* Seção do usuário visível apenas no menu mobile */}
            <div className="mobile-user-section">
              {isAuthenticated() && user ? (
                <>
                  <div className="mobile-user-info">
                    {user.avatar_url && (
                      <img src={user.avatar_url} alt={user.username} className="user-avatar" />
                    )}
                    <div className="mobile-user-details">
                      <span className="user-name">{user.username}</span>
                      {(isAdmin() || isTranslator()) && (
                        <span className="user-role">{user.role}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { handleLogout(); closeMenu(); }} className="btn btn-secondary mobile-logout">
                    Logout
                  </button>
                </>
              ) : (
                <button onClick={() => { handleLogin(); closeMenu(); }} className="btn btn-primary mobile-login">
                  Login with Patreon
                </button>
              )}
            </div>
          </nav>

          {/* Ações do usuário visíveis apenas no desktop */}
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
            className={`mobile-menu-button ${mobileMenuOpen ? 'menu-open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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
