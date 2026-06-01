import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useLang } from '../context/LangContext.jsx'
import { useLocation2 } from '../context/LocationContext.jsx'
import { t } from '../utils/translations.js'
import api from '../api/api.js'

const CATEGORIES = [
  { name: 'Pickles', hi: 'अचार', icon: '🫙', color: 'from-orange-400 to-red-400', slug: 'Pickles' },
  { name: 'Bakery', hi: 'बेकरी', icon: '🧁', color: 'from-yellow-400 to-orange-400', slug: 'Bakery' },
  { name: 'Cloth', hi: 'कपड़े', icon: '👗', color: 'from-pink-400 to-rose-400', slug: 'Cloth' },
  { name: 'Paintings', hi: 'पेंटिंग', icon: '🎨', color: 'from-purple-400 to-violet-400', slug: 'Paintings' },
  { name: 'Art & Craft', hi: 'हस्तकला', icon: '🪡', color: 'from-green-400 to-teal-400', slug: 'Art & Craft' },
  { name: 'Saree', hi: 'साड़ी', icon: '🥻', color: 'from-red-400 to-pink-400', slug: 'Saree' },
  { name: 'Jewellery', hi: 'आभूषण', icon: '💎', color: 'from-blue-400 to-cyan-400', slug: 'Jewellery' },
  { name: 'Food', hi: 'खाना', icon: '🍱', color: 'from-teal-400 to-green-400', slug: 'Food' },
]

function useInView(threshold = 0.1) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function AnimSection({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      {children}
    </div>
  )
}

function CountUp({ target, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

export default function Home() {
  const { lang } = useLang()
  const { location, locationStatus, requestLocation } = useLocation2()
  const [products, setProducts] = useState([])
  const [nearbyProducts, setNearbyProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerIdx, setBannerIdx] = useState(0)

  const BANNERS = [
    { titleKey: 'hero_title', subtitleKey: 'hero_subtitle', ctaKey: 'hero_cta', color: 'from-primary via-red-600 to-secondary', link: '/products', emoji: '🛍️' },
    { titleKey: 'sell_title', subtitleKey: 'sell_subtitle', ctaKey: 'sell_cta', color: 'from-dark via-gray-800 to-card', link: '/register', emoji: '🏪' },
    { titleKey: 'delivery_title', subtitleKey: 'delivery_subtitle', ctaKey: 'hero_cta', color: 'from-green-600 via-teal-600 to-emerald-700', link: '/products', emoji: '🚚' },
  ]

  useEffect(() => {
    api.get('/products?limit=12').then(r => setProducts(r.data.products || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (locationStatus === 'granted' && location?.city) {
      api.get(`/products?search=${encodeURIComponent(location.city)}&limit=8`)
        .then(r => setNearbyProducts(r.data.products || []))
        .catch(() => {})
    }
  }, [locationStatus, location])

  useEffect(() => {
    const timer = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4500)
    return () => clearInterval(timer)
  }, [])

  const banner = BANNERS[bannerIdx]

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-24">
        {/* Hero Banner */}
        <div className={`relative bg-gradient-to-r ${banner.color} text-white overflow-hidden transition-all duration-700`}>
          {/* Animated background circles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full animate-pulse" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full" style={{ animation: 'pulse 3s infinite 1s' }} />
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full" style={{ animation: 'pulse 4s infinite 0.5s' }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 max-w-xl">
              <div className="text-5xl mb-3 animate-bounce">{banner.emoji}</div>
              <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">{t(lang, banner.titleKey)}</h1>
              <p className="mt-3 text-white/80 text-base md:text-lg max-w-lg">{t(lang, banner.subtitleKey)}</p>
              <Link to={banner.link} className="mt-5 inline-block bg-white text-gray-900 font-bold px-7 py-3 rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-xl text-sm">
                {t(lang, banner.ctaKey)} →
              </Link>
            </div>
            {/* Banner dots */}
            <div className="hidden md:flex flex-col gap-2 mr-4">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === bannerIdx ? 'bg-white scale-125' : 'bg-white/40'}`} />
              ))}
            </div>
          </div>
          {/* Wave bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 30L1440 30L1440 10C1200 28 960 5 720 15C480 25 240 3 0 10L0 30Z" fill="#f3f4f6" />
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

          {/* Stats */}
          <AnimSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { labelKey: 'women_sellers', value: 500, suffix: '+', icon: '👩‍💼', color: 'text-primary' },
                { labelKey: 'products_listed', value: 2000, suffix: '+', icon: '🛍️', color: 'text-blue-600' },
                { labelKey: 'happy_customers', value: 10000, suffix: '+', icon: '⭐', color: 'text-yellow-600' },
                { labelKey: 'states_covered', value: 28, suffix: '+', icon: '🗺️', color: 'text-green-600' }
              ].map(s => (
                <div key={s.labelKey} className="card p-4 text-center hover:shadow-lg transition-all hover:-translate-y-1 group">
                  <div className="text-2xl group-hover:scale-110 transition-transform inline-block">{s.icon}</div>
                  <div className={`font-display text-2xl font-bold mt-1 ${s.color}`}>
                    <CountUp target={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-muted mt-0.5 font-medium">{t(lang, s.labelKey)}</div>
                </div>
              ))}
            </div>
          </AnimSection>

          {/* Location CTA or Nearby Products */}
          {locationStatus !== 'granted' ? (
            <AnimSection>
              <div className="card p-6 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-3xl animate-bounce">📍</div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-800">{t(lang, 'nearby_sellers')}</h3>
                    <p className="text-sm text-muted">{t(lang, 'location_prompt')}</p>
                  </div>
                </div>
                <button onClick={requestLocation}
                  className="flex-shrink-0 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-all hover:scale-105 shadow-lg flex items-center gap-2">
                  📍 {t(lang, 'enable_location')}
                </button>
              </div>
            </AnimSection>
          ) : nearbyProducts.length > 0 && (
            <AnimSection>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                    📍 {t(lang, 'nearby_sellers')}
                    <span className="text-sm font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{location?.displayName}</span>
                  </h2>
                  <p className="text-sm text-muted mt-0.5">{t(lang, 'nearby_subtitle')}</p>
                </div>
                <Link to={`/products?search=${encodeURIComponent(location?.city || '')}`} className="text-primary text-sm font-semibold hover:underline">{t(lang, 'view_all')}</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {nearbyProducts.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </AnimSection>
          )}

          {/* Categories */}
          <AnimSection>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">{t(lang, 'shop_category')}</h2>
              <Link to="/products" className="text-primary text-sm font-semibold hover:underline">{t(lang, 'view_all')}</Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {CATEGORIES.map((cat, i) => (
                <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1"
                  style={{ transitionDelay: `${i * 40}ms` }}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-2xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                    {cat.icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center leading-tight">
                    {lang === 'hi' ? cat.hi : cat.name}
                  </p>
                </Link>
              ))}
            </div>
          </AnimSection>

          {/* Feature strip */}
          <AnimSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '🚚', title: lang === 'hi' ? '3 डिलीवरी विकल्प' : '3 Delivery Options', desc: lang === 'hi' ? 'सेल्फ पिकअप • सेलर डिलीवरी ₹50 • कंपनी डिलीवरी ₹200' : 'Self pickup • Seller delivery ₹50 • Company delivery ₹200' },
                { icon: '🔒', title: lang === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payments', desc: lang === 'hi' ? 'रेज़रपे द्वारा सुरक्षित भुगतान' : 'Razorpay powered secure payment gateway' },
                { icon: '🔔', title: lang === 'hi' ? 'तुरंत सूचना' : 'Instant Notifications', desc: lang === 'hi' ? 'खरीदारों और विक्रेताओं के लिए रियल-टाइम अपडेट' : 'Real-time order updates for buyers & sellers' }
              ].map(f => (
                <div key={f.title} className="card p-4 flex items-start gap-3 hover:shadow-md transition-all group">
                  <div className="text-3xl group-hover:scale-110 transition-transform flex-shrink-0">{f.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{f.title}</h3>
                    <p className="text-xs text-muted mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimSection>

          {/* Featured products */}
          <AnimSection>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">{t(lang, 'featured_products')}</h2>
              <Link to="/products" className="text-primary text-sm font-semibold hover:underline">{t(lang, 'see_all')}</Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="card">
                    <div className="shimmer h-48 w-full" />
                    <div className="p-3 space-y-2">
                      <div className="shimmer h-4 rounded w-3/4" />
                      <div className="shimmer h-4 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">🛒</p>
                <p className="text-gray-500 mt-3">{lang === 'hi' ? 'अभी कोई उत्पाद नहीं। पहले विक्रेता बनें!' : 'No products yet. Be the first seller!'}</p>
                <Link to="/register" className="btn-primary mt-4 inline-block">{lang === 'hi' ? 'विक्रेता बनें' : 'Become a Seller'}</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map((p, i) => (
                  <div key={p._id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </AnimSection>

          {/* CTA cards */}
          <AnimSection>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="card p-7 bg-gradient-to-br from-primary to-secondary text-white relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <div className="text-4xl mb-3">👩‍💼</div>
                  <h3 className="font-display text-xl font-bold">{lang === 'hi' ? 'क्या आप एक महिला उद्यमी हैं?' : 'Are You a Woman Entrepreneur?'}</h3>
                  <p className="mt-2 text-sm text-white/80">{lang === 'hi' ? 'प्रोग्रेसिव नारी पर अपने हस्तनिर्मित उत्पाद बेचें।' : 'Join thousands of women selling their handmade products on Progressive Naari.'}</p>
                  <Link to="/register" className="mt-4 inline-block bg-white text-primary font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-all hover:scale-105 shadow-lg">
                    {t(lang, 'register_as_seller')} →
                  </Link>
                </div>
              </div>
              <div className="card p-7 bg-gradient-to-br from-dark to-gray-700 text-white relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <div className="text-4xl mb-3">🛍️</div>
                  <h3 className="font-display text-xl font-bold">{lang === 'hi' ? 'असली उत्पाद खरीदें' : 'Shop Authentic Products'}</h3>
                  <p className="mt-2 text-sm text-white/80">{lang === 'hi' ? 'पूरे भारत की महिला उद्यमियों के अनोखे हस्तनिर्मित उत्पाद खोजें।' : 'Discover unique handmade products from women entrepreneurs across India.'}</p>
                  <Link to="/products" className="mt-4 inline-block bg-accent text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-yellow-400 transition-all hover:scale-105 shadow-lg">
                    {t(lang, 'browse_products')} →
                  </Link>
                </div>
              </div>
            </div>
          </AnimSection>
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="bg-dark text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="font-display text-xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">PN</div>
                Progressive Naari
              </div>
              <p className="text-gray-400 text-xs mt-2">{t(lang, 'empowering')}</p>
              <p className="text-gray-500 text-xs mt-2">{t(lang, 'platform_fee_note')}</p>
            </div>
            {[
              { title: lang === 'hi' ? 'त्वरित लिंक' : 'Quick Links', links: [{ to: '/products', label: t(lang, 'products') }, { to: '/services', label: t(lang, 'services') }, { to: '/courses', label: t(lang, 'courses') }, { to: '/star-worker', label: t(lang, 'star_worker') }] },
              { title: lang === 'hi' ? 'खाता' : 'Account', links: [{ to: '/login', label: t(lang, 'login') }, { to: '/register', label: t(lang, 'register') }, { to: '/about', label: t(lang, 'about') }] },
              { title: lang === 'hi' ? 'सहायता' : 'Support', links: [{ to: '/', label: lang === 'hi' ? 'सहायता केंद्र' : 'Help Center' }, { to: '/', label: lang === 'hi' ? 'विक्रेता बनें' : 'Become a Seller' }] }
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-gray-300 text-sm mb-3">{col.title}</h4>
                <ul className="space-y-1.5">
                  {col.links.map(l => <li key={l.label}><Link to={l.to} className="text-gray-500 hover:text-white text-xs transition-colors">{l.label}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-gray-500 text-xs">© 2024 Progressive Naari. {lang === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}</p>
            <div className="flex gap-3">
              <button onClick={() => {}} className="text-xs text-gray-500 hover:text-white transition-colors">🇮🇳 Hindi</button>
              <button onClick={() => {}} className="text-xs text-gray-500 hover:text-white transition-colors">🇬🇧 English</button>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  )
}


