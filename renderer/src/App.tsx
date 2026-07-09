import { useEffect } from 'react';
import './theme/tokens.css';
import siteJson from './current-site.json';
import { SiteConfig } from './types';
import SEO from './components/SEO';
import WhatsAppButton from './components/WhatsAppButton';
import ManufacturerTemplate from './templates/ManufacturerTemplate';
import ShopTemplate from './templates/ShopTemplate';
import ClinicTemplate from './templates/ClinicTemplate';
import FoodTemplate from './templates/FoodTemplate';
import ServicesTemplate from './templates/ServicesTemplate';

// Cast JSON import to type-safe interface
const config = siteJson as unknown as SiteConfig;

export default function App() {
  const { theme } = config;

  useEffect(() => {
    // 1. Inject CSS variables into root element
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--font-head', `'${theme.font_head}', sans-serif`);
    root.style.setProperty('--font-body', `'${theme.font_body}', sans-serif`);

    // 2. Load Google Fonts dynamically
    const fontsToLoad = [theme.font_head, theme.font_body].filter(Boolean);
    if (fontsToLoad.length > 0) {
      const fontQueryString = fontsToLoad
        .map(f => `family=${f.replace(/\s+/g, '+')}:wght@400;500;600;700`)
        .join('&');
      
      const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontQueryString}&display=swap`;
      
      let linkElement = document.getElementById('google-fonts-link') as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.id = 'google-fonts-link';
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
      }
      linkElement.href = googleFontsUrl;
    }
  }, [theme]);

  // Render template based on configuration
  const renderTemplate = () => {
    switch (config.template) {
      case 'manufacturer':
        return <ManufacturerTemplate config={config} />;
      case 'shop':
        return <ShopTemplate config={config} />;
      case 'clinic':
        return <ClinicTemplate config={config} />;
      case 'food':
        return <FoodTemplate config={config} />;
      case 'services':
        return <ServicesTemplate config={config} />;
      default:
        // Fallback to services
        return <ServicesTemplate config={config} />;
    }
  };

  return (
    <>
      <SEO config={config} />
      {renderTemplate()}
      <WhatsAppButton config={config} />
    </>
  );
}
