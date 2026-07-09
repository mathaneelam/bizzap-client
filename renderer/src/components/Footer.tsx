import { SiteConfig } from '../types';

interface FooterProps {
  config: SiteConfig;
}

export default function Footer({ config }: FooterProps) {
  const { meta, contact } = config;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="grid grid-3 footer-grid">
          {/* Column 1: Info */}
          <div className="footer-col brand-col">
            <h3 className="footer-logo">{meta.name}</h3>
            <p className="footer-tagline">{meta.tagline}</p>
            {contact.socials && (
              <div className="footer-socials">
                {contact.socials.instagram && (
                  <a
                    href={contact.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label="Instagram"
                  >
                    Instagram
                  </a>
                )}
                {contact.socials.facebook && (
                  <a
                    href={contact.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label="Facebook"
                  >
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Hours & Details */}
          <div className="footer-col">
            <h4>Hours & Contact</h4>
            <ul className="footer-links">
              <li><strong>Phone:</strong> {contact.phone}</li>
              {contact.email && <li><strong>Email:</strong> {contact.email}</li>}
              {contact.hours && (
                <li>
                  <strong>Business Hours:</strong>
                  <ul className="sub-hours">
                    {Object.entries(contact.hours).map(([day, val]) => (
                      <li key={day} style={{ textTransform: 'capitalize' }}>
                        {day.replace('_', '-')}: {val}
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Address & Location */}
          <div className="footer-col">
            <h4>Location</h4>
            <p className="footer-address">{contact.address}</p>
            {contact.gbp_url && (
              <a
                href={contact.gbp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm footer-map-btn"
              >
                View on Google Maps
              </a>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} {meta.name}. All rights reserved.</p>
          <p className="credit-tag">Powered by Bizzap Local Sites</p>
        </div>
      </div>

      <style>{`
        .site-footer {
          background-color: var(--primary-color);
          color: #9ca3af;
          padding: 4rem 0 2rem 0;
          border-top: 1px solid var(--border-color-dark);
          text-align: left;
        }

        .footer-grid {
          margin-bottom: 3rem;
          gap: var(--space-lg);
        }

        .footer-col h4 {
          color: white;
          margin-bottom: 1.5rem;
          font-size: 1.15rem;
          position: relative;
          padding-bottom: 0.5rem;
        }

        .footer-col h4::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 30px;
          height: 2px;
          background-color: var(--accent-color);
        }

        .footer-logo {
          color: white;
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .footer-tagline {
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .footer-socials {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          font-size: 0.9rem;
          color: var(--accent-color);
          font-weight: 600;
        }

        .social-link:hover {
          color: white;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .footer-links strong {
          color: #e5e7eb;
        }

        .sub-hours {
          list-style: none;
          margin-top: 0.25rem;
          padding-left: 0.5rem;
          color: #6b7280;
        }

        .footer-address {
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 1.25rem;
          color: #d1d5db;
        }

        .footer-map-btn {
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 0.85rem;
          padding: 0.5rem 1rem;
        }

        .footer-map-btn:hover {
          background-color: white;
          color: var(--primary-color);
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          font-size: 0.85rem;
        }

        @media (min-width: 768px) {
          .footer-bottom {
            flex-direction: row;
          }
        }

        .credit-tag {
          color: #4b5563;
        }
      `}</style>
    </footer>
  );
}
