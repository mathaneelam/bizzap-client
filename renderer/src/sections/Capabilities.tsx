import { CapabilitiesSection } from '../types';

interface CapabilitiesProps {
  section: CapabilitiesSection;
}

export default function Capabilities({ section }: CapabilitiesProps) {
  const items = section.items || [];

  if (items.length === 0) return null;

  return (
    <section className="capabilities-section section-padding" id="capabilities">
      <div className="container">
        <div className="section-header">
          <h2>Our Capabilities & Standards</h2>
          <p>We maintain top-tier processes, certifications, and operational expertise.</p>
        </div>

        <div className="grid grid-4 capabilities-grid">
          {items.map((item, index) => (
            <div key={index} className="card capability-card">
              <div className="capability-icon-wrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  width="20"
                  height="20"
                  fill="currentColor"
                  className="capability-icon"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                </svg>
              </div>
              <span className="capability-name">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .capabilities-section {
          background-color: #ffffff;
        }

        .capability-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem var(--space-sm);
          background-color: var(--bg-light);
          border: 1px solid var(--border-color-light);
          border-radius: var(--border-radius-sm);
          text-align: left;
        }

        .capability-icon-wrapper {
          color: var(--success-color);
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .capability-name {
          font-weight: 600;
          font-size: 1.05rem;
          color: var(--primary-color);
        }
      `}</style>
    </section>
  );
}
