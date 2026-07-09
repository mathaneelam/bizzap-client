import { GallerySection } from '../types';

interface GalleryProps {
  section: GallerySection;
}

export default function Gallery({ section }: GalleryProps) {
  const images = section.images || [];

  if (images.length === 0) return null;

  return (
    <section className="gallery-section section-padding" id="gallery">
      <div className="container">
        <div className="section-header">
          <h2>Gallery & Infrastructure</h2>
          <p>Get an inside look at our facilities, operations, and quality standards.</p>
        </div>

        <div className="grid grid-3 gallery-grid">
          {images.map((image, index) => (
            <div key={index} className="gallery-item-wrapper card">
              <img src={image} alt={`Gallery Infrastructure ${index + 1}`} className="gallery-img" />
              <div className="gallery-overlay">
                <span className="gallery-zoom-icon">+</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .gallery-section {
          background-color: #ffffff;
        }

        .gallery-grid {
          gap: var(--space-sm);
        }

        .gallery-item-wrapper {
          padding: 0;
          position: relative;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          border-radius: var(--border-radius-md);
          cursor: pointer;
        }

        .gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .gallery-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(13, 27, 42, 0.4);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity var(--transition-fast);
        }

        .gallery-zoom-icon {
          color: white;
          font-size: 2rem;
          font-weight: 300;
          border: 1px solid white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: scale(0.8);
          transition: transform var(--transition-normal);
        }

        .gallery-item-wrapper:hover .gallery-img {
          transform: scale(1.05);
        }

        .gallery-item-wrapper:hover .gallery-overlay {
          opacity: 1;
        }

        .gallery-item-wrapper:hover .gallery-zoom-icon {
          transform: scale(1);
        }
      `}</style>
    </section>
  );
}
