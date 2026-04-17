import React from 'react';
import { partners, Partner } from '../data/PartnersData';
import './Partners.css';

const PartnerCard: React.FC<{ partner: Partner }> = ({ partner }) => {
  const initials = partner.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      className="partner-card"
    >
      <div className="partner-card-logo">
        {partner.logo ? (
          <img src={partner.logo} alt={`${partner.name} logo`} />
        ) : (
          <span className="partner-card-initials">{initials}</span>
        )}
      </div>

      <div className="partner-card-body">
        <div className="partner-card-header">
          <h3 className="partner-card-name">{partner.name}</h3>
          {partner.category && (
            <span className="partner-card-badge">{partner.category}</span>
          )}
        </div>
        <p className="partner-card-description">{partner.description}</p>
        <span className="partner-card-link">Visit site →</span>
      </div>
    </a>
  );
};

const Partners: React.FC = () => {
  return (
    <div className="partners-page">
      <div className="container">
        <div className="partners-hero">
          <h1 className="partners-title">Our Partners</h1>
          <p className="partners-subtitle">
            Groups and communities we work alongside to bring Japanese content to English audiences.
          </p>
        </div>

        {partners.length === 0 ? (
          <div className="partners-empty">
            <p>No partners listed yet. Check back soon!</p>
          </div>
        ) : (
          <div className="partners-grid">
            {partners.map((partner) => (
              <PartnerCard key={partner.url} partner={partner} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Partners;
