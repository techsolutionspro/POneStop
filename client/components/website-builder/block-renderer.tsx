'use client';

import { BlockData } from './types';

interface BlockRendererProps {
  block: BlockData;
  primaryColor: string;
  pharmacyName: string;
  isPreview?: boolean;
  onEdit?: () => void;
}

export function BlockRenderer({ block, primaryColor, pharmacyName, isPreview, onEdit }: BlockRendererProps) {
  const c = block.content;

  const wrapper = (children: React.ReactNode) => (
    <div className={`relative group ${isPreview ? 'cursor-pointer hover:ring-2 hover:ring-teal-400 hover:ring-offset-2 rounded-lg transition-all' : ''}`}
      onClick={isPreview ? onEdit : undefined}>
      {isPreview && (
        <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
          Click to edit
        </div>
      )}
      {children}
    </div>
  );

  switch (block.type) {
    case 'hero':
      return wrapper(
        <div className="py-20 px-8 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">{c.heading || 'Your Headline'}</h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">{c.subheading || 'Your subheading'}</p>
          <div className="flex gap-3 justify-center">
            {c.ctaPrimary && <button className="px-6 py-3 bg-white font-semibold rounded-lg text-sm" style={{ color: primaryColor }}>{c.ctaPrimary}</button>}
            {c.ctaSecondary && <button className="px-6 py-3 border border-white/40 text-white font-semibold rounded-lg text-sm">{c.ctaSecondary}</button>}
          </div>
        </div>
      );

    case 'services':
      return wrapper(
        <div className="py-16 px-8 bg-white">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">{c.heading || 'Our Services'}</h2>
            {c.subheading && <p className="text-gray-500 mt-2">{c.subheading}</p>}
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {['Weight Management', 'Travel Health', 'Flu Vaccination'].map((s, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                  {['💉', '✈️', '💊'][i]}
                </div>
                <h3 className="font-semibold mb-1">{s}</h3>
                <p className="text-sm text-gray-500">Professional care from qualified pharmacists.</p>
                {c.showPrices && <div className="mt-3 font-bold text-sm" style={{ color: primaryColor }}>From £{[149, 35, 14.99][i]}</div>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'about':
      return wrapper(
        <div className="py-16 px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto flex gap-12 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">{c.heading || 'About Us'}</h2>
              <p className="text-gray-600 leading-relaxed">{c.text || 'Tell your story...'}</p>
            </div>
            <div className="w-64 h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm flex-shrink-0">
              {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : 'Pharmacy Image'}
            </div>
          </div>
        </div>
      );

    case 'team':
      return wrapper(
        <div className="py-16 px-8 bg-white">
          <h2 className="text-2xl font-bold text-center mb-10">{c.heading || 'Our Team'}</h2>
          <div className="flex gap-8 justify-center">
            {(c.members || [{ name: 'Team Member', role: 'Pharmacist' }]).map((m: any, i: number) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                  {m.name?.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="font-semibold text-sm">{m.name}</div>
                <div className="text-xs text-gray-500">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonials':
      return wrapper(
        <div className="py-16 px-8 bg-gray-50">
          <h2 className="text-2xl font-bold text-center mb-10">{c.heading || 'What Patients Say'}</h2>
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(c.reviews || [{ text: 'Great service!', author: 'Patient', rating: 5 }]).map((r: any, i: number) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-yellow-400 mb-2">{'★'.repeat(r.rating || 5)}</div>
                <p className="text-sm text-gray-700 mb-3 italic">&ldquo;{r.text}&rdquo;</p>
                <div className="text-xs text-gray-500 font-medium">{r.author}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return wrapper(
        <div className="py-16 px-8 bg-white">
          <h2 className="text-2xl font-bold text-center mb-10">{c.heading || 'FAQ'}</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {(c.items || [{ question: 'How do I book?', answer: 'Click Book Now.' }]).map((f: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="font-semibold text-sm">{f.question}</div>
                <div className="text-sm text-gray-500 mt-2">{f.answer}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'location':
      return wrapper(
        <div className="py-16 px-8 bg-gray-50">
          <h2 className="text-2xl font-bold text-center mb-10">{c.heading || 'Find Us'}</h2>
          <div className="max-w-3xl mx-auto flex gap-8">
            <div className="flex-1 h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">Google Maps Embed</div>
            <div className="flex-1">
              <h3 className="font-semibold mb-3">{pharmacyName}</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>123 High Street, Manchester, M1 1AA</div>
                <div>Mon-Fri: 9am-6pm | Sat: 9am-2pm</div>
                <div>0161 123 4567</div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'contact':
      return wrapper(
        <div className="py-16 px-8 bg-white">
          <h2 className="text-2xl font-bold text-center mb-10">{c.heading || 'Contact Us'}</h2>
          <div className="max-w-md mx-auto space-y-4">
            <input className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" placeholder="Your Name" disabled={isPreview} />
            <input className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" placeholder="Email" disabled={isPreview} />
            <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" rows={4} placeholder="Message" disabled={isPreview} />
            <button className="w-full py-3 text-white font-semibold rounded-lg text-sm" style={{ background: primaryColor }}>Send Message</button>
          </div>
        </div>
      );

    case 'cta':
      return wrapper(
        <div className="py-16 px-8 text-center text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
          <h2 className="text-2xl font-bold mb-3">{c.heading || 'Ready to Start?'}</h2>
          <p className="text-white/80 mb-6">{c.subheading || 'Book your appointment today.'}</p>
          <button className="px-8 py-3 bg-white font-semibold rounded-lg text-sm" style={{ color: primaryColor }}>{c.buttonText || 'Book Now'}</button>
        </div>
      );

    case 'text':
      return wrapper(
        <div className="py-12 px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            {c.heading && <h2 className="text-2xl font-bold mb-4">{c.heading}</h2>}
            <p className="text-gray-600 leading-relaxed">{c.text || 'Your content here...'}</p>
          </div>
        </div>
      );

    case 'gallery':
      return wrapper(
        <div className="py-16 px-8 bg-gray-50">
          {c.heading && <h2 className="text-2xl font-bold text-center mb-10">{c.heading}</h2>}
          <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">Image {i + 1}</div>
            ))}
          </div>
        </div>
      );

    default:
      return <div className="py-8 px-8 bg-gray-100 text-center text-gray-400 text-sm">Unknown block: {block.type}</div>;
  }
}
