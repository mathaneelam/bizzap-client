import { useState } from 'react';
import { SiteConfig } from '../types';

interface HeaderProps {
  config: SiteConfig;
}

export default function Header({ config }: HeaderProps) {
  const { meta, theme, contact } = config;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLinkClick = (selector: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        <a href="#" className="site-logo-link">
          {theme.logo ? (
            <img src={theme.logo} alt={meta.name} className="site-logo-img" />
          ) : (
            <span className="site-logo-text">{meta.name}</span>
          )}
        </a>

        {/* Mobile menu toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20" height="20" fill="currentColor">
            {mobileMenuOpen ? (
              <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
            ) : (
              <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
            )}
          </svg>
        </button>

        {/* Navigation */}
        <nav className={`site-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            <li>
              <button onClick={() => handleLinkClick('.hero-section')} className="nav-link-btn">
                Home
              </button>
            </li>
            {config.sections.some(s => s.type === 'about') && (
              <li>
                <button onClick={() => handleLinkClick('#about')} className="nav-link-btn">
                  About
                </button>
              </li>
            )}
            {config.sections.some(s => s.type === 'catalog') && (
              <li>
                <button onClick={() => handleLinkClick('#catalog')} className="nav-link-btn">
                  Products
                </button>
              </li>
            )}
            {config.sections.some(s => s.type === 'gallery') && (
              <li>
                <button onClick={() => handleLinkClick('#gallery')} className="nav-link-btn">
                  Gallery
                </button>
              </li>
            )}
            <li>
              <button onClick={() => handleLinkClick('#contact-form-section')} className="nav-link-btn">
                Contact
              </button>
            </li>
          </ul>
        </nav>

        {/* CTA */}
        <div className="header-cta">
          <a href={`tel:${contact.phone}`} className="btn btn-primary header-call-btn">
            Call: {contact.phone}
          </a>
        </div>
      </div>

      <style>{`
        .site-header {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-color-light);
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .site-logo-link {
          display: flex;
          align-items: center;
        }

        .site-logo-img {
          max-height: 45px;
          width: auto;
        }

        .site-logo-text {
          font-family: var(--font-head);
          font-weight: 800;
          font-size: 1.4rem;
          color: var(--primary-color);
          letter-spacing: -0.02em;
        }

        .mobile-menu-toggle {
          display: none;
          background: transparent;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
        }

        .site-nav {
          display: flex;
        }

        .nav-list {
          display: flex;
          list-style: none;
          gap: 2rem;
        }

        .nav-link-btn {
          background: none;
          border: none;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.95rem;
          color: #4b5563;
          cursor: pointer;
          padding: 0.5rem 0;
          position: relative;
          transition: color var(--transition-fast);
        }

        .nav-link-btn:hover {
          color: var(--accent-color);
        }

        .nav-link-btn::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--accent-color);
          transition: width var(--transition-fast);
        }

        .nav-link-btn:hover::after {
          width: 100%;
        }

        .header-cta {
          display: flex;
        }

        .header-call-btn {
          padding: 0.5rem 1.2rem;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: block;
          }

          .site-nav {
            position: absolute;
            top: 70px;
            left: 0;
            right: 0;
            background-color: white;
            border-bottom: 1px solid var(--border-color-light);
            padding: 1.5rem var(--space-md);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all var(--transition-normal);
          }

          .site-nav.nav-open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }

          .nav-list {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .header-cta {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
