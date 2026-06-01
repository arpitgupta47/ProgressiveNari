import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/api.js'
import { showToast } from '../components/Toast.jsx'

const CATEGORIES = ['Pickles (Achaar)', 'Bakery', 'Cloth', 'Paintings', 'Art & Craft', 'Saree', 'Jewellery', 'Food', 'Other']

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  processing: 'bg-orange-100 text-orange-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700'
}

const DELIVERY_LABELS = {
  self_pickup: '🚶 Self Pickup',
  seller_delivery: '🏍️ Seller Delivery',
  company_delivery: '📦 Company Delivery'
}

export default function SellerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])

  // Product form
  const [form, setForm] = useState({
    title: '', description: '', category: CATEGORIES[0],
    price: '', stock: '1', location: '', imageUrl: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'seller') { navigate('/login'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersRes, productsRes, notifRes] = await Promise.all([
        api.get('/orders/seller-orders'),
        api.get('/products/my-products'),
        api.get('/notifications')
      ])
      setOrders(ordersRes.data)
      setProducts(productsRes.data)
      setNotifications(notifRes.data.filter(n => !n.isRead))
    } catch (err) {
      showToast('Failed to load data', 'error')
    } finally { setLoading(false) }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, { ...form, price: Number(form.price), stock: Number(form.stock) })
        showToast('Product updated!', 'success')
        setEditingId(null)
      } else {
        await api.post('/products', { ...form, price: Number(form.price), stock: Number(form.stock) })
        showToast('Product added successfully!', 'success')
      }
      setForm({ title: '', description: '', category: CATEGORIES[0], price: '', stock: '1', location: '', imageUrl: '' })
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error')
    } finally { setFormLoading(false) }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Remove this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p._id !== id))
      showToast('Product removed', 'success')
    } catch { showToast('Failed to remove product', 'error') }
  }

  const handleOrderAction = async (orderId, action, note = '') => {
    try {
      await api.put(`/orders/${orderId}/seller-action`, { action, note })
      showToast(`Order ${action}!`, action === 'accepted' ? 'success' : 'info')
      loadData()
    } catch { showToast('Failed to update order', 'error') }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      showToast(`Order marked as ${status}`, 'success')
      loadData()
    } catch { showToast('Failed to update status', 'error') }
  }

  const pendingOrders = orders.filter(o => {
    const sellerStatus = o.sellerStatuses?.find(s => s.seller === user.id || s.seller?._id === user.id || s.seller === user._id)
    return sellerStatus?.status === 'pending'
  })

  const stats = {
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    totalProducts: products.length,
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => {
        const myItems = o.items.filter(i => {
          const sellerId = i.seller?._id || i.seller
          return sellerId?.toString() === (user.id || user._id)?.toString()
        })
        return sum + myItems.reduce((s, i) => s + i.price * i.quantity, 0)
      }, 0)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-28 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted mt-4">Loading your dashboard...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">🏪 Seller Dashboard</h1>
              <p className="text-white/80 text-sm mt-1">Welcome, {user?.name}!</p>
            </div>
            {notifications.length > 0 && (
              <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold animate-pulse-ring">
                🔔 {notifications.length} new notification{notifications.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: 'text-blue-600' },
            { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'text-orange-600', pulse: stats.pendingOrders > 0 },
            { label: 'My Products', value: stats.totalProducts, icon: '🛍️', color: 'text-green-600' },
            { label: 'Revenue Earned', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: 'text-primary' }
          ].map(s => (
            <div key={s.label} className={`card p-4 ${s.pulse ? 'ring-2 ring-orange-400' : ''}`}>
              <div className="text-2xl">{s.icon}</div>
              <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: 'orders', label: 'Orders', count: pendingOrders.length },
            { id: 'products', label: 'My Products' },
            { id: 'add', label: editingId ? '✏️ Edit Product' : '+ Add Product' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
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
                <p className="text-gray-500 mt-3">No orders yet. Share your products to get started!</p>
              </div>
            ) : (
              orders.map(order => {
                const myItems = order.items.filter(i => {
                  const sid = i.seller?._id || i.seller
                  return sid?.toString() === (user.id || user._id)?.toString()
                })
                const sellerStatus = order.sellerStatuses?.find(s => {
                  const sid = s.seller?._id || s.seller
                  return sid?.toString() === (user.id || user._id)?.toString()
                })
                const myStatus = sellerStatus?.status || 'pending'

                return (
                  <div key={order._id} className={`card p-5 ${myStatus === 'pending' ? 'ring-2 ring-orange-400' : ''}`}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                          <span className={`badge ${STATUS_COLORS[myStatus] || 'bg-gray-100 text-gray-600'}`}>{myStatus.toUpperCase()}</span>
                          <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {order.paymentStatus === 'paid' ? '💳 Paid' : '⏳ Payment Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-1">
                          {new Date(order.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">₹{order.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted">{DELIVERY_LABELS[order.deliveryType]}</p>
                      </div>
                    </div>

                    {/* Customer info */}
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-gray-700">👤 {order.customer?.name}</p>
                      <p className="text-muted">{order.customer?.email} • {order.customer?.phone}</p>
                      {order.deliveryAddress && <p className="text-muted">📍 {order.deliveryAddress}</p>}
                      {order.customerNote && <p className="text-muted italic">💬 "{order.customerNote}"</p>}
                    </div>

                    {/* Order items */}
                    <div className="mt-3 space-y-2">
                      {myItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover" />}
                          <span className="font-medium flex-1">{item.title}</span>
                          <span className="text-muted">x{item.quantity}</span>
                          <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing breakdown */}
                    <div className="mt-3 border-t pt-3 text-xs text-muted grid grid-cols-3 gap-2">
                      <span>Subtotal: ₹{order.subtotal}</span>
                      <span>Platform fee: ₹{order.platformFee}</span>
                      <span>Delivery: ₹{order.deliveryCharge}</span>
                    </div>

                    {/* Actions */}
                    {myStatus === 'pending' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => handleOrderAction(order._id, 'accepted')}
                          className="btn-primary text-sm px-5 py-2">
                          ✅ Accept Order
                        </button>
                        <button onClick={() => {
                          const note = prompt('Reason for rejection (optional):') || ''
                          handleOrderAction(order._id, 'rejected', note)
                        }}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                          ❌ Reject Order
                        </button>
                      </div>
                    )}
                    {myStatus === 'accepted' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => handleUpdateStatus(order._id, 'processing')}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                          🔄 Mark Processing
                        </button>
                        <button onClick={() => handleUpdateStatus(order._id, 'shipped')}
                          className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                          📦 Mark Shipped
                        </button>
                      </div>
                    )}
                    {myStatus === 'processing' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'shipped')}
                        className="mt-4 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        📦 Mark Shipped
                      </button>
                    )}
                    {myStatus === 'shipped' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'delivered')}
                        className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        ✅ Mark Delivered
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            {products.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="text-gray-500 mt-3">No products yet.</p>
                <button onClick={() => setActiveTab('add')} className="btn-primary mt-4">Add Your First Product</button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map(p => (
                  <div key={p._id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      <img src={p.imageUrl || 'https://placehold.co/400x200/f0f2f5/ccc?text=No+Image'}
                        className="w-full h-full object-cover" onError={e => e.target.src = 'https://placehold.co/400x200/f0f2f5/ccc?text=No+Image'} />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800">{p.title}</h3>
                      <p className="text-xs text-muted mt-0.5">{p.category} • {p.location || 'Location not set'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">₹{p.price.toLocaleString()}</span>
                        <span className="text-xs text-muted">Stock: {p.stock}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { setForm({ title: p.title, description: p.description, category: p.category, price: p.price, stock: p.stock || 1, location: p.location || '', imageUrl: p.imageUrl || '' }); setEditingId(p._id); setActiveTab('add') }}
                          className="flex-1 text-xs font-semibold py-1.5 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDeleteProduct(p._id)}
                          className="flex-1 text-xs font-semibold py-1.5 border border-red-400 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD/EDIT PRODUCT TAB */}
        {activeTab === 'add' && (
          <div className="card p-6 max-w-2xl">
            <h2 className="font-display text-xl font-bold mb-5">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="e.g. Homemade Mango Pickle" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} className="input-field resize-none" placeholder="Describe your product in detail..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
                  <input type="number" min="1" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input-field" placeholder="₹ Price" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Quantity</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} className="input-field" placeholder="Available qty" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input-field" placeholder="City, State" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Image URL</label>
                <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} className="input-field" placeholder="https://... (paste image URL)" />
                {form.imageUrl && <img src={form.imageUrl} className="mt-2 h-24 rounded-lg object-cover" onError={e => e.target.style.display='none'} />}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={formLoading} className="btn-primary flex-1">
                  {formLoading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '', category: CATEGORIES[0], price: '', stock: '1', location: '', imageUrl: '' }) }}
                    className="btn-secondary px-5">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
