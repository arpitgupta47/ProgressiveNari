import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/api.js'

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  processing: 'bg-orange-100 text-orange-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-600'
}

const DELIVERY_LABELS = {
  self_pickup: '🚶 Self Pickup',
  seller_delivery: '🏍️ Seller Delivery',
  company_delivery: '📦 Company Delivery'
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'customer') { navigate('/login'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, ordersRes] = await Promise.all([
        api.get('/products?limit=24'),
        api.get('/orders/my-orders')
      ])
      setProducts(productsRes.data.products || [])
      setOrders(ordersRes.data)
    } catch { } finally { setLoading(false) }
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-dark to-gray-700 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">🛍️ Customer Dashboard</h1>
              <p className="text-white/80 text-sm mt-1">Welcome, {user?.name}! Happy Shopping.</p>
            </div>
            <Link to="/cart" className="bg-accent text-gray-900 font-bold px-5 py-2 rounded-xl hover:bg-yellow-400 transition-colors">
              🛒 View Cart
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: orders.length, icon: '📦' },
            { label: 'Active Orders', value: activeOrders.length, icon: '⏳' },
            { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: '✅' },
            { label: 'Total Spent', value: `₹${orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`, icon: '💰' }
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className="text-2xl">{s.icon}</div>
              <div className="text-xl font-bold text-dark mt-1">{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: 'products', label: '🛍️ Browse Products' },
            { id: 'orders', label: '📦 My Orders', count: activeOrders.length },
            { id: 'history', label: '🕐 Order History' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${activeTab === tab.id ? 'bg-dark text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.label}
              {tab.count > 0 && <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="bg-gray-200 h-48" />
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
              <p className="text-gray-500 mt-3">No products available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="text-gray-500 mt-3">No active orders.</p>
                <button onClick={() => setActiveTab('products')} className="btn-primary mt-4">Start Shopping</button>
              </div>
            ) : activeOrders.map(order => <OrderCard key={order._id} order={order} />)}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {pastOrders.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">🕐</p>
                <p className="text-gray-500 mt-3">No past orders.</p>
              </div>
            ) : pastOrders.map(order => <OrderCard key={order._id} order={order} />)}
          </div>
        )}
      </main>
    </div>
  )
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false)

  const mySellerStatus = order.sellerStatuses?.[0]?.status || order.status

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between flex-wrap gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
            <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {order.status?.toUpperCase()}
            </span>
            <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {order.paymentStatus === 'paid' ? '💳 Paid' : '⏳ Payment Pending'}
            </span>
          </div>
          <p className="text-xs text-muted mt-1">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <p className="font-bold text-lg text-primary">₹{order.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-muted">{DELIVERY_LABELS[order.deliveryType]}</p>
          </div>
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t pt-4 animate-fade-in">
          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                {item.imageUrl && <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover" />}
                <span className="flex-1 font-medium">{item.title}</span>
                <span className="text-muted">x{item.quantity}</span>
                <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 text-muted">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span></div>
            <div className="flex justify-between"><span>Platform Fee</span><span>₹{order.platformFee}</span></div>
            <div className="flex justify-between font-bold text-sm text-dark border-t pt-1 mt-1">
              <span>Total</span><span>₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Seller status */}
          {order.sellerStatuses?.length > 0 && (
            <div className="text-sm">
              <p className="font-semibold text-gray-700 mb-1">Seller Response:</p>
              {order.sellerStatuses.map((s, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${STATUS_COLORS[s.status] || 'bg-gray-50'}`}>
                  <span>{s.status === 'accepted' ? '✅' : s.status === 'rejected' ? '❌' : '⏳'}</span>
                  <span className="font-medium capitalize">{s.status}</span>
                  {s.note && <span className="text-xs">— "{s.note}"</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
