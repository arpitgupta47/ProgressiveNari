import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../components/Toast.jsx'
import api from '../api/api.js'

const PLACEHOLDER = 'https://placehold.co/600x400/f0f2f5/ccc?text=No+Image'
const DELIVERY_OPTIONS = [
  { value: 'self_pickup', label: 'Self Pickup', charge: 0, desc: 'Pick up from seller directly', icon: '🚶' },
  { value: 'seller_delivery', label: 'Seller Delivery', charge: 50, desc: 'Delivered by seller within same area', icon: '🏍️' },
  { value: 'company_delivery', label: 'Company Delivery', charge: 200, desc: 'Pan-India delivery via courier', icon: '📦' }
]

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDelivery, setSelectedDelivery] = useState('self_pickup')

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => showToast('Product not found', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const deliveryCharge = DELIVERY_OPTIONS.find(d => d.value === selectedDelivery)?.charge || 0
  const total = product ? product.price + deliveryCharge + 10 : 0

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'customer') { showToast('Only customers can add to cart', 'error'); return }
    addToCart({ ...product, selectedDelivery, deliveryCharge })
    showToast(`${product.title} added to cart!`, 'success')
  }

  const handleBuyNow = () => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'customer') { showToast('Only customers can purchase', 'error'); return }
    addToCart({ ...product, selectedDelivery, deliveryCharge })
    navigate('/cart')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-32 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-32 text-center"><p>Product not found.</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-muted mb-4 flex items-center gap-2">
          <a href="/" className="hover:text-primary">Home</a> /
          <a href="/products" className="hover:text-primary">Products</a> /
          <span className="text-gray-700">{product.title}</span>
        </div>

        <div className="grid md:grid-cols-[1fr_380px] gap-6">
          {/* Left */}
          <div className="space-y-4">
            <div className="card p-4">
              <img src={product.imageUrl || PLACEHOLDER}
                onError={e => e.target.src = PLACEHOLDER}
                alt={product.title}
                className="w-full max-h-80 object-contain rounded-lg bg-gray-50" />
            </div>
            <div className="card p-5">
              <h1 className="font-display text-2xl font-bold text-dark">{product.title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="badge bg-primary/10 text-primary">{product.category}</span>
                {product.location && <span className="badge bg-gray-100 text-gray-600">📍 {product.location}</span>}
                {product.stock > 0 ? (
                  <span className="badge bg-green-100 text-green-700">✅ In Stock ({product.stock})</span>
                ) : (
                  <span className="badge bg-red-100 text-red-600">❌ Out of Stock</span>
                )}
              </div>
              <p className="mt-4 text-gray-600 text-sm leading-relaxed">{product.description}</p>
              {product.seller && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-semibold text-gray-700">Sold by: {product.seller.name}</p>
                  {product.seller.email && <p className="text-muted">{product.seller.email}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Right - Purchase Box */}
          <div className="space-y-4">
            <div className="card p-5 sticky top-28">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                <span className="text-sm text-muted">+ platform fee ₹10</span>
              </div>

              <hr className="my-4 border-gray-100" />

              {/* Delivery selection */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">🚚 Choose Delivery:</p>
                <div className="space-y-2">
                  {DELIVERY_OPTIONS.map(opt => (
                    <label key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                        ${selectedDelivery === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="delivery" value={opt.value}
                        checked={selectedDelivery === opt.value}
                        onChange={() => setSelectedDelivery(opt.value)}
                        className="text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{opt.icon} {opt.label}</span>
                          <span className="text-sm font-bold text-primary">{opt.charge === 0 ? 'FREE' : `₹${opt.charge}`}</span>
                        </div>
                        <p className="text-xs text-muted">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="my-4 border-gray-100" />

              {/* Price breakdown */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Product Price</span><span>₹{product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery Charge</span><span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Platform Fee</span><span>₹10</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between font-bold text-base text-dark">
                  <span>Total Amount</span><span className="text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <hr className="my-4 border-gray-100" />

              {user?.role === 'customer' ? (
                <div className="space-y-2">
                  <button onClick={handleBuyNow}
                    className="w-full py-3 bg-accent hover:bg-yellow-400 text-gray-900 font-bold rounded-xl transition-colors">
                    ⚡ Buy Now
                  </button>
                  <button onClick={handleAddToCart}
                    className="w-full py-3 bg-primary hover:bg-primaryDark text-white font-bold rounded-xl transition-colors">
                    🛒 Add to Cart
                  </button>
                </div>
              ) : !user ? (
                <div className="space-y-2">
                  <button onClick={() => navigate('/login')}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl">
                    Login to Purchase
                  </button>
                  <p className="text-xs text-center text-muted">Login as Customer to buy this product</p>
                </div>
              ) : (
                <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-700 text-center">
                  Sellers cannot purchase products. Please create a customer account.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
