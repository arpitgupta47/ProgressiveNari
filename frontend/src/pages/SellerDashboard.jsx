import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
// import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { showToast } from '../components/Toast.jsx'
import api from '../api/api.js'

const CATEGORIES = ['Pickles (Achaar)', 'Bakery', 'Cloth', 'Paintings', 'Art & Craft', 'Saree', 'Jewellery', 'Food', 'Other']

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700', pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  processing: 'bg-orange-100 text-orange-700', packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700', delivered: 'bg-emerald-100 text-emerald-700',
}

const DELIVERY_LABELS = {
  self_pickup: '🚶 Self Pickup', seller_delivery: '🏍️ Seller Delivery', company_delivery: '📦 Company Delivery'
}

export default function SellerDashboard() {
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', category: CATEGORIES[0], price: '', stock: '1', location: '', imageUrl: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'seller') { navigate('/login'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/orders/seller-orders'),
        api.get('/products/my-products')
      ])
      setOrders(ordersRes.data)
      setProducts(productsRes.data)
    } catch { showToast('Failed to load data', 'error') }
    setLoading(false)
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, { ...form, price: Number(form.price), stock: Number(form.stock) })
        showToast(lang === 'hi' ? 'उत्पाद अपडेट हुआ!' : 'Product updated!', 'success')
        setEditingId(null)
      } else {
        await api.post('/products', { ...form, price: Number(form.price), stock: Number(form.stock) })
        showToast(lang === 'hi' ? 'उत्पाद जुड़ गया!' : 'Product added!', 'success')
      }
      setForm({ title: '', description: '', category: CATEGORIES[0], price: '', stock: '1', location: '', imageUrl: '' })
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error')
    }
    setFormLoading(false)
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(lang === 'hi' ? 'उत्पाद हटाएं?' : 'Remove this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p._id !== id))
      showToast(lang === 'hi' ? 'उत्पाद हटाया गया' : 'Product removed', 'success')
    } catch { showToast('Failed', 'error') }
  }

  const handleOrderAction = async (orderId, action, note = '') => {
    try {
      await api.put(`/orders/${orderId}/seller-action`, { action, note })
      showToast(lang === 'hi' ? `ऑर्डर ${action === 'accepted' ? 'स्वीकार' : 'अस्वीकार'} किया!` : `Order ${action}!`, action === 'accepted' ? 'success' : 'info')
      loadData()
    } catch { showToast('Failed', 'error') }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      showToast(lang === 'hi' ? `ऑर्डर ${status} हुआ` : `Order marked as ${status}`, 'success')
      loadData()
    } catch { showToast('Failed', 'error') }
  }

  const pendingOrders = orders.filter(o => {
    const ss = o.sellerStatuses?.find(s => {
      const sid = s.seller?._id || s.seller
      return sid?.toString() === (user?.id || user?._id)?.toString()
    })
    return ss?.status === 'pending'
  })

  const stats = {
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    totalProducts: products.length,
    revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => {
      const myItems = o.items?.filter(i => {
        const sid = i.seller?._id || i.seller
        return sid?.toString() === (user?.id || user?._id)?.toString()
      }) || []
      return sum + myItems.reduce((s, i) => s + i.price * i.quantity, 0)
    }, 0)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100"><Navbar />
      <div className="pt-28 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">🏪 {lang === 'hi' ? 'विक्रेता डैशबोर्ड' : 'Seller Dashboard'}</h1>
              <p className="text-white/80 text-sm mt-1">{lang === 'hi' ? 'स्वागत है,' : 'Welcome,'} {user?.name}!</p>
            </div>
            <div className="flex gap-2">
              <Link to="/seller/profile" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                👤 {lang === 'hi' ? 'प्रोफाइल' : 'Profile'}
              </Link>
              <button onClick={loadData} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                🔄 {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: lang === 'hi' ? 'कुल ऑर्डर' : 'Total Orders', value: stats.totalOrders, icon: '📦', color: 'text-blue-600' },
            { label: lang === 'hi' ? 'लंबित ऑर्डर' : 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'text-orange-600', pulse: stats.pendingOrders > 0 },
            { label: lang === 'hi' ? 'मेरे उत्पाद' : 'My Products', value: stats.totalProducts, icon: '🛍️', color: 'text-green-600' },
            { label: lang === 'hi' ? 'कमाई' : 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: '💰', color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className={`card p-4 ${s.pulse ? 'ring-2 ring-orange-400 animate-pulse' : ''}`}>
              <div className="text-2xl">{s.icon}</div>
              <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          {[
            { id: 'orders', label: lang === 'hi' ? 'ऑर्डर' : 'Orders', count: pendingOrders.length },
            { id: 'products', label: lang === 'hi' ? 'उत्पाद' : 'Products' },
            { id: 'add', label: editingId ? (lang === 'hi' ? '✏️ संपादित करें' : '✏️ Edit') : (lang === 'hi' ? '+ जोड़ें' : '+ Add Product') },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.label}
              {tab.count > 0 && <span className="bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="text-gray-500 mt-3">{lang === 'hi' ? 'अभी कोई ऑर्डर नहीं।' : 'No orders yet.'}</p>
              </div>
            ) : orders.map(order => {
              const myItems = order.items?.filter(i => {
                const sid = i.seller?._id || i.seller
                return sid?.toString() === (user?.id || user?._id)?.toString()
              }) || []
              const sellerStatus = order.sellerStatuses?.find(s => {
                const sid = s.seller?._id || s.seller
                return sid?.toString() === (user?.id || user?._id)?.toString()
              })
              const myStatus = sellerStatus?.status || 'pending'

              return (
                <div key={order._id} className={`card p-5 ${myStatus === 'pending' ? 'ring-2 ring-orange-400' : ''}`}>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                        <span className={`badge ${STATUS_COLORS[myStatus] || 'bg-gray-100 text-gray-600'}`}>{myStatus.toUpperCase()}</span>
                        <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentMethod === 'cod' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                          {order.paymentStatus === 'paid' ? '💳 Paid' : order.paymentMethod === 'cod' ? '💵 COD' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">₹{order.totalAmount?.toLocaleString()}</p>
                      <p className="text-xs text-muted">{DELIVERY_LABELS[order.deliveryType]}</p>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-gray-700">👤 {order.customer?.name}</p>
                    <p className="text-muted">{order.customer?.email} • {order.customer?.phone}</p>
                    {order.deliveryAddress && <p className="text-muted">📍 {order.deliveryAddress}, {order.deliveryCity} {order.deliveryPincode}</p>}
                    {order.customerNote && <p className="text-muted italic mt-1">💬 "{order.customerNote}"</p>}
                  </div>

                  {/* Items */}
                  <div className="mt-3 space-y-2">
                    {myItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                        <span className="font-medium flex-1">{item.title}</span>
                        <span className="text-muted">x{item.quantity}</span>
                        <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Breakdown */}
                  <div className="mt-3 border-t pt-2 text-xs text-muted flex gap-4 flex-wrap">
                    <span>Subtotal: ₹{order.subtotal}</span>
                    <span>Platform fee: ₹{order.platformFee}</span>
                    <span>Your payout: ₹{order.sellerPayout}</span>
                  </div>

                  {/* Actions */}
                  {myStatus === 'pending' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => handleOrderAction(order._id, 'accepted')} className="btn-primary text-sm px-5 py-2">
                        ✅ {lang === 'hi' ? 'स्वीकार करें' : 'Accept Order'}
                      </button>
                      <button onClick={() => { const note = window.prompt('Reason for rejection:') || ''; handleOrderAction(order._id, 'rejected', note) }}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                        ❌ {lang === 'hi' ? 'अस्वीकार करें' : 'Reject Order'}
                      </button>
                    </div>
                  )}
                  {myStatus === 'accepted' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => handleUpdateStatus(order._id, 'processing')} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        🔄 {lang === 'hi' ? 'प्रोसेसिंग' : 'Processing'}
                      </button>
                      <button onClick={() => handleUpdateStatus(order._id, 'packed')} className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        📦 {lang === 'hi' ? 'पैक किया' : 'Mark Packed'}
                      </button>
                    </div>
                  )}
                  {myStatus === 'processing' && (
                    <button onClick={() => handleUpdateStatus(order._id, 'packed')} className="mt-4 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                      📦 {lang === 'hi' ? 'पैक किया' : 'Mark Packed'}
                    </button>
                  )}
                  {(myStatus === 'packed' || myStatus === 'accepted') && order.deliveryType === 'seller_delivery' && (
                    <button onClick={() => handleUpdateStatus(order._id, 'shipped')} className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                      🚀 {lang === 'hi' ? 'भेज दिया' : 'Mark Shipped'}
                    </button>
                  )}
                  {myStatus === 'shipped' && order.deliveryType === 'seller_delivery' && (
                    <button onClick={() => handleUpdateStatus(order._id, 'delivered')} className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                      ✅ {lang === 'hi' ? 'डिलीवर हुआ' : 'Mark Delivered'}
                    </button>
                  )}
                  {order.deliveryType === 'company_delivery' && myStatus === 'packed' && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
                      📦 {lang === 'hi' ? 'डिलीवरी बॉय पिकअप करेगा।' : 'Waiting for delivery boy to pick up.'}
                    </div>
                  )}
                  {order.deliveryType === 'self_pickup' && myStatus === 'accepted' && (
                    <button onClick={() => handleUpdateStatus(order._id, 'delivered')} className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                      ✅ {lang === 'hi' ? 'ग्राहक ने ले लिया' : 'Customer Picked Up'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            {products.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="text-gray-500 mt-3">{lang === 'hi' ? 'कोई उत्पाद नहीं।' : 'No products yet.'}</p>
                <button onClick={() => setActiveTab('add')} className="btn-primary mt-4">
                  {lang === 'hi' ? 'पहला उत्पाद जोड़ें' : 'Add First Product'}
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map(p => (
                  <div key={p._id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      <img src={p.imageUrl || 'https://placehold.co/400x200/f0f2f5/ccc?text=No+Image'}
                        className="w-full h-full object-cover" alt={p.title}
                        onError={e => e.target.src = 'https://placehold.co/400x200/f0f2f5/ccc?text=No+Image'} />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 truncate">{p.title}</h3>
                      <p className="text-xs text-muted mt-0.5">{p.category} • {p.city || p.location || 'Location not set'}</p>
                      {!p.city && !p.latitude && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ {lang === 'hi' ? 'लोकेशन सेट करें' : 'Set location in profile for nearby search'}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">₹{p.price?.toLocaleString()}</span>
                        <span className="text-xs text-muted">{lang === 'hi' ? 'स्टॉक:' : 'Stock:'} {p.stock}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => {
                          setForm({ title: p.title, description: p.description, category: p.category, price: p.price, stock: p.stock || 1, location: p.location || '', imageUrl: p.imageUrl || '' })
                          setEditingId(p._id)
                          setActiveTab('add')
                        }} className="flex-1 text-xs font-semibold py-1.5 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                          ✏️ {lang === 'hi' ? 'संपादित' : 'Edit'}
                        </button>
                        <button onClick={() => handleDeleteProduct(p._id)} className="flex-1 text-xs font-semibold py-1.5 border border-red-400 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                          🗑️ {lang === 'hi' ? 'हटाएं' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD/EDIT TAB */}
        {activeTab === 'add' && (
          <div className="card p-6 max-w-2xl">
            <h2 className="font-display text-xl font-bold mb-5">
              {editingId ? (lang === 'hi' ? 'उत्पाद संपादित करें' : 'Edit Product') : (lang === 'hi' ? 'नया उत्पाद जोड़ें' : 'Add New Product')}
            </h2>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'उत्पाद का नाम *' : 'Product Title *'}</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder={lang === 'hi' ? 'जैसे: घर का बना आम का अचार' : 'e.g. Homemade Mango Pickle'} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'विवरण *' : 'Description *'}</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} className="input-field resize-none" placeholder={lang === 'hi' ? 'उत्पाद का विस्तृत विवरण...' : 'Detailed product description...'} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'श्रेणी *' : 'Category *'}</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'कीमत (₹) *' : 'Price (₹) *'}</label>
                  <input type="number" min="1" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input-field" placeholder="₹" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'स्टॉक' : 'Stock'}</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'स्थान' : 'Location'}</label>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input-field" placeholder="City, State" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'इमेज URL' : 'Image URL'}</label>
                <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} className="input-field" placeholder="https://..." />
                {form.imageUrl && <img src={form.imageUrl} className="mt-2 h-24 rounded-lg object-cover" onError={e => e.target.style.display = 'none'} alt="" />}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={formLoading} className="btn-primary flex-1">
                  {formLoading ? '⏳...' : editingId ? (lang === 'hi' ? 'अपडेट करें' : 'Update Product') : (lang === 'hi' ? 'उत्पाद जोड़ें' : 'Add Product')}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '', category: CATEGORIES[0], price: '', stock: '1', location: '', imageUrl: '' }) }} className="btn-secondary px-5">
                    {lang === 'hi' ? 'रद्द' : 'Cancel'}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
