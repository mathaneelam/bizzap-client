import { SiteConfig } from '../types';

interface WhatsAppButtonProps {
  config: SiteConfig;
}

export default function WhatsAppButton({ config }: WhatsAppButtonProps) {
  const { contact, meta } = config;
  const phoneNumber = contact.whatsapp || contact.phone;

  if (!phoneNumber) return null;

  // Clean phone number for URL (remove +, spaces, dashes)
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

  // Pre-fill message based on language locale
  const isTamil = meta.locale?.includes('ta');
  const defaultMessage = isTamil
    ? `வணக்கம் ${meta.name}, உங்கள் சேவைகள்/தயாரிப்புகள் பற்றி விசாரிக்க விரும்புகிறேன்.`
    : `Hi ${meta.name}, I saw your website and would like to make an inquiry.`;

  const encodedText = encodeURIComponent(defaultMessage);
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

  return (
    <>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        id="whatsapp-float-btn"
        aria-label="Contact us on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          width="24"
          height="24"
          fill="currentColor"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 496l133.9-35.1c32.7 17.8 69.4 27.2 107.1 27.2 122.4 0 222-99.6 222-222 0-59.3-23-115.1-65.1-157.1zM223.9 448c-33.2 0-65.7-8.9-94-25.7l-6.7-4-79.8 20.9 21.3-77.8-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.8-186.6 184.8zm101.7-138.7c-5.5-2.7-32.9-16.2-38-18.1-5.1-1.9-8.8-2.7-12.5 2.7-3.7 5.5-14.3 18.1-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>
        <span className="whatsapp-tooltip">Chat with us</span>
      </a>

      <style>{`
        .whatsapp-float {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background-color: #25d366;
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }

        .whatsapp-float:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .whatsapp-tooltip {
          position: absolute;
          right: 70px;
          background-color: #333;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
          pointer-events: none;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .whatsapp-float:hover .whatsapp-tooltip {
          opacity: 1;
          visibility: visible;
        }

        /* Pulse animation */
        @keyframes whatsapp-pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }

        .whatsapp-float {
          animation: whatsapp-pulse 2s infinite;
        }
      `}</style>
    </>
  );
}
