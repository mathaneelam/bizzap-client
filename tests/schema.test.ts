import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const resolvePath = (...segments: string[]) => path.resolve(__dirname, '..', ...segments);

const schema = JSON.parse(fs.readFileSync(resolvePath('schema', 'site.schema.json'), 'utf8'));

function createValidator() {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

describe('JSON Schema Validation', () => {
  it('should validate a valid site.json', () => {
    const validate = createValidator();
    
    // Standard mock configuration representing a valid site.json
    const validConfig = {
      schema_version: 1,
      slug: "sri-vinayak-cotsyn",
      template: "manufacturer",
      meta: {
        name: "Sri Vinayak Cotsyn",
        category: "Garment Manufacturer",
        tagline: "Export-quality knitwear from Tiruppur since 1998",
        description: "Leading manufacturer of knitwear garments and exporters.",
        locale: ["en", "ta"]
      },
      theme: {
        preset: "navy",
        primary: "#0a1628",
        accent: "#1889f6",
        font_head: "Montserrat",
        font_body: "Inter",
        logo: "assets/logo.png"
      },
      contact: {
        phone: "+919876543210",
        whatsapp: "+919876543210",
        email: "info@srivinayak.com",
        address: "SIDCO Industrial Estate, Tiruppur, TN 641604",
        geo: { "lat": 11.108, "lng": 77.341 },
        hours: { "mon_sat": "9:30–18:30", "sun": "closed" },
        gbp_url: "https://maps.google.com/123",
        socials: { "instagram": "https://instagram.com", "facebook": "" }
      },
      sections: [
        { "type": "hero", "headline": "Premium Cotton Wear", "sub": "Best in class", "cta": "Get a quote", "image": "assets/hero.jpg" },
        { "type": "about", "body": "Quality since 1998", "stats": [{"k":"Since","v":"1998"},{"k":"Capacity","v":"50k"}] }
      ],
      seo: {
        title: "Sri Vinayak Cotsyn | Garment Manufacturer",
        meta_description: "Premium cotton wear and knitwear garments from Tiruppur since 1998.",
        keywords: ["knitwear manufacturer", "tiruppur exporter"]
      },
      source: {
        place_ref: "places/123",
        scraped_at: "2026-07-09T10:00:00Z",
        reviews_used: 12,
        generated_by: "claude-manual",
        human_approved: false
      }
    };

    const valid = validate(validConfig);
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should fail validation if required fields are missing', () => {
    const validate = createValidator();
    
    // Missing 'slug' and 'template'
    const invalidConfig = {
      schema_version: 1,
      meta: {
        name: "Invalid Business",
        category: "Shop",
        tagline: "No slug here",
        description: "Wait, where is the slug?"
      }
    };

    const valid = validate(invalidConfig);
    expect(valid).toBe(false);
    expect(validate.errors).not.toBeNull();
    
    // Verify specific error keywords
    const missingProperties = validate.errors?.map(e => e.params.missingProperty);
    expect(missingProperties).toContain('slug');
    expect(missingProperties).toContain('template');
  });

  it('should reject invalid hex colors in theme config', () => {
    const validate = createValidator();
    
    const invalidColorConfig = {
      schema_version: 1,
      slug: "bad-color",
      template: "shop",
      meta: {
        name: "Shop",
        category: "Retail",
        tagline: "Tagline",
        description: "Desc"
      },
      theme: {
        primary: "not-a-color", // Bad hex format
        accent: "#123",       // Too short (needs 6 digits in schema pattern)
        font_head: "Roboto",
        font_body: "Inter"
      },
      contact: {
        phone: "1234567890",
        address: "Main Road"
      },
      sections: [{ "type": "hero" }],
      seo: {
        title: "Title",
        meta_description: "Description"
      },
      source: {
        generated_by: "human",
        human_approved: true
      }
    };

    const valid = validate(invalidColorConfig);
    expect(valid).toBe(false);
    
    const errorPaths = validate.errors?.map(e => e.instancePath);
    expect(errorPaths).toContain('/theme/primary');
    expect(errorPaths).toContain('/theme/accent');
  });

  it('should reject invalid template names', () => {
    const validate = createValidator();
    
    const invalidTemplateConfig = {
      schema_version: 1,
      slug: "invalid-template",
      template: "unknown-template-type", // Invalid enum value
      meta: {
        name: "Name",
        category: "Category",
        tagline: "Tagline",
        description: "Desc"
      },
      theme: {
        primary: "#ffffff",
        accent: "#000000",
        font_head: "Roboto",
        font_body: "Inter"
      },
      contact: {
        phone: "123",
        address: "Address"
      },
      sections: [{ "type": "hero" }],
      seo: {
        title: "Title",
        meta_description: "Description"
      },
      source: {
        generated_by: "human",
        human_approved: true
      }
    };

    const valid = validate(invalidTemplateConfig);
    expect(valid).toBe(false);
    
    const errors = validate.errors || [];
    const templateError = errors.find(e => e.instancePath === '/template');
    expect(templateError).toBeDefined();
    expect(templateError?.message).toContain('must be equal to one of the allowed values');
  });
});
