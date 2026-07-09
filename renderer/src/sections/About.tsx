import { AboutSection, SiteConfig } from '../types';

interface AboutProps {
  section: AboutSection;
  config: SiteConfig;
}

export default function About({ section, config }: AboutProps) {
  const { meta } = config;
  const bodyText = section.body || meta.description;
  const stats = section.stats || [];

  return (
    <section className="about-section section-padding" id="about">
      <div className="container">
        <div className="grid grid-2 about-grid">
          <div className="about-text-content">
            <span className="section-subtitle">Our Profile</span>
            <h2 className="about-title">About {meta.name}</h2>
            <div className="about-divider"></div>
            <p className="about-description">{bodyText}</p>
          </div>
          {stats.length > 0 && (
            <div className="about-stats-container">
              <div className="grid grid-2 stats-subgrid">
                {stats.map((stat, index) => (
                  <div key={index} className="card stat-card text-center">
                    <span className="stat-value">{stat.v}</span>
                    <span className="stat-key">{stat.k}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .about-section {
          background-color: #ffffff;
        }

        .about-grid {
          align-items: center;
          gap: var(--space-lg);
        }

        .section-subtitle {
          color: var(--accent-color);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 0.5rem;
        }

        .about-title {
          color: var(--primary-color);
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          margin-bottom: 1rem;
        }

        .about-divider {
          width: 50px;
          height: 3px;
          background-color: var(--accent-color);
          margin-bottom: 1.5rem;
          border-radius: 2px;
        }

        .about-description {
          color: #4b5563;
          font-size: 1.05rem;
          line-height: 1.8;
          white-space: pre-line;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          border-radius: var(--border-radius-md);
          background: linear-gradient(135deg, #ffffff 0%, rgba(243,244,246,0.3) 100%);
          border-left: 4px solid var(--accent-color);
        }

        .text-center {
          text-align: center;
        }

        .stat-value {
          font-family: var(--font-head);
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--primary-color);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-key {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stats-subgrid {
          gap: var(--space-sm);
        }
      `}</style>
    </section>
  );
}
