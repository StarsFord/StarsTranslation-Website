import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>StarsTranslations</h3>
            <p>Bringing Japanese games and visual novels to English audiences.</p>
          </div>

          <div className="footer-section">
            <h4>Support Us</h4>
            <a href="https://patreon.com/StarsTranslations" target="_blank" rel="noopener noreferrer" className="patreon-link">
              Support on Patreon
            </a>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <p className="footer-disclaimer">
              All translations are fan-made and for educational purposes only.
              Please support the original creators.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} StarsTranslations. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
