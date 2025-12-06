import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      alert('Authentication failed. Please try again.');
      navigate('/');
      return;
    }

    if (token) {
      login(token);
      navigate('/');
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Authenticating...</p>
    </div>
  );
};

export default AuthCallback;
