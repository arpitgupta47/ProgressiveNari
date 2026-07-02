import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { showToast } from '../components/Toast.jsx'
import api from '../api/api.js'

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  processing: 'bg-orange-100 text-orange-700',
  packed: 'bg-purple-100 text-purple-700',
  picked_up: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function DeliveryDashboard() {
  const { user, logout } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('available')
  const [availableOrders, setAvailableOrders] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [otpInputs, setOtpInputs] = useState({})
  const [profile, setProfile] = useState(null)
  const [locationTracking, setLocationTracking] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'delivery') { navigate('/login'); return }
    loadData()
    loadProfile()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [avail, mine] = await Promise.all([
        api.get('/orders/available-for-pickup'),
        api.get('/orders/delivery-orders')
      ])
      setAvailableOrders(avail.data || [])
      setMyOrders(mine.data || [])
    } catch { showToast('Failed to load orders', 'error') }
    setLoading(false)
  }

  const loadProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      setProfile(res.data)
    } catch {}
  }

  const startLocationTracking = () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return }
    setLocationTracking(true)
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await api.put('/auth/delivery/location', { latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        } catch {}
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
    window._deliveryWatchId = watchId
    showToast('📍 ' + (lang === 'hi' ? 'लोकेशन ट्रैकिंग शुरू' : 'Location tracking started'), 'success')
  }

  const stopLocationTracking = () => {
    if (window._deliveryWatchId) {
      navigator.geolocation.clearWatch(window._deliveryWatchId)
      window._deliveryWatchId = null
    }
    setLocationTracking(false)
    showToast(lang === 'hi' ? 'लोकेशन ट्रैकिंग बंद' : 'Location tracking stopped', 'info')
  }

  const acceptOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/delivery-accept`)
      showToast(lang === 'hi' ? '✅ ऑर्डर स्वीकार किया!' : '✅ Order accepted!', 'success')
      loadData()
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const markOutForDelivery = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/out-for-delivery`)
      showToast(lang === 'hi' ? '🚀 डिलीवरी के लिए निकले!' : '🚀 Marked out for delivery!', 'success')
      loadData()
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const completeDelivery = async (orderId) => {
    const otp = otpInputs[orderId]
    if (!otp || otp.length !== 4) { showToast(lang === 'hi' ? 'OTP दर्ज करें (4 अंक)' : 'Enter 4-digit OTP from customer', 'error'); return }
    try {
      await api.put(`/orders/${orderId}/delivery-complete`, { otp })
      showToast(lang === 'hi' ? '🎉 डिलीवरी पूरी!' : '🎉 Delivery completed!', 'success')
      setOtpInputs(prev => { const n = { ...prev }; delete n[orderId]; return n })
      loadData()
    } catch (err) { showToast(err.response?.data?.message || 'Invalid OTP', 'error') }
  }

  const activeDeliveries = myOrders.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status))
  const completedDeliveries = myOrders.filter(o => o.status === 'delivered')

  if (loading) return (
    <div className="min-h-screen bg-gray-100"><Navbar />
      <div className="pt-28 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted mt-4">{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">🏍️ {lang === 'hi' ? 'डिलीवरी डैशबोर्ड' : 'Delivery Dashboard'}</h1>
              <p className="text-white/80 text-sm mt-1">{lang === 'hi' ? 'स्वागत है,' : 'Welcome,'} {user?.name} | {profile?.vehicleType || 'Vehicle'} {profile?.vehicleNumber && `• ${profile.vehicleNumber}`}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={locationTracking ? stopLocationTracking : startLocationTracking}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${locationTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}>
                {locationTracking ? '⏹️ Stop Tracking' : '📍 Start Tracking'}
              </button>
              <button onClick={loadData} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors">
                🔄 {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </button>
            </div>
          </div>
          {locationTracking && (
            <div className="mt-3 bg-green-500/20 border border-green-400/30 rounded-xl px-3 py-2 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {lang === 'hi' ? 'लाइव लोकेशन ट्रैकिंग चालू है' : 'Live location tracking is active'}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: lang === 'hi' ? 'उपलब्ध ऑर्डर' : 'Available Orders', value: availableOrders.length, icon: '📦', color: 'text-blue-600', pulse: availableOrders.length > 0 },
            { label: lang === 'hi' ? 'सक्रिय डिलीवरी' : 'Active Deliveries', value: activeDeliveries.length, icon: '🏍️', color: 'text-orange-600' },
            { label: lang === 'hi' ? 'पूरी डिलीवरी' : 'Completed', value: completedDeliveries.length, icon: '✅', color: 'text-green-600' },
            { label: lang === 'hi' ? 'कुल डिलीवरी' : 'Total Deliveries', value: profile?.totalDeliveries || 0, icon: '🏆', color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className={`card p-4 ${s.pulse ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}>
              <div className="text-2xl">{s.icon}</div>
              <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: 'available', label: lang === 'hi' ? '📦 उपलब्ध ऑर्डर' : '📦 Available Orders', count: availableOrders.length },
            { id: 'active', label: lang === 'hi' ? '🏍️ मेरी डिलीवरी' : '🏍️ My Deliveries', count: activeDeliveries.length },
            { id: 'completed', label: lang === 'hi' ? '✅ पूरी हुईं' : '✅ Completed' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.label}
              {tab.count > 0 && <span className="bg-white text-indigo-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* AVAILABLE ORDERS TAB */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {availableOrders.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-5xl">📭</p>
                <p className="text-gray-500 mt-3 text-lg">{lang === 'hi' ? 'अभी कोई ऑर्डर उपलब्ध नहीं' : 'No orders available for pickup'}</p>
                <p className="text-sm text-muted mt-1">{lang === 'hi' ? 'नए ऑर्डर के लिए रिफ्रेश करें' : 'Refresh to check for new orders'}</p>
                <button onClick={loadData} className="btn-primary mt-4">{lang === 'hi' ? 'रिफ्रेश करें' : 'Refresh'}</button>
              </div>
            ) : availableOrders.map(order => (
              <div key={order._id} className="card p-5 border-l-4 border-blue-500">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className={`ml-2 badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status?.toUpperCase()}</span>
                    <p className="text-xs text-muted mt-1">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">₹{order.totalAmount?.toLocaleString()}</p>
                    <p className="text-xs text-muted">{order.deliveryType === 'company_delivery' ? '📦 Company' : '🏍️ Seller'}</p>
                  </div>
                </div>

                {/* Customer & delivery info */}
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-blue-800">👤 {lang === 'hi' ? 'ग्राहक' : 'Customer'}</p>
                    <p className="text-muted">{order.customer?.name}</p>
                    <p className="text-muted">{order.customer?.phone}</p>
                    {order.deliveryAddress && <p className="text-muted mt-1">📍 {order.deliveryAddress}</p>}
                    {order.deliveryCity && <p className="text-muted">{order.deliveryCity} {order.deliveryPincode && `- ${order.deliveryPincode}`}</p>}
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-purple-800">🏪 {lang === 'hi' ? 'विक्रेता' : 'Pickup From'}</p>
                    {order.items?.slice(0, 2).map((item, i) => (
                      <div key={i}>
                        <p className="text-muted">{item.seller?.name}</p>
                        {item.seller?.address && <p className="text-muted">📍 {item.seller.address}</p>}
                        {item.seller?.city && <p className="text-muted">{item.seller.city}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div className="mt-3 space-y-1">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span>• {item.title}</span>
                      <span className="text-muted">x{item.quantity}</span>
                      <span className="font-semibold">₹{(item.price * item.quantity)?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => acceptOrder(order._id)}
                  className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
                  🏍️ {lang === 'hi' ? 'पिकअप स्वीकार करें' : 'Accept for Pickup'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVE DELIVERIES TAB */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeDeliveries.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-5xl">🏍️</p>
                <p className="text-gray-500 mt-3">{lang === 'hi' ? 'कोई सक्रिय डिलीवरी नहीं' : 'No active deliveries'}</p>
                <button onClick={() => setActiveTab('available')} className="btn-primary mt-4">
                  {lang === 'hi' ? 'उपलब्ध ऑर्डर देखें' : 'View Available Orders'}
                </button>
              </div>
            ) : activeDeliveries.map(order => (
              <div key={order._id} className="card p-5 border-l-4 border-indigo-500">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className={`ml-2 badge ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>{order.status?.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <span className="font-bold text-lg text-primary">₹{order.totalAmount?.toLocaleString()}</span>
                </div>

                {/* Customer */}
                <div className="mt-3 bg-gray-50 rounded-xl p-3 text-sm">
                  <p className="font-semibold">👤 {order.customer?.name} • {order.customer?.phone}</p>
                  {order.deliveryAddress && <p className="text-muted mt-1">📍 {order.deliveryAddress}, {order.deliveryCity} {order.deliveryPincode}</p>}
                </div>

                {/* Payment info */}
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.paymentStatus === 'paid' ? '💳 Paid' : order.paymentMethod === 'cod' ? '💵 Collect ₹' + order.totalAmount : '⏳ Unpaid'}
                  </span>
                  {order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' && (
                    <span className="badge bg-red-100 text-red-700 animate-pulse">⚠️ Collect Cash!</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 space-y-2">
                  {order.status === 'picked_up' && (
                    <button onClick={() => markOutForDelivery(order._id)}
                      className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors">
                      🚀 {lang === 'hi' ? 'डिलीवरी के लिए निकलें' : 'Mark Out for Delivery'}
                    </button>
                  )}

                  {(order.status === 'out_for_delivery') && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">
                        🔐 {lang === 'hi' ? 'ग्राहक से OTP लें और यहाँ दर्ज करें:' : 'Get OTP from customer and enter:'}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="4-digit OTP"
                          maxLength={4}
                          value={otpInputs[order._id] || ''}
                          onChange={e => setOtpInputs(prev => ({ ...prev, [order._id]: e.target.value.slice(0, 4) }))}
                          className="input-field flex-1 text-center text-xl font-bold tracking-widest"
                        />
                        <button onClick={() => completeDelivery(order._id)}
                          className="px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">
                          ✅ {lang === 'hi' ? 'पूरा करें' : 'Confirm'}
                        </button>
                      </div>
                      <p className="text-xs text-muted text-center">
                        {lang === 'hi' ? 'OTP ग्राहक के SMS में गया है' : 'OTP was sent to customer via notification'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COMPLETED TAB */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedDeliveries.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-5xl">✅</p>
                <p className="text-gray-500 mt-3">{lang === 'hi' ? 'कोई पूरी डिलीवरी नहीं' : 'No completed deliveries yet'}</p>
              </div>
            ) : completedDeliveries.map(order => (
              <div key={order._id} className="card p-4 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className="ml-2 badge bg-emerald-100 text-emerald-700">✅ DELIVERED</span>
                    <p className="text-xs text-muted mt-1">{new Date(order.updatedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{order.totalAmount?.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 font-semibold">{lang === 'hi' ? 'पूरी' : 'Completed'} ✓</p>
                  </div>
                </div>
                <p className="text-sm text-muted mt-2">👤 {order.customer?.name} • 📍 {order.deliveryCity || order.deliveryAddress?.slice(0, 30)}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
