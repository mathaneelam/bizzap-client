import React, { useState } from 'react';
import { SiteConfig } from '../types';

interface ContactFormProps {
  config: SiteConfig;
}

export default function ContactForm({ config }: ContactFormProps) {
  const { contact } = config;
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const whatsappNumber = contact.whatsapp || contact.phone;
    if (whatsappNumber) {
      // Clean phone number (keep digits only)
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
      
      // Compile message
      const text = `*New Website Inquiry*\n\n` +
                   `*Name:* ${formData.name}\n` +
                   `*Phone:* ${formData.phone}\n` +
                   `*Email:* ${formData.email || 'N/A'}\n` +
                   `*Message:* ${formData.message}`;
      
      const encodedText = encodeURIComponent(text);
      const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

      // Redirect after a brief delay to show success state
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 1500);
    }
  };

  return (
    <div className="contact-form-container card" id="contact-form-section">
      {submitted ? (
        <div className="form-success animate-fade-in">
          <div className="success-icon">✓</div>
          <h3>Thank you, {formData.name}!</h3>
          <p>Your inquiry details have been saved.</p>
          {contact.whatsapp || contact.phone ? (
            <p className="redirect-note">Redirecting you to WhatsApp to complete your message...</p>
          ) : (
            <p>We will get back to you as soon as possible.</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Kumar"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Mobile Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. name@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message / Requirement *</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Describe what you are looking for..."
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Send Inquiry
          </button>
        </form>
      )}

      <style>{`
        .contact-form-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          text-align: left;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color-light);
          border-radius: var(--border-radius-sm);
          font-family: var(--font-body);
          font-size: 1rem;
          background-color: var(--bg-light);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(58, 134, 200, 0.15);
        }

        .w-full {
          width: 100%;
        }

        .form-success {
          text-align: center;
          padding: var(--space-md) 0;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          background-color: var(--success-color);
          color: white;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: var(--space-sm);
        }

        .form-success h3 {
          margin-bottom: var(--space-xs);
          color: var(--success-color);
        }

        .redirect-note {
          font-size: 0.9rem;
          color: #6b7280;
          margin-top: 0.5rem;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
