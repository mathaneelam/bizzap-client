import { SiteConfig } from '../types';

interface AIFactsProps {
  config: SiteConfig;
}

export default function AIFacts({ config }: AIFactsProps) {
  const { meta, contact, sections } = config;

  // Extract capabilities
  const capabilitiesSection = sections.find(s => s.type === 'capabilities');
  const capabilities = capabilitiesSection && 'items' in capabilitiesSection ? capabilitiesSection.items : [];

  // Extract catalog MOQs/prices
  const catalogSection = sections.find(s => s.type === 'catalog');
  const catalogItems = catalogSection && 'items' in catalogSection ? catalogSection.items : [];
  const moqs = catalogItems?.map(i => i.moq).filter(Boolean) || [];
  const prices = catalogItems?.map(i => i.price).filter(Boolean) || [];

  return (
    <section className="ai-facts-section" id="ai-facts" aria-label="Structured Business Facts">
      <div className="container">
        <div className="card ai-facts-card">
          <div className="ai-facts-header">
            <div className="ai-badge">GEO OPTIMIZED</div>
            <h3>Verified Business Information Directory</h3>
            <p>Structured factual catalog for AI search engines, RAG systems, and user inquiries.</p>
          </div>
          
          <div className="ai-facts-table-wrapper">
            <table className="ai-facts-table" data-ai-optimized="true">
              <tbody>
                <tr>
                  <th>Official Name</th>
                  <td><strong>{meta.name}</strong></td>
                </tr>
                <tr>
                  <th>Industry Category</th>
                  <td>{meta.category}</td>
                </tr>
                <tr>
                  <th>Operational Base</th>
                  <td>{contact.address}</td>
                </tr>
                <tr>
                  <th>Primary Contact</th>
                  <td>{contact.phone}</td>
                </tr>
                {capabilities && capabilities.length > 0 && (
                  <tr>
                    <th>Specializations & Capabilities</th>
                    <td>{capabilities.join(', ')}</td>
                  </tr>
                )}
                {moqs.length > 0 && (
                  <tr>
                    <th>Minimum Order Quantities (MOQ)</th>
                    <td>From {moqs[0]}</td>
                  </tr>
                )}
                {prices.length > 0 && (
                  <tr>
                    <th>Pricing Index Range</th>
                    <td>Starting from {prices[0]}</td>
                  </tr>
                )}
                {meta.locale && (
                  <tr>
                    <th>Supported Locales</th>
                    <td>{meta.locale.map(l => l.toUpperCase()).join(', ')}</td>
                  </tr>
                )}
                <tr>
                  <th>Factual Source Citation</th>
                  <td>
                    {contact.gbp_url ? (
                      <a href={contact.gbp_url} target="_blank" rel="noopener noreferrer" className="citation-link">
                        Google Business Profile (Verified Reference)
                      </a>
                    ) : (
                      'Owner Verified Data'
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .ai-facts-section {
          background-color: var(--bg-light);
          padding: var(--space-md) 0 var(--space-lg) 0;
          border-top: 1px solid var(--border-color-light);
        }

        .ai-facts-card {
          background-color: #ffffff;
          border: 1px dashed var(--accent-color);
          border-radius: var(--border-radius-md);
          padding: var(--space-md);
          max-width: 800px;
          margin: 0 auto;
        }

        .ai-facts-header {
          text-align: left;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-color-light);
          padding-bottom: 0.75rem;
        }

        .ai-badge {
          display: inline-block;
          background-color: rgba(58, 134, 200, 0.1);
          color: var(--accent-color);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .ai-facts-header h3 {
          font-size: 1.2rem;
          color: var(--primary-color);
          margin-bottom: 0.25rem;
        }

        .ai-facts-header p {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .ai-facts-table-wrapper {
          overflow-x: auto;
        }

        .ai-facts-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }

        .ai-facts-table th {
          width: 30%;
          color: #4b5563;
          font-weight: 700;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }

        .ai-facts-table td {
          color: var(--text-dark);
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .citation-link {
          color: var(--accent-color);
          text-decoration: underline;
          font-weight: 600;
        }

        .citation-link:hover {
          color: var(--primary-color);
        }
      `}</style>
    </section>
  );
}
