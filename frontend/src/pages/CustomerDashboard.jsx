import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import api from '../api/api.js'

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700', processing: 'bg-orange-100 text-orange-700',
  packed: 'bg-purple-100 text-purple-700', picked_up: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-yellow-100 text-yellow-700', shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-gray-100 text-gray-600'
}

const STATUS_STEPS = ['placed', 'accepted', 'packed', 'out_for_delivery', 'delivered']
const STATUS_ICONS = { placed: '📋', accepted: '✅', packed: '📦', out_for_delivery: '🚀', delivered: '🎉' }

const DELIVERY_LABELS = {
  self_pickup: '🚶 Self Pickup', seller_delivery: '🏍️ Seller Delivery', company_delivery: '📦 Company Delivery'
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)

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
    } catch {}
    setLoading(false)
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled', 'rejected'].includes(o.status))

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-dark to-gray-700 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">🛍️ {lang === 'hi' ? 'ग्राहक डैशबोर्ड' : 'Customer Dashboard'}</h1>
              <p className="text-white/80 text-sm mt-1">{lang === 'hi' ? 'स्वागत है,' : 'Welcome,'} {user?.name}!</p>
            </div>
            <Link to="/cart" className="bg-accent text-gray-900 font-bold px-5 py-2 rounded-xl hover:bg-yellow-400 transition-colors">
              🛒 {lang === 'hi' ? 'कार्ट देखें' : 'View Cart'}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: lang === 'hi' ? 'कुल ऑर्डर' : 'Total Orders', value: orders.length, icon: '📦', color: 'text-blue-600' },
            { label: lang === 'hi' ? 'सक्रिय ऑर्डर' : 'Active Orders', value: activeOrders.length, icon: '⏳', color: 'text-orange-600' },
            { label: lang === 'hi' ? 'डिलीवर हुए' : 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: '✅', color: 'text-green-600' },
            { label: lang === 'hi' ? 'कुल खर्च' : 'Total Spent', value: `₹${orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`, icon: '💰', color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className="text-2xl">{s.icon}</div>
              <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          {[
            { id: 'products', label: lang === 'hi' ? '🛍️ उत्पाद' : '🛍️ Browse' },
            { id: 'orders', label: lang === 'hi' ? '📦 सक्रिय ऑर्डर' : '📦 Active Orders', count: activeOrders.length },
            { id: 'history', label: lang === 'hi' ? '🕐 इतिहास' : '🕐 History' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
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
                <div key={i} className="card"><div className="shimmer h-48" /><div className="p-3 space-y-2"><div className="shimmer h-4 rounded w-3/4" /><div className="shimmer h-4 rounded w-1/2" /></div></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card p-12 text-center"><p className="text-4xl">🛒</p><p className="text-gray-500 mt-3">{lang === 'hi' ? 'कोई उत्पाद नहीं।' : 'No products yet.'}</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )
        )}

        {/* ORDERS / HISTORY TAB */}
        {(activeTab === 'orders' || activeTab === 'history') && (() => {
          const list = activeTab === 'orders' ? activeOrders : pastOrders
          return (
            <div className="space-y-4">
              {list.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-4xl">{activeTab === 'orders' ? '📭' : '🕐'}</p>
                  <p className="text-gray-500 mt-3">{activeTab === 'orders' ? (lang === 'hi' ? 'कोई सक्रिय ऑर्डर नहीं।' : 'No active orders.') : (lang === 'hi' ? 'कोई पुराना ऑर्डर नहीं।' : 'No past orders.')}</p>
                  {activeTab === 'orders' && <button onClick={() => setActiveTab('products')} className="btn-primary mt-4">{lang === 'hi' ? 'खरीदारी करें' : 'Start Shopping'}</button>}
                </div>
              ) : list.map(order => (
                <div key={order._id} className="card p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between flex-wrap gap-3 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                        <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>{order.status?.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentMethod === 'cod' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                          {order.paymentStatus === 'paid' ? '💳 Paid' : order.paymentMethod === 'cod' ? '💵 COD' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">₹{order.totalAmount?.toLocaleString()}</p>
                        <p className="text-xs text-muted">{DELIVERY_LABELS[order.deliveryType]}</p>
                      </div>
                      <span className="text-gray-400">{expandedOrder === order._id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Order tracker */}
                  {order.status !== 'rejected' && order.status !== 'cancelled' && activeTab === 'orders' && (
                    <div className="mt-4 relative">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200 z-0" />
                        <div className="absolute left-0 top-3 h-0.5 bg-primary z-0 transition-all duration-700"
                          style={{ width: `${(STATUS_STEPS.indexOf(order.status) / (STATUS_STEPS.length - 1)) * 100}%` }} />
                        {STATUS_STEPS.map((step, idx) => {
                          const currentIdx = STATUS_STEPS.indexOf(order.status)
                          const done = idx <= currentIdx
                          return (
                            <div key={step} className="relative z-10 flex flex-col items-center gap-1">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all
                                ${done ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}>
                                {done ? STATUS_ICONS[step] : idx + 1}
                              </div>
                              <span className={`text-xs font-medium capitalize hidden sm:block ${done ? 'text-primary' : 'text-gray-400'}`}>
                                {step.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rejected/cancelled */}
                  {(order.status === 'rejected' || order.status === 'cancelled') && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      ❌ {lang === 'hi' ? 'ऑर्डर' : 'Order'} {order.status}.
                      {order.sellerStatuses?.[0]?.note && ` ${lang === 'hi' ? 'कारण:' : 'Reason:'} "${order.sellerStatuses[0].note}"`}
                    </div>
                  )}

                  {/* Delivery boy info */}
                  {order.deliveryBoy && order.status !== 'delivered' && (
                    <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-indigo-700">🏍️ {lang === 'hi' ? 'डिलीवरी बॉय असाइन' : 'Delivery Person Assigned'}</p>
                      <p className="text-indigo-600">{order.deliveryBoy.name} • {order.deliveryBoy.phone}</p>
                      {order.deliveryBoy.vehicleType && <p className="text-indigo-500 text-xs">{order.deliveryBoy.vehicleType} • {order.deliveryBoy.vehicleNumber}</p>}
                      {order.status === 'out_for_delivery' && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-300 rounded-lg p-2">
                          <p className="font-bold text-yellow-800">{lang === 'hi' ? '🔐 OTP (डिलीवरी पर दें):' : '🔐 Share OTP with delivery person:'}</p>
                          <p className="text-2xl font-black text-yellow-900 tracking-widest mt-1">{order.deliveryOTP}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* COD reminder */}
                  {order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' && order.status !== 'delivered' && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
                      💵 {lang === 'hi' ? `डिलीवरी पर ₹${order.totalAmount} नकद तैयार रखें।` : `Keep ₹${order.totalAmount} cash ready for delivery.`}
                    </div>
                  )}

                  {/* Expanded details */}
                  {expandedOrder === order._id && (
                    <div className="mt-4 border-t pt-4 space-y-3 animate-fade-in">
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            {item.imageUrl && <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover" onError={e => e.target.style.display='none'} alt="" />}
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-muted text-xs">{lang === 'hi' ? 'मात्रा:' : 'Qty:'} {item.quantity} × ₹{item.price}</p>
                            </div>
                            <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 text-muted">
                        <div className="flex justify-between"><span>{lang === 'hi' ? 'उप-कुल' : 'Subtotal'}</span><span>₹{order.subtotal}</span></div>
                        <div className="flex justify-between"><span>{lang === 'hi' ? 'डिलीवरी' : 'Delivery'}</span><span>{order.deliveryCharge === 0 ? (lang === 'hi' ? 'मुफ्त' : 'FREE') : `₹${order.deliveryCharge}`}</span></div>
                        <div className="flex justify-between"><span>{lang === 'hi' ? 'प्लेटफॉर्म शुल्क' : 'Platform Fee'}</span><span>₹{order.platformFee}</span></div>
                        <div className="flex justify-between font-bold text-sm text-dark border-t pt-1">
                          <span>{lang === 'hi' ? 'कुल' : 'Total'}</span><span>₹{order.totalAmount}</span>
                        </div>
                      </div>
                      {order.deliveryAddress && (
                        <p className="text-sm text-muted">📍 {order.deliveryAddress}{order.deliveryCity && `, ${order.deliveryCity}`}{order.deliveryPincode && ` - ${order.deliveryPincode}`}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })()}
      </main>
      <Footer />
    </div>
  )
}
