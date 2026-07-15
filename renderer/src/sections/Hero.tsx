import { HeroSection, SiteConfig } from '../types';

interface HeroProps {
  section: HeroSection;
  config: SiteConfig;
}

export default function Hero({ section, config }: HeroProps) {
  const { meta } = config;
  const headline = section.headline || meta.tagline;
  const sub = section.sub || meta.description;
  const ctaText = section.cta || 'Get in Touch';
  const imageUrl = section.image || '';
  const variant = section.variant || 'split';

  // Monogram from the business name — used for the themed panel when no photo exists.
  const monogram = meta.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  // "split" shows a side element (photo if present, else a themed graphic panel).
  // "centered" is a single, centered column with no aside.
  const showAside = variant === 'split';

  const handleCtaClick = () => {
    const contactSection = document.getElementById('contact-form-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={`hero-section hero-${variant}`}>
      <div className="container hero-container">
        <div className="hero-content animate-fade-in">
          <span className="hero-badge">{meta.category}</span>
          <h1>{headline}</h1>
          <p>{sub}</p>
          <div className="hero-actions">
            <button onClick={handleCtaClick} className="btn btn-primary btn-lg-size">
              {ctaText}
            </button>
            <a href={`tel:${config.contact.phone}`} className="btn btn-secondary btn-lg-size">
              Call Now
            </a>
          </div>
        </div>
        {showAside && (
          imageUrl ? (
            <div className="hero-image-container animate-fade-in">
              <img src={imageUrl} alt={meta.name} className="hero-image" />
              <div className="hero-image-backdrop"></div>
            </div>
          ) : (
            <div className="hero-graphic animate-fade-in" aria-hidden="true">
              <span className="hero-monogram">{monogram}</span>
              <span className="hero-graphic-label">{meta.category}</span>
            </div>
          )
        )}
      </div>

      <style>{`
        .hero-section {
          background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(243,244,246,1) 100%);
          position: relative;
          overflow: hidden;
          padding: 5rem 0;
          border-bottom: 1px solid var(--border-color-light);
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
          align-items: center;
        }

        @media (min-width: 992px) {
          .hero-split .hero-container {
            grid-template-columns: 1.15fr 0.85fr;
            padding: 4rem var(--space-md);
          }
          .hero-centered .hero-container {
            grid-template-columns: 1fr;
            padding: 4rem var(--space-md);
          }
        }

        .hero-content {
          text-align: left;
          max-width: 650px;
        }

        .hero-centered .hero-content {
          text-align: center;
          max-width: 780px;
          margin: 0 auto;
        }

        .hero-centered .hero-actions {
          justify-content: center;
        }

        .hero-badge {
          display: inline-block;
          background-color: rgba(58, 134, 200, 0.1);
          color: var(--accent-color);
          padding: 0.4rem 1rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.25rem;
        }

        .hero-content h1 {
          color: var(--primary-color);
          margin-bottom: 1.25rem;
        }

        .hero-content p {
          color: #4b5563;
          margin-bottom: 2rem;
          font-size: 1.2rem;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .btn-lg-size {
          padding: 0.9rem 2.2rem;
          font-size: 1.05rem;
        }

        .hero-image-container {
          position: relative;
          width: 100%;
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }

        .hero-image {
          width: 100%;
          height: auto;
          object-fit: cover;
          max-height: 480px;
          border-radius: var(--border-radius-lg);
          z-index: 2;
          position: relative;
          transition: transform var(--transition-normal);
        }

        .hero-image-container:hover .hero-image {
          transform: scale(1.02);
        }

        .hero-image-backdrop {
          position: absolute;
          top: 10%;
          left: 10%;
          width: 90%;
          height: 90%;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
          border-radius: var(--border-radius-lg);
          opacity: 0.15;
          z-index: 1;
        }

        /* Themed graphic panel shown on split heroes when no photo is available. */
        .hero-graphic {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          min-height: 300px;
          border-radius: var(--border-radius-lg);
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.12), 0 10px 10px -5px rgba(0,0,0,0.05);
        }

        .hero-monogram {
          font-family: var(--font-head);
          font-weight: 700;
          font-size: clamp(3.5rem, 8vw, 6rem);
          line-height: 1;
          color: #ffffff;
        }

        .hero-graphic-label {
          color: rgba(255,255,255,0.85);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.9rem;
        }
      `}</style>
    </section>
  );
}
