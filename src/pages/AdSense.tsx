import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './AdSense.css';

const AdSense: React.FC = () => {
  const { attachmentId } = useParams<{ attachmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [attachment, setAttachment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(15); // 15 segundos de anúncio
  const [canDownload, setCanDownload] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    fetchAttachment();
  }, [attachmentId, isAuthenticated]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanDownload(true);
    }
  }, [countdown]);

  const fetchAttachment = async () => {
    try {
      const response = await api.get(`/api/upload/adsense-info/${attachmentId}`);
      setAttachment(response.data);
    } catch (error) {
      console.error('Error fetching attachment:', error);
      alert('Failed to load attachment information');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!canDownload || downloading) return;

    setDownloading(true);
    try {
      // Gerar token temporário de download
      const response = await api.post(`/api/upload/generate-download-token/${attachmentId}`);
      const token = response.data.token;

      // Iniciar download
      window.location.href = `http://localhost:3000/api/upload/download-with-token/${attachmentId}?token=${token}`;

      // Aguardar um pouco e redirecionar
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to start download');
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="adsense-page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!attachment) {
    return (
      <div className="adsense-page">
        <div className="container">
          <div className="error-message">Attachment not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="adsense-page">
      <div className="container">
        <div className="adsense-container">
          <div className="adsense-header">
            <h1>Premium Content</h1>
            <p className="subtitle">
              Support us by watching this ad or upgrade to Premium for ad-free downloads
            </p>
          </div>

          <div className="file-info">
            <div className="file-icon">📦</div>
            <div className="file-details">
              <h3>{attachment.original_filename}</h3>
              <p className="file-size">{formatFileSize(attachment.file_size)}</p>
            </div>
          </div>

          {/* Área de Anúncio */}
          <div className="ad-container">
            <div className="ad-placeholder">
              {countdown > 0 ? (
                <div className="ad-countdown">
                  <div className="countdown-circle">
                    <span className="countdown-number">{countdown}</span>
                  </div>
                  <p>Please wait while the ad is displayed...</p>
                  <small>Your download will be ready in {countdown} seconds</small>
                </div>
              ) : (
                <div className="ad-complete">
                  <div className="success-icon">✓</div>
                  <p>Thank you for your support!</p>
                  <small>Your download is ready</small>
                </div>
              )}
            </div>

            {/* TODO: Aqui você vai colocar o código real do Google AdSense */}
            {/* Exemplo:
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-XXXXXXXXXX"
                 data-ad-slot="XXXXXXXXXX"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            */}
          </div>

          <div className="download-section">
            <button
              onClick={handleDownload}
              disabled={!canDownload || downloading}
              className={`btn btn-large ${canDownload ? 'btn-success' : 'btn-disabled'}`}
            >
              {downloading ? (
                <>
                  <span className="spinner-small"></span>
                  Starting Download...
                </>
              ) : canDownload ? (
                <>
                  <span className="download-icon">⬇️</span>
                  Download Now
                </>
              ) : (
                <>
                  <span className="lock-icon">🔒</span>
                  Please wait {countdown}s
                </>
              )}
            </button>

            <div className="premium-cta">
              <p>Tired of ads?</p>
              <a
                href={process.env.VITE_PATREON_URL || 'https://patreon.com/youraccount'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Upgrade to Premium on Patreon
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

export default AdSense;
