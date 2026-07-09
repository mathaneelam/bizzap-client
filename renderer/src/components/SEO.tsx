import { useEffect } from 'react';
import { SiteConfig } from '../types';

interface SEOProps {
  config: SiteConfig;
}

export default function SEO({ config }: SEOProps) {
  const { seo, meta, contact } = config;

  useEffect(() => {
    // 1. Set document title
    document.title = seo.title;

    // 2. Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', seo.meta_description);

    // 3. Set keywords
    if (seo.keywords && seo.keywords.length > 0) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', seo.keywords.join(', '));
    }

    // 4. Set Schema.org JSON-LD
    if (seo.localbusiness_jsonld !== false) {
      let scriptLd = document.getElementById('jsonld-localbusiness') as HTMLScriptElement;
      if (!scriptLd) {
        scriptLd = document.createElement('script');
        scriptLd.id = 'jsonld-localbusiness';
        scriptLd.type = 'application/ld+json';
        document.head.appendChild(scriptLd);
      }

      // Determine specific Schema.org type based on template
      let schemaType = 'LocalBusiness';
      if (config.template === 'manufacturer') {
        schemaType = 'ManufacturingBusiness';
      } else if (config.template === 'clinic') {
        schemaType = 'MedicalBusiness';
      } else if (config.template === 'food') {
        schemaType = 'FoodEstablishment';
      }

      // Extract capabilities for KnowsAbout (GEO/AI search friendly)
      const capSection = config.sections.find(s => s.type === 'capabilities');
      const capabilities = capSection && 'items' in capSection ? capSection.items : [];

      // Extract pricing index for PriceRange
      const catSection = config.sections.find(s => s.type === 'catalog');
      const catalogItems = catSection && 'items' in catSection ? catSection.items : [];
      const priceList = catalogItems?.map(i => i.price).filter(Boolean) || [];
      const priceRangeValue = priceList.length > 0 ? '$$' : '$$';

      // Social URLs
      const sameAs: string[] = [];
      if (contact.socials?.instagram) sameAs.push(contact.socials.instagram);
      if (contact.socials?.facebook) sameAs.push(contact.socials.facebook);

      const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        'name': meta.name,
        'description': meta.description,
        'image': themeImage(config),
        'telephone': contact.phone,
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': contact.address,
          'addressLocality': 'Tiruppur',
          'addressRegion': 'Tamil Nadu',
          'addressCountry': 'IN',
        },
        'areaServed': [
          { '@type': 'AdministrativeArea', 'name': 'Tiruppur' },
          { '@type': 'AdministrativeArea', 'name': 'Tamil Nadu' }
        ],
        'priceRange': priceRangeValue,
        'knowsAbout': capabilities,
        'sameAs': sameAs.length > 0 ? sameAs : undefined,
      };

      if (contact.geo && contact.geo.lat && contact.geo.lng) {
        jsonLd.geo = {
          '@type': 'GeoCoordinates',
          'latitude': contact.geo.lat,
          'longitude': contact.geo.lng,
        };
      }

      if (contact.hours) {
        // Convert simple hours object to Schema.org openingHoursSpecification
        const daysMap: Record<string, string> = {
          mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
          fri: 'Friday', sat: 'Saturday', sun: 'Sunday', mon_sat: 'Monday-Saturday'
        };
        
        jsonLd.openingHoursSpecification = Object.entries(contact.hours).map(([key, value]) => {
          const dayOfWeek = daysMap[key] || key;
          return {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': dayOfWeek.includes('-') ? dayOfWeek.split('-') : dayOfWeek,
            'opens': value.toLowerCase() === 'closed' ? '00:00' : value.split('–')[0] || '09:00',
            'closes': value.toLowerCase() === 'closed' ? '00:00' : value.split('–')[1] || '18:00',
          };
        });
      }

      scriptLd.textContent = JSON.stringify(jsonLd, null, 2);
    }
  }, [config, seo, meta, contact]);

  return null; // Side-effect component, renders nothing in the body
}

function themeImage(config: SiteConfig): string {
  if (config.theme.logo) {
    return config.theme.logo;
  }
  const heroSection = config.sections.find(s => s.type === 'hero');
  if (heroSection && 'image' in heroSection && heroSection.image) {
    return heroSection.image;
  }
  return '';
}
