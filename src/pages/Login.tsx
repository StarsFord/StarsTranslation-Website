import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated()) {
    return <Navigate to="/" />;
  }

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/patreon';
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>⭐ StarsTranslations</h1>
            <p>Game & Visual Novel Translations</p>
          </div>

          <div className="login-content">
            <h2>Welcome Back!</h2>
            <p>Sign in with your Patreon account to access exclusive content and features.</p>

            <button onClick={handleLogin} className="btn btn-patreon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003"/>
              </svg>
              Continue with Patreon
            </button>

            <div className="login-info">
              <p>By logging in, you'll be able to:</p>
              <ul>
                <li>Comment on posts</li>
                <li>Get notifications for game updates</li>
                <li>Access exclusive content (coming soon)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
