import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
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

const STATUS_STEPS = ['placed', 'accepted', 'processing', 'shipped', 'delivered']

const DELIVERY_LABELS = {
  self_pickup: '🚶 Self Pickup',
  seller_delivery: '🏍️ Seller Delivery',
  company_delivery: '📦 Company Delivery'
}

export default function OrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/orders/my-orders')
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="min-h-screen bg-gray-100"><Navbar />
      <div className="pt-32 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-4xl mx-auto px-4">
        <h1 className="font-display text-2xl font-bold mb-6">📦 My Orders</h1>

        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-5xl">📭</p>
            <p className="text-gray-500 mt-4 text-lg">No orders yet</p>
            <Link to="/products" className="btn-primary mt-4 inline-block">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className="card p-5">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3 border-b pb-3 mb-3">
                  <div>
                    <span className="font-mono text-sm text-muted">Order #{order._id.slice(-8).toUpperCase()}</span>
                    <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status?.toUpperCase()}
                    </span>
                    <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.paymentStatus === 'paid' ? '💳 Paid' : '⏳ Unpaid'}
                    </span>
                  </div>
                </div>

                {/* Order tracker */}
                {order.status !== 'rejected' && order.status !== 'cancelled' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200 z-0" />
                      <div
                        className="absolute left-0 top-3 h-0.5 bg-primary z-0 transition-all duration-500"
                        style={{ width: `${(STATUS_STEPS.indexOf(order.status) / (STATUS_STEPS.length - 1)) * 100}%` }}
                      />
                      {STATUS_STEPS.map((step, idx) => {
                        const currentIdx = STATUS_STEPS.indexOf(order.status)
                        const done = idx <= currentIdx
                        return (
                          <div key={step} className="relative z-10 flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
                              ${done ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                              {done ? '✓' : idx + 1}
                            </div>
                            <span className={`text-xs font-medium capitalize hidden sm:block ${done ? 'text-primary' : 'text-gray-400'}`}>
                              {step}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {order.status === 'rejected' && (
                  <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    ❌ Order was rejected by seller.
                    {order.sellerStatuses?.[0]?.note && ` Reason: "${order.sellerStatuses[0].note}"`}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      {item.imageUrl && (
                        <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover" onError={e => e.target.style.display='none'} />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-muted text-xs">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                      <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t pt-3 text-sm flex-wrap gap-2">
                  <div className="text-muted">
                    <span>{DELIVERY_LABELS[order.deliveryType]}</span>
                    {order.deliveryAddress && <span className="ml-2">· {order.deliveryAddress.slice(0, 30)}...</span>}
                  </div>
                  <div className="font-bold text-primary text-base">Total: ₹{order.totalAmount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
