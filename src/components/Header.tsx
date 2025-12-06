import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin, isTranslator } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/patreon';
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
            <Link to="/" className="nav-link">All Posts</Link>
            <Link to="/category/doujin-game" className="nav-link">Doujin Game</Link>
            <Link to="/category/visual-novel" className="nav-link">Visual Novel</Link>
            <Link to="/category/doujin-manga" className="nav-link">Doujin Manga</Link>
            <Link to="/category/admin" className="nav-link">Admin</Link>

            {isTranslator() && (
              <Link to="/admin" className="nav-link nav-link-admin">
                Dashboard
              </Link>
            )}
          </nav>

          <div className="header-actions">
            {isAuthenticated() ? (
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
