import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/api.js'
import { showToast } from '../components/Toast.jsx'

const STATUS_COLORS = {
  assigned: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-yellow-100 text-yellow-700',
  in_transit: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700'
}

const DELIVERY_LABELS = {
  self_pickup: '🚶 Self Pickup',
  seller_delivery: '🏍️ Seller Delivery',
  company_delivery: '📦 Company Delivery'
}

export default function DeliveryDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('available')
  const [orders, setOrders] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'delivery_person') { navigate('/login'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [availRes, myRes, statsRes] = await Promise.all([
        api.get('/delivery/available'),
        api.get('/delivery/my-orders'),
        api.get('/delivery/stats')
      ])
      setOrders(availRes.data)
      setMyOrders(myRes.data)
      setStats(statsRes.data)
    } catch (err) {
      showToast('Failed to load data', 'error')
    } finally { setLoading(false) }
  }

  const handleAcceptOrder = async (orderId) => {
    try {
      await api.post(`/delivery/${orderId}/accept`)
      showToast('Order accepted!', 'success')
      loadData()
      setActiveTab('my-orders')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept order', 'error')
    }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.put(`/delivery/${orderId}/update-status`, { status })
      showToast(`Order marked as ${status}!`, 'success')
      loadData()
    } catch (err) {
      showToast('Failed to update status', 'error')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-28 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted mt-4">Loading delivery dashboard...</p>
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
              <h1 className="font-display text-2xl font-bold">🚚 Delivery Dashboard</h1>
              <p className="text-white/80 text-sm mt-1">Welcome, {user?.name}!</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">Vehicle: {stats?.vehicle || 'Not set'}</div>
              <div className="text-sm text-white/80">Rating: ⭐ {stats?.rating || '0'}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '📦', color: 'text-blue-600' },
            { label: "Today's Orders", value: stats?.todayOrders || 0, icon: '📅', color: 'text-orange-600' },
            { label: 'Completed', value: stats?.completedOrders || 0, icon: '✅', color: 'text-green-600' },
            { label: 'Rating', value: `⭐ ${stats?.rating || 0}`, icon: '⭐', color: 'text-yellow-600' }
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className="text-2xl">{s.icon}</div>
              <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: 'available', label: '📍 Available Orders', count: orders.length },
            { id: 'my-orders', label: '🚚 My Orders', count: myOrders.length }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.label}
              {tab.count > 0 && <span className="bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* AVAILABLE ORDERS TAB */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="text-gray-500 mt-3">No available orders at the moment.</p>
                <p className="text-sm text-muted mt-1">Check back soon for new delivery opportunities!</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order._id} className="card p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                        <span className="badge bg-blue-100 text-blue-700">📦 Company Delivery</span>
                      </div>
                      <p className="text-sm text-muted mt-1">
                        {new Date(order.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">₹{order.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-gray-700">👤 {order.customer?.name}</p>
                    <p className="text-muted">{order.customer?.email} • {order.customer?.phone}</p>
                    {order.deliveryAddress && <p className="text-muted">📍 {order.deliveryAddress}</p>}
                  </div>

                  {/* Items preview */}
                  <button onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    className="mt-3 text-sm text-primary font-semibold hover:underline">
                    {expandedOrder === order._id ? '▼ Hide Items' : '▶ Show Items'}
                  </button>

                  {expandedOrder === order._id && (
                    <div className="mt-3 space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover" />}
                          <span className="font-medium flex-1">{item.title}</span>
                          <span className="text-muted">x{item.quantity}</span>
                          <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action */}
                  <div className="mt-4">
                    <button onClick={() => handleAcceptOrder(order._id)}
                      className="btn-primary w-full text-sm px-5 py-2.5">
                      ✅ Accept This Order
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MY ORDERS TAB */}
        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="text-gray-500 mt-3">You haven't accepted any orders yet.</p>
                <button onClick={() => setActiveTab('available')} className="btn-primary mt-4">
                  Find Available Orders
                </button>
              </div>
            ) : (
              myOrders.map(order => (
                <div key={order._id} className={`card p-5 ${order.deliveryTrackingStatus === 'assigned' ? 'ring-2 ring-blue-400' : ''}`}>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                        <span className={`badge ${STATUS_COLORS[order.deliveryTrackingStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {order.deliveryTrackingStatus?.toUpperCase().replace('_', ' ') || 'PENDING'}
                        </span>
                      </div>
                      <p className="text-sm text-muted mt-1">
                        {new Date(order.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">₹{order.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-gray-700">👤 {order.customer?.name}</p>
                    <p className="text-muted">{order.customer?.email} • {order.customer?.phone}</p>
                    {order.deliveryAddress && <p className="text-muted">📍 {order.deliveryAddress}</p>}
                  </div>

                  {/* Status update actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.deliveryTrackingStatus === 'assigned' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'picked_up')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        📦 Picked Up
                      </button>
                    )}
                    {order.deliveryTrackingStatus === 'picked_up' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'in_transit')}
                        className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        🚗 In Transit
                      </button>
                    )}
                    {order.deliveryTrackingStatus === 'in_transit' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'delivered')}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        ✅ Delivered
                      </button>
                    )}
                    {(order.deliveryTrackingStatus === 'picked_up' || order.deliveryTrackingStatus === 'in_transit') && (
                      <button onClick={() => handleUpdateStatus(order._id, 'failed')}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                        ❌ Failed Delivery
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
