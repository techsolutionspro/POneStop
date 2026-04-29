export interface BlockData {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  order: number;
}

export type BlockType =
  | 'hero'
  | 'services'
  | 'about'
  | 'team'
  | 'testimonials'
  | 'faq'
  | 'location'
  | 'contact'
  | 'cta'
  | 'text'
  | 'gallery';

export interface SiteConfig {
  pharmacyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  phone?: string;
  email?: string;
  address?: string;
  gphcNumber?: string;
  blocks: BlockData[];
}

export const BLOCK_TEMPLATES: Record<BlockType, { label: string; icon: string; defaultContent: Record<string, any> }> = {
  hero: {
    label: 'Hero Banner',
    icon: 'Layout',
    defaultContent: { heading: 'Expert Healthcare, Your Way', subheading: 'Book a consultation or order treatments online.', ctaPrimary: 'Book Now', ctaSecondary: 'Shop Online', imageUrl: '' },
  },
  services: {
    label: 'Services Grid',
    icon: 'Grid3x3',
    defaultContent: { heading: 'Our Services', subheading: 'Clinically-approved treatments delivered by qualified professionals', showPrices: true, columns: 3 },
  },
  about: {
    label: 'About Us',
    icon: 'Info',
    defaultContent: { heading: 'About Our Pharmacy', text: 'We are a trusted community pharmacy providing professional healthcare services.', imageUrl: '' },
  },
  team: {
    label: 'Our Team',
    icon: 'Users',
    defaultContent: { heading: 'Meet the Team', members: [{ name: 'Dr. Pharmacist', role: 'Lead Pharmacist', imageUrl: '' }] },
  },
  testimonials: {
    label: 'Testimonials',
    icon: 'MessageSquare',
    defaultContent: { heading: 'What Our Patients Say', reviews: [{ text: 'Excellent service!', author: 'Patient', rating: 5 }] },
  },
  faq: {
    label: 'FAQ',
    icon: 'HelpCircle',
    defaultContent: { heading: 'Common Questions', items: [{ question: 'How do I book?', answer: 'Click the Book Now button.' }] },
  },
  location: {
    label: 'Location & Hours',
    icon: 'MapPin',
    defaultContent: { heading: 'Find Us', showMap: true, showHours: true },
  },
  contact: {
    label: 'Contact Form',
    icon: 'Mail',
    defaultContent: { heading: 'Get in Touch', showPhone: true, showEmail: true, showForm: true },
  },
  cta: {
    label: 'Call to Action',
    icon: 'Zap',
    defaultContent: { heading: 'Ready to Get Started?', subheading: 'Book your appointment today.', buttonText: 'Book Now', buttonLink: '/book' },
  },
  text: {
    label: 'Text Block',
    icon: 'Type',
    defaultContent: { heading: '', text: 'Enter your content here...' },
  },
  gallery: {
    label: 'Image Gallery',
    icon: 'Image',
    defaultContent: { heading: 'Our Pharmacy', images: [] },
  },
};

export const TEMPLATES = [
  {
    id: 'modern-clinic',
    name: 'Modern Clinic',
    description: 'Clean, minimal design perfect for clinical services',
    blocks: ['hero', 'services', 'about', 'team', 'testimonials', 'faq', 'location', 'cta'] as BlockType[],
  },
  {
    id: 'weight-loss-focused',
    name: 'Weight-Loss Focused',
    description: 'Optimised for weight management clinics with Wegovy/Mounjaro',
    blocks: ['hero', 'services', 'testimonials', 'faq', 'about', 'cta'] as BlockType[],
  },
  {
    id: 'trusted-high-street',
    name: 'Trusted High Street',
    description: 'Warm, community feel for established pharmacies',
    blocks: ['hero', 'about', 'services', 'team', 'location', 'testimonials', 'contact'] as BlockType[],
  },
];
