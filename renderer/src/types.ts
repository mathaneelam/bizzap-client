export interface SectionBase {
  type: 'hero' | 'about' | 'catalog' | 'capabilities' | 'gallery' | 'testimonials' | 'contact';
}

export interface HeroSection extends SectionBase {
  type: 'hero';
  headline?: string;
  sub?: string;
  cta?: string;
  image?: string;
}

export interface AboutSection extends SectionBase {
  type: 'about';
  body?: string;
  stats?: Array<{ k: string; v: string }>;
}

export interface CatalogItem {
  name: string;
  image?: string;
  moq?: string;
  price?: string;
  desc?: string;
}

export interface CatalogSection extends SectionBase {
  type: 'catalog';
  items?: CatalogItem[];
}

export interface CapabilitiesSection extends SectionBase {
  type: 'capabilities';
  items?: string[];
}

export interface GallerySection extends SectionBase {
  type: 'gallery';
  images?: string[];
}

export interface TestimonialItem {
  quote: string;
  by: string;
}

export interface TestimonialsSection extends SectionBase {
  type: 'testimonials';
  items?: TestimonialItem[];
}

export interface ContactSection extends SectionBase {
  type: 'contact';
  form?: boolean;
}

export type Section =
  | HeroSection
  | AboutSection
  | CatalogSection
  | CapabilitiesSection
  | GallerySection
  | TestimonialsSection
  | ContactSection;

export interface SiteMeta {
  name: string;
  category: string;
  tagline: string;
  description: string;
  locale?: string[];
}

export interface SiteTheme {
  preset?: string;
  primary: string;
  accent: string;
  font_head: string;
  font_body: string;
  logo?: string;
}

export interface ContactGeo {
  lat?: number;
  lng?: number;
}

export interface ContactSocials {
  instagram?: string;
  facebook?: string;
}

export interface SiteContact {
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  geo?: ContactGeo;
  hours?: Record<string, string>;
  gbp_url?: string;
  socials?: ContactSocials;
}

export interface SiteSEO {
  title: string;
  meta_description: string;
  keywords?: string[];
  localbusiness_jsonld?: boolean;
}

export interface SiteSource {
  place_ref?: string;
  scraped_at?: string;
  reviews_used?: number;
  generated_by: 'claude-manual' | 'claude-sonnet-5-api' | 'human';
  human_approved: boolean;
}

export interface SiteConfig {
  schema_version: 1;
  slug: string;
  template: 'manufacturer' | 'shop' | 'clinic' | 'food' | 'services';
  meta: SiteMeta;
  theme: SiteTheme;
  contact: SiteContact;
  sections: Section[];
  seo: SiteSEO;
  source: SiteSource;
}
