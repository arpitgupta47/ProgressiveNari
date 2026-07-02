import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useLang } from '../context/LangContext.jsx'
import { useLocation2 } from '../context/LocationContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { t } from '../utils/translations.js'
import api from '../api/api.js'

const CATEGORIES = [
  { name: 'Pickles', hi: 'अचार', icon: '🫙', color: 'from-orange-400 to-red-400' },
  { name: 'Bakery', hi: 'बेकरी', icon: '🧁', color: 'from-yellow-400 to-orange-400' },
  { name: 'Cloth', hi: 'कपड़े', icon: '👗', color: 'from-pink-400 to-rose-400' },
  { name: 'Paintings', hi: 'पेंटिंग', icon: '🎨', color: 'from-purple-400 to-violet-400' },
  { name: 'Art & Craft', hi: 'हस्तकला', icon: '🪡', color: 'from-green-400 to-teal-400' },
  { name: 'Saree', hi: 'साड़ी', icon: '🥻', color: 'from-red-400 to-pink-400' },
  { name: 'Jewellery', hi: 'आभूषण', icon: '💎', color: 'from-blue-400 to-cyan-400' },
  { name: 'Food', hi: 'खाना', icon: '🍱', color: 'from-teal-400 to-green-400' },
]

function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function AnimSection({ children, delay = 0 }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {children}
    </div>
  )
}

function CountUp({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 30)
    return () => clearInterval(timer)
  }, [inView, target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

export default function Home() {
  const { lang } = useLang()
  const { location, locationStatus, requestLocation } = useLocation2()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [nearbyProducts, setNearbyProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerIdx, setBannerIdx] = useState(0)

  const BANNERS = [
    { title: lang === 'hi' ? 'महिलाओं से खरीदें' : 'Shop from Women', sub: lang === 'hi' ? 'असली हस्तनिर्मित उत्पाद' : 'Authentic handmade products', cta: lang === 'hi' ? 'अभी खरीदें' : 'Shop Now', link: '/products', grad: 'from-primary via-red-600 to-secondary', emoji: '🛍️' },
    { title: lang === 'hi' ? 'विक्रेता बनें' : 'Become a Seller', sub: lang === 'hi' ? 'रजिस्टर करें और कमाएं' : 'Register and start earning', cta: lang === 'hi' ? 'शुरू करें' : 'Start Now', link: '/register', grad: 'from-dark via-gray-800 to-gray-900', emoji: '🏪' },
    { title: lang === 'hi' ? 'मुफ्त डिलीवरी' : 'Free Delivery', sub: lang === 'hi' ? 'सेल्फ पिकअप हमेशा मुफ्त' : 'Self pickup always free', cta: lang === 'hi' ? 'देखें' : 'Explore', link: '/products', grad: 'from-green-600 to-teal-600', emoji: '🚚' },
  ]

  useEffect(() => {
    api.get('/products?limit=12').then(r => setProducts(r.data.products || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (locationStatus === 'granted' && location?.lat) {
      api.get(`/products?lat=${location.lat}&lng=${location.lng}&radius=25&limit=8`)
        .then(r => setNearbyProducts(r.data.products || []))
    } else {
      setNearbyProducts([])
    }
  }, [locationStatus, location])

  useEffect(() => {
    const timer = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4500)
    return () => clearInterval(timer)
  }, [lang])

  const banner = BANNERS[bannerIdx]

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-24">
        {/* Hero Banner */}
        <div className={`relative bg-gradient-to-r ${banner.grad} text-white overflow-hidden transition-all duration-700 min-h-[200px]`}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full" style={{ animation: 'pulse 3s infinite 1s' }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 py-14 flex items-center justify-between">
            <div className="flex-1">
              <div className="text-5xl mb-3">{banner.emoji}</div>
              <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">{banner.title}</h1>
              <p className="mt-2 text-white/80 text-base md:text-lg max-w-lg">{banner.sub}</p>
              <Link to={banner.link} className="mt-5 inline-block bg-white text-gray-900 font-bold px-7 py-3 rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-xl text-sm">
                {banner.cta} →
              </Link>
            </div>
            <div className="hidden md:flex flex-col gap-2">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === bannerIdx ? 'bg-white scale-125' : 'bg-white/40'}`} />
              ))}
            </div>
          </div>
          <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 1440 30" fill="none">
            <path d="M0 30L1440 30L1440 10C1200 28 960 5 720 15C480 25 240 3 0 10L0 30Z" fill="#f3f4f6" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
          {/* Stats */}
          <AnimSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { target: 500, suffix: '+', label: lang === 'hi' ? 'महिला विक्रेता' : 'Women Sellers', icon: '👩‍💼', color: 'text-primary' },
                { target: 2000, suffix: '+', label: lang === 'hi' ? 'उत्पाद' : 'Products', icon: '🛍️', color: 'text-blue-600' },
                { target: 10000, suffix: '+', label: lang === 'hi' ? 'ग्राहक' : 'Customers', icon: '⭐', color: 'text-yellow-600' },
                { target: 28, suffix: '+', label: lang === 'hi' ? 'राज्य' : 'States', icon: '🗺️', color: 'text-green-600' },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center hover:shadow-lg transition-all hover:-translate-y-1 group cursor-default">
                  <div className="text-2xl group-hover:scale-110 transition-transform inline-block">{s.icon}</div>
                  <div className={`font-display text-2xl font-bold mt-1 ${s.color}`}>
                    <CountUp target={s.target} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-muted mt-0.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </AnimSection>

          {/* Location CTA / Nearby products */}
          {locationStatus !== 'granted' ? (
            <AnimSection>
              <div className="card p-5 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-3xl animate-bounce">📍</div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-800">{lang === 'hi' ? 'पास के उत्पाद देखें' : 'See Nearby Products'}</h3>
                    <p className="text-sm text-muted">{lang === 'hi' ? 'लोकेशन की अनुमति दें और अपने क्षेत्र के विक्रेताओं को खोजें' : 'Allow location to discover sellers in your area'}</p>
                  </div>
                </div>
                <button onClick={requestLocation} className="flex-shrink-0 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-all hover:scale-105 shadow-lg">
                  📍 {lang === 'hi' ? 'लोकेशन चालू करें' : 'Enable Location'}
                </button>
              </div>
            </AnimSection>
          ) : nearbyProducts.length > 0 ? (
            <AnimSection>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                    📍 {lang === 'hi' ? 'पास के उत्पाद' : 'Nearby Products'}
                    <span className="text-sm font-normal text-green-600 bg-green-100 px-3 py-1 rounded-full">{location?.displayName}</span>
                  </h2>
                  <p className="text-sm text-muted mt-0.5">{lang === 'hi' ? 'आपके क्षेत्र के विक्रेताओं के उत्पाद' : 'Products from sellers in your area'}</p>
                </div>
                <Link to={`/products?lat=${location?.lat}&lng=${location?.lng}`} className="text-primary text-sm font-semibold hover:underline">
                  {lang === 'hi' ? 'सभी देखें →' : 'View All →'}
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {nearbyProducts.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </AnimSection>
          ) : locationStatus === 'granted' && (
            <div className="card p-4 text-center text-muted text-sm bg-yellow-50 border border-yellow-200">
              {lang === 'hi' ? `📍 ${location?.displayName} में कोई विक्रेता नहीं मिला। पास के ऑर्डर के लिए दायरा बढ़ाएं।` : `📍 No sellers found near ${location?.displayName}. Try increasing radius in Products page.`}
            </div>
          )}

          {/* Categories */}
          <AnimSection>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">{lang === 'hi' ? 'श्रेणी से खरीदें' : 'Shop by Category'}</h2>
              <Link to="/products" className="text-primary text-sm font-semibold hover:underline">{lang === 'hi' ? 'सभी देखें' : 'View All'}</Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {CATEGORIES.map((cat, i) => (
                <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1"
                  style={{ transitionDelay: `${i * 30}ms` }}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-2xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                    {cat.icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center leading-tight">{lang === 'hi' ? cat.hi : cat.name}</p>
                </Link>
              ))}
            </div>
          </AnimSection>

          {/* Features */}
          <AnimSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '🚚', title: lang === 'hi' ? '3 डिलीवरी विकल्प' : '3 Delivery Options', desc: lang === 'hi' ? 'सेल्फ पिकअप मुफ्त • ₹50 • ₹200' : 'Self Pickup Free • ₹50 • ₹200' },
                { icon: '🔒', title: lang === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payments', desc: lang === 'hi' ? 'Razorpay + COD उपलब्ध' : 'Razorpay + Cash on Delivery' },
                { icon: '🔔', title: lang === 'hi' ? 'तुरंत सूचना' : 'Instant Notifications', desc: lang === 'hi' ? 'ऑर्डर अपडेट रियल-टाइम' : 'Real-time order updates' },
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

          {/* Featured Products */}
          <AnimSection>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">{lang === 'hi' ? 'विशेष उत्पाद' : 'Featured Products'}</h2>
              <Link to="/products" className="text-primary text-sm font-semibold hover:underline">{lang === 'hi' ? 'सभी देखें →' : 'See all →'}</Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="card">
                    <div className="shimmer h-48 w-full" />
                    <div className="p-3 space-y-2"><div className="shimmer h-4 rounded w-3/4" /><div className="shimmer h-4 rounded w-1/2" /></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">🛒</p>
                <p className="text-gray-500 mt-3">{lang === 'hi' ? 'अभी कोई उत्पाद नहीं।' : 'No products yet.'}</p>
                <Link to="/register" className="btn-primary mt-4 inline-block">{lang === 'hi' ? 'विक्रेता बनें' : 'Become a Seller'}</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map((p, i) => (
                  <div key={p._id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </AnimSection>

          {/* CTA Cards */}
          <AnimSection>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { grad: 'from-primary to-secondary', emoji: '👩‍💼', title: lang === 'hi' ? 'विक्रेता बनें' : 'Become a Seller', sub: lang === 'hi' ? 'महिला उद्यमियों के लिए' : 'For women entrepreneurs', cta: lang === 'hi' ? 'रजिस्टर करें' : 'Register', link: '/register' },
                { grad: 'from-dark to-gray-700', emoji: '🛍️', title: lang === 'hi' ? 'खरीदारी करें' : 'Start Shopping', sub: lang === 'hi' ? 'असली हस्तनिर्मित उत्पाद' : 'Authentic handmade items', cta: lang === 'hi' ? 'देखें' : 'Browse', link: '/products' },
                { grad: 'from-indigo-600 to-purple-600', emoji: '🏍️', title: lang === 'hi' ? 'डिलीवरी बॉय बनें' : 'Join as Delivery', sub: lang === 'hi' ? 'ऑर्डर डिलीवर करें और कमाएं' : 'Deliver orders and earn', cta: lang === 'hi' ? 'जुड़ें' : 'Join Now', link: '/register' },
              ].map(c => (
                <div key={c.title} className={`card p-6 bg-gradient-to-br ${c.grad} text-white relative overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-1`}>
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative">
                    <div className="text-4xl mb-3">{c.emoji}</div>
                    <h3 className="font-display text-lg font-bold">{c.title}</h3>
                    <p className="mt-1 text-sm text-white/80">{c.sub}</p>
                    <Link to={c.link} className="mt-4 inline-block bg-white text-gray-900 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-100 transition-all hover:scale-105 shadow-lg">
                      {c.cta} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </AnimSection>
        </div>
      </main>
      <Footer />
    </div>
  )
}
