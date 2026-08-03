import { CatalogSection, SiteConfig, CatalogItem } from '../types';
import { cleanPhoneForWa } from '../utils/phoneUtils';

interface CatalogProps {
  section: CatalogSection;
  config: SiteConfig;
}

export default function Catalog({ section, config }: CatalogProps) {
  const items = section.items || [];
  const whatsappNumber = config.contact.whatsapp || config.contact.phone;

  const getWhatsAppLink = (item: CatalogItem) => {
    if (!whatsappNumber) return '#';
    const cleanNumber = cleanPhoneForWa(whatsappNumber);
    
    // Custom order text
    const text = `Hi ${config.meta.name}, I would like to inquire about your product: *${item.name}*.\n\n` +
                 (item.moq ? `*MOQ:* ${item.moq}\n` : '') +
                 (item.price ? `*Price:* ${item.price}\n` : '') +
                 `Please share more details.`;
                 
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  if (items.length === 0) return null;

  return (
    <section className="catalog-section section-padding" id="catalog">
      <div className="container">
        <div className="section-header">
          <h2>Our Products & Services</h2>
          <p>Explore our premium offerings, designed for durability and performance.</p>
        </div>

        <div className="grid grid-3 catalog-grid">
          {items.map((item, index) => (
            <div key={index} className="card catalog-card">
              {item.image ? (
                <div className="catalog-img-wrapper">
                  <img src={item.image} alt={item.name} className="catalog-img" />
                </div>
              ) : (
                <div className="catalog-img-placeholder">
                  <span>{item.name.charAt(0)}</span>
                </div>
              )}
              
              <div className="catalog-info">
                <h3 className="catalog-item-name">{item.name}</h3>
                
                {item.desc && <p className="catalog-item-desc">{item.desc}</p>}
                
                <div className="catalog-meta">
                  {item.price && (
                    <div className="catalog-price">
                      <span className="meta-label">Price</span>
                      <span className="price-value">{item.price}</span>
                    </div>
                  )}
                  {item.moq && (
                    <div className="catalog-moq">
                      <span className="meta-label">MOQ</span>
                      <span className="moq-value">{item.moq}</span>
                    </div>
                  )}
                </div>

                <div className="catalog-actions">
                  {whatsappNumber ? (
                    <a
                      href={getWhatsAppLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full catalog-cta"
                    >
                      Inquire on WhatsApp
                    </a>
                  ) : (
                    <a href="#contact-form-section" className="btn btn-secondary w-full catalog-cta">
                      Enquire Now
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .catalog-section {
          background-color: var(--bg-light);
        }

        .catalog-card {
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .catalog-img-wrapper {
          position: relative;
          width: 100%;
          padding-top: 75%; /* 4:3 Aspect Ratio */
          overflow: hidden;
          background-color: #f3f4f6;
        }

        .catalog-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .catalog-card:hover .catalog-img {
          transform: scale(1.05);
        }

        .catalog-img-placeholder {
          width: 100%;
          padding-top: 75%;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .catalog-img-placeholder span {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3rem;
          font-weight: 800;
          color: white;
          opacity: 0.2;
        }

        .catalog-info {
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .catalog-item-name {
          font-size: 1.25rem;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        .catalog-item-desc {
          font-size: 0.95rem;
          color: #6b7280;
          margin-bottom: 1.25rem;
          flex-grow: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .catalog-meta {
          display: flex;
          gap: 1.5rem;
          border-top: 1px solid var(--border-color-light);
          padding-top: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .meta-label {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .price-value, .moq-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .catalog-actions {
          margin-top: auto;
        }

        .catalog-cta {
          font-size: 0.9rem;
          padding: 0.6rem 1.2rem;
        }
      `}</style>
    </section>
  );
}
