import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ProductCard from '../components/ProductCard.jsx'
import api from '../api/api.js'

const CATEGORIES = [
  { name: 'Pickles', icon: '🫙', color: 'bg-orange-100', slug: 'Pickles' },
  { name: 'Bakery', icon: '🧁', color: 'bg-yellow-100', slug: 'Bakery' },
  { name: 'Cloth', icon: '👗', color: 'bg-pink-100', slug: 'Cloth' },
  { name: 'Paintings', icon: '🎨', color: 'bg-purple-100', slug: 'Paintings' },
  { name: 'Art & Craft', icon: '🪡', color: 'bg-green-100', slug: 'Art & Craft' },
  { name: 'Saree', icon: '🥻', color: 'bg-red-100', slug: 'Saree' },
  { name: 'Jewellery', icon: '💎', color: 'bg-blue-100', slug: 'Jewellery' },
  { name: 'Food', icon: '🍱', color: 'bg-teal-100', slug: 'Food' }
]

const BANNERS = [
  { title: 'Shop from Women Entrepreneurs', subtitle: 'Authentic handmade products from across India', cta: 'Shop Now', color: 'from-primary to-secondary', link: '/products' },
  { title: 'Sell Your Products', subtitle: 'Register as a Seller and reach thousands of customers', cta: 'Start Selling', color: 'from-dark to-card', link: '/register' },
  { title: 'Free Delivery Available', subtitle: 'Self pickup free • Seller delivery ₹50 • Company delivery ₹200', cta: 'Explore', color: 'from-success to-green-700', link: '/products' }
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerIdx, setBannerIdx] = useState(0)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products?limit=12')
        setProducts(res.data.products || [])
      } catch { } finally { setLoading(false) }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000)
    return () => clearInterval(timer)
  }, [])

  const banner = BANNERS[bannerIdx]

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28">
        {/* Hero Banner */}
        <div className={`bg-gradient-to-r ${banner.color} text-white transition-all duration-500`}>
          <div className="max-w-7xl mx-auto px-4 py-10 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">{banner.title}</h1>
              <p className="mt-2 text-white/80 text-lg">{banner.subtitle}</p>
              <Link to={banner.link} className="mt-4 inline-block bg-white text-gray-900 font-bold px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-colors">
                {banner.cta} →
              </Link>
            </div>
            <div className="hidden md:flex gap-2">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === bannerIdx ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Women Sellers', value: '500+', icon: '👩‍💼' },
              { label: 'Products Listed', value: '2,000+', icon: '🛍️' },
              { label: 'Happy Customers', value: '10,000+', icon: '⭐' },
              { label: 'States Covered', value: '28+', icon: '🗺️' }
            ].map(stat => (
              <div key={stat.label} className="card p-4 text-center">
                <div className="text-2xl">{stat.icon}</div>
                <div className="font-display text-xl font-bold text-primary mt-1">{stat.value}</div>
                <div className="text-xs text-muted">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Categories */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold text-dark">Shop by Category</h2>
              <Link to="/products" className="text-primary text-sm font-semibold hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {CATEGORIES.map(cat => (
                <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="card p-3 text-center hover:shadow-md transition-all hover:-translate-y-0.5 group">
                  <div className={`w-12 h-12 ${cat.color} rounded-full flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform`}>
                    {cat.icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mt-2">{cat.name}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Features strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🚚', title: '3 Delivery Options', desc: 'Self pickup, Seller delivery, or Company delivery' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Razorpay powered secure payment gateway' },
              { icon: '💬', title: 'Instant Notifications', desc: 'Real-time order updates for buyers & sellers' }
            ].map(f => (
              <div key={f.title} className="card p-4 flex items-start gap-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{f.title}</h3>
                  <p className="text-xs text-muted mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Products */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold text-dark">Featured Products</h2>
              <Link to="/products" className="text-primary text-sm font-semibold hover:underline">See all →</Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="bg-gray-200 h-48 w-full" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">🛒</p>
                <p className="text-gray-500 mt-4">No products yet. Be the first seller!</p>
                <Link to="/register" className="btn-primary mt-4 inline-block">Become a Seller</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </section>

          {/* CTA */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-6 bg-gradient-to-br from-primary to-secondary text-white">
              <h3 className="font-display text-xl font-bold">Are You a Woman Entrepreneur?</h3>
              <p className="mt-2 text-sm text-white/80">Join thousands of women selling their handmade products on Progressive Naari.</p>
              <Link to="/register" className="mt-4 inline-block bg-white text-primary font-bold px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                Register as Seller
              </Link>
            </div>
            <div className="card p-6 bg-gradient-to-br from-dark to-gray-700 text-white">
              <h3 className="font-display text-xl font-bold">Shop Authentic Products</h3>
              <p className="mt-2 text-sm text-white/80">Discover unique handmade products from women entrepreneurs across India.</p>
              <Link to="/products" className="mt-4 inline-block bg-accent text-gray-900 font-bold px-5 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors">
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-dark text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-display text-xl font-bold text-accent">Progressive Naari</div>
          <p className="text-gray-400 text-sm mt-1">Empowering Women Entrepreneurs Across India</p>
          <p className="text-gray-500 text-xs mt-4">Platform fee: ₹10 per order • Secure payments via Razorpay</p>
        </div>
      </footer>
    </div>
  )
}
