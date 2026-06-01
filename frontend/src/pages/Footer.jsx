import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext.jsx'
import { t } from '../utils/translations.js'

export default function Footer() {
  const { lang, toggleLang } = useLang()

  const LINKS = {
    [lang === 'hi' ? 'त्वरित लिंक' : 'Quick Links']: [
      { to: '/products', label: t(lang, 'products') },
      { to: '/services', label: t(lang, 'services') },
      { to: '/courses', label: t(lang, 'courses') },
      { to: '/star-worker', label: t(lang, 'star_worker') },
      { to: '/about', label: t(lang, 'about') }
    ],
    [lang === 'hi' ? 'खाता' : 'Account']: [
      { to: '/login', label: t(lang, 'login') },
      { to: '/register', label: t(lang, 'register') },
      { to: '/seller/dashboard', label: lang === 'hi' ? 'विक्रेता डैशबोर्ड' : 'Seller Dashboard' },
      { to: '/customer/dashboard', label: lang === 'hi' ? 'ग्राहक डैशबोर्ड' : 'Customer Dashboard' }
    ],
    [lang === 'hi' ? 'सहायता' : 'Support']: [
      { to: '/support', label: lang === 'hi' ? 'सहायता केंद्र' : 'Help Center' },
      { to: '/terms', label: lang === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions' },
      { to: '/privacy', label: lang === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy' },
      { to: '/support', label: lang === 'hi' ? 'हमसे संपर्क करें' : 'Contact Us' }
    ]
  }

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-dark text-white mt-12">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold">PN</span>
              </div>
              <div>
                <div className="font-display text-xl font-bold">ProgressiveNari</div>
                <div className="text-xs text-accent">🌸 Empowering Women</div>
              </div>
            </Link>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs">
              {lang === 'hi'
                ? 'भारत की महिला उद्यमियों को सशक्त बनाने का प्लेटफॉर्म। 16 करोड़ गृहिणियों को उद्यमी बनाने का लक्ष्य।'
                : 'Empowering India\'s women entrepreneurs. Our goal is to help 16 crore housewives become successful entrepreneurs.'}
            </p>

            {/* Stats pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[['500+', lang === 'hi' ? 'विक्रेता' : 'Sellers'], ['₹10', lang === 'hi' ? 'प्लेटफॉर्म शुल्क' : 'Platform Fee'], ['28+', lang === 'hi' ? 'राज्य' : 'States']].map(([v, l]) => (
                <div key={l} className="bg-white/10 rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-bold text-accent">{v}</span>
                  <span className="text-gray-400 ml-1">{l}</span>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-4">
              {[
                { icon: '📘', label: 'Facebook', href: '#' },
                { icon: '📸', label: 'Instagram', href: '#' },
                { icon: '🐦', label: 'Twitter', href: '#' },
                { icon: '▶️', label: 'YouTube', href: '#' }
              ].map(s => (
                <a key={s.label} href={s.href} title={s.label}
                  className="w-9 h-9 bg-white/10 hover:bg-primary/60 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-gray-200 text-sm mb-3 border-b border-white/10 pb-2">{title}</h4>
              <ul className="space-y-2">
                {links.map(l => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-gray-500 hover:text-white text-xs transition-colors hover:translate-x-1 inline-block">
                      → {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment & delivery info */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '💳', title: 'Razorpay', desc: lang === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payment' },
            { icon: '🚚', title: lang === 'hi' ? '3 डिलीवरी विकल्प' : '3 Delivery Options', desc: lang === 'hi' ? 'मुफ्त से ₹200 तक' : 'Free to ₹200' },
            { icon: '🔔', title: lang === 'hi' ? 'रियल-टाइम सूचना' : 'Real-time Alerts', desc: lang === 'hi' ? 'तुरंत अपडेट' : 'Instant Updates' },
            { icon: '🛡️', title: lang === 'hi' ? 'महिला सुरक्षा' : 'Women Protected', desc: lang === 'hi' ? 'केवल महिला विक्रेता' : 'Women sellers only' }
          ].map(f => (
            <div key={f.title} className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-300">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            © 2026 ProgressiveNari. {lang === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'} 
            {/* <span className="ml-1">{lang === 'hi' ? 'प्लेटफॉर्म शुल्क: ₹10 प्रति ऑर्डर' : 'Platform fee: ₹10 per order'}</span> */}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-gray-500 hover:text-white text-xs transition-colors">{lang === 'hi' ? 'नियम' : 'Terms'}</Link>
            <Link to="/privacy" className="text-gray-500 hover:text-white text-xs transition-colors">{lang === 'hi' ? 'गोपनीयता' : 'Privacy'}</Link>
            <Link to="/support" className="text-gray-500 hover:text-white text-xs transition-colors">{lang === 'hi' ? 'सहायता' : 'Support'}</Link>
            <button onClick={toggleLang}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
              {lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}