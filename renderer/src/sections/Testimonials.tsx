import { TestimonialsSection } from '../types';

interface TestimonialsProps {
  section: TestimonialsSection;
}

export default function Testimonials({ section }: TestimonialsProps) {
  const items = section.items || [];

  if (items.length === 0) return null;

  return (
    <section className="testimonials-section section-padding" id="testimonials">
      <div className="container">
        <div className="section-header">
          <h2>What Our Clients Say</h2>
          <p>Read genuine reviews and feedback from our business partners and customers.</p>
        </div>

        <div className="grid grid-3 testimonials-grid">
          {items.map((item, index) => (
            <div key={index} className="card testimonial-card">
              <div className="quote-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
                  <path d="M0 219.3v209.4c0 28.3 23 51.3 51.3 51.3h110.8c28.3 0 51.3-23 51.3-51.3V312c0-28.3-23-51.3-51.3-51.3H96.3c0-37.4 24.4-67.4 57.6-67.4 12.5 0 22.6-10.1 22.6-22.6v-59.2c0-11.3-9.8-20.1-21-18.4C69.7 106.6 0 162.7 0 219.3zm272 0v209.4c0 28.3 23 51.3 51.3 51.3h110.8c28.3 0 51.3-23 51.3-51.3V312c0-28.3-23-51.3-51.3-51.3H368.3c0-37.4 24.4-67.4 57.6-67.4 12.5 0 22.6-10.1 22.6-22.6v-59.2c0-11.3-9.8-20.1-21-18.4C341.7 106.6 272 162.7 272 219.3z" />
                </svg>
              </div>
              <p className="testimonial-quote">"{item.quote}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{item.by.charAt(0)}</div>
                <div className="author-info">
                  <span className="author-name">{item.by}</span>
                  <span className="author-verified">Verified Customer</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .testimonials-section {
          background-color: var(--bg-light);
        }

        .testimonial-card {
          position: relative;
          padding: 2.5rem var(--space-md) var(--space-md) var(--space-md);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background-color: #ffffff;
        }

        .quote-icon {
          position: absolute;
          top: -15px;
          left: 20px;
          color: var(--accent-color);
          opacity: 0.15;
          width: 40px;
          height: 40px;
        }

        .testimonial-quote {
          font-style: italic;
          color: #4b5563;
          margin-bottom: 1.5rem;
          line-height: 1.7;
          font-size: 1rem;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-top: 1px solid var(--border-color-light);
          padding-top: 1rem;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-color) 0%, var(--primary-color) 100%);
          color: white;
          font-weight: 700;
          font-family: var(--font-head);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .author-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .author-name {
          font-weight: 700;
          color: var(--primary-color);
          font-size: 0.95rem;
        }

        .author-verified {
          font-size: 0.75rem;
          color: #9ca3af;
        }
      `}</style>
    </section>
  );
}
