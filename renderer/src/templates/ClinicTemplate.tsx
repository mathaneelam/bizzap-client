import { SiteConfig } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../sections/Hero';
import About from '../sections/About';
import Catalog from '../sections/Catalog';
import Gallery from '../sections/Gallery';
import Testimonials from '../sections/Testimonials';
import ContactForm from '../components/ContactForm';
import AIFacts from '../components/AIFacts';

interface TemplateProps {
  config: SiteConfig;
}

export default function ClinicTemplate({ config }: TemplateProps) {
  return (
    <div className="template-clinic">
      <Header config={config} />
      
      <main>
        {config.sections.map((section, idx) => {
          switch (section.type) {
            case 'hero':
              return <Hero key={idx} section={section} config={config} />;
            case 'about':
              return <About key={idx} section={section} config={config} />;
            case 'catalog':
              // Catalog acts as "Our Treatments / Doctors"
              return <Catalog key={idx} section={section} config={config} />;
            case 'gallery':
              return <Gallery key={idx} section={section} />;
            case 'testimonials':
              return <Testimonials key={idx} section={section} />;
            default:
              return null;
          }
        })}

        {/* Contact Form Section */}
        <section className="section-padding text-center" style={{ backgroundColor: '#ffffff' }}>
          <div className="container">
            <div className="section-header">
              <h2>Book an Appointment</h2>
              <p>Schedule a visit with our specialists. We will confirm your slot via WhatsApp or call.</p>
            </div>
            <ContactForm config={config} />
          </div>
        </section>
        
        {/* GEO AI-Facts directory info */}
        <AIFacts config={config} />
      </main>

      <Footer config={config} />
    </div>
  );
}
