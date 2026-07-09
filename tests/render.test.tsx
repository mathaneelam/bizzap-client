import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SiteConfig } from '../renderer/src/types';
import SEO from '../renderer/src/components/SEO';
import WhatsAppButton from '../renderer/src/components/WhatsAppButton';
import ContactForm from '../renderer/src/components/ContactForm';
import AIFacts from '../renderer/src/components/AIFacts';
import ManufacturerTemplate from '../renderer/src/templates/ManufacturerTemplate';
import ShopTemplate from '../renderer/src/templates/ShopTemplate';

// Common test mock data
const mockConfig: SiteConfig = {
  schema_version: 1,
  slug: "test-biz",
  template: "manufacturer",
  meta: {
    name: "Tiruppur Test Shop",
    category: "Garment Maker",
    tagline: "Test Tagline",
    description: "Test Description",
    locale: ["en"]
  },
  theme: {
    primary: "#000000",
    accent: "#ff0000",
    font_head: "Montserrat",
    font_body: "Inter"
  },
  contact: {
    phone: "+919999999999",
    whatsapp: "+918888888888",
    address: "Tiruppur TN",
    hours: { "mon_sat": "9:00-18:00" },
    gbp_url: "https://maps.google.com"
  },
  sections: [
    { type: "hero", headline: "Welcome to Test", sub: "Sub welcome", cta: "Inquire", image: "test.jpg" },
    { type: "about", body: "About us text", stats: [{ k: "Exports", v: "10" }] },
    { type: "capabilities", items: ["Fast Delivery", "Organic Cotton"] }
  ],
  seo: {
    title: "SEO Shop Title",
    meta_description: "SEO Description",
    keywords: ["test", "tiruppur"]
  },
  source: {
    generated_by: "human",
    human_approved: true
  }
};

describe('SEO Component', () => {
  beforeEach(() => {
    // Clear head elements before each test
    document.head.innerHTML = '';
    document.title = '';
  });

  it('injects title, description, and keywords into head', () => {
    render(<SEO config={mockConfig} />);
    
    expect(document.title).toBe("SEO Shop Title");
    
    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc).not.toBeNull();
    expect(metaDesc?.getAttribute('content')).toBe("SEO Description");
    
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    expect(metaKeywords).not.toBeNull();
    expect(metaKeywords?.getAttribute('content')).toBe("test, tiruppur");
  });

  it('injects schema.org LocalBusiness JSON-LD correctly', () => {
    render(<SEO config={mockConfig} />);
    
    const scriptLd = document.getElementById('jsonld-localbusiness') as HTMLScriptElement;
    expect(scriptLd).not.toBeNull();
    expect(scriptLd.type).toBe("application/ld+json");
    
    const parsedData = JSON.parse(scriptLd.textContent || '{}');
    expect(parsedData['@context']).toBe('https://schema.org');
    expect(parsedData['@type']).toBe('ManufacturingBusiness'); // derived from manufacturer template
    expect(parsedData.name).toBe("Tiruppur Test Shop");
    expect(parsedData.telephone).toBe("+919999999999");
    expect(parsedData.address.streetAddress).toBe("Tiruppur TN");
    
    // GEO checks
    expect(parsedData.knowsAbout).toContain("Fast Delivery");
    expect(parsedData.knowsAbout).toContain("Organic Cotton");
    expect(parsedData.areaServed[0].name).toBe("Tiruppur");
    expect(parsedData.priceRange).toBe("$$");
  });
});

describe('WhatsAppButton Component', () => {
  it('renders a floating WhatsApp button with correct link and text', () => {
    render(<WhatsAppButton config={mockConfig} />);
    
    const btn = document.getElementById('whatsapp-float-btn') as HTMLAnchorElement;
    expect(btn).not.toBeNull();
    expect(btn.href).toContain('https://wa.me/918888888888'); // whatsapp phone preferred
    expect(btn.href).toContain(encodeURIComponent('Hi Tiruppur Test Shop, I saw your website and would like to make an inquiry.'));
  });
});

describe('ContactForm Component', () => {
  it('renders form fields and submit button', () => {
    render(<ContactForm config={mockConfig} />);
    
    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Mobile Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Message/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Send Inquiry/i })).toBeDefined();
  });
});

describe('AIFacts Component', () => {
  it('renders structured GEO business directory facts', () => {
    render(<AIFacts config={mockConfig} />);
    
    expect(screen.getByText("Verified Business Information Directory")).toBeDefined();
    expect(screen.getByText("Tiruppur Test Shop")).toBeDefined();
    expect(screen.getByText("Tiruppur TN")).toBeDefined();
    expect(screen.getByText("Fast Delivery, Organic Cotton")).toBeDefined();
  });
});

describe('Templates Rendering & Snapshots', () => {
  it('renders ManufacturerTemplate correctly', () => {
    const { container } = render(<ManufacturerTemplate config={mockConfig} />);
    
    // Check if hero title is rendered
    expect(screen.getByText("Welcome to Test")).toBeDefined();
    
    // Check if about body is rendered
    expect(screen.getByText("About us text")).toBeDefined();
    
    // Check if capability is rendered
    expect(screen.getByText("Organic Cotton")).toBeDefined();
    
    // Check if request quote title is rendered
    expect(screen.getByText("Request a Quote")).toBeDefined();

    // Snapshot matching to ensure structure remains identical
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders ShopTemplate correctly', () => {
    const shopConfig = { ...mockConfig, template: 'shop' as const };
    const { container } = render(<ShopTemplate config={shopConfig} />);
    
    // Check if hero title is rendered
    expect(screen.getByText("Welcome to Test")).toBeDefined();
    
    // Check if about body is rendered
    expect(screen.getByText("About us text")).toBeDefined();

    // Snapshot matching
    expect(container.firstChild).toMatchSnapshot();
  });
});
