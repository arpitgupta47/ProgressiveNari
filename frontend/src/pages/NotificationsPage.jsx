import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/api.js'

const TYPE_ICONS = {
  new_order: '🛒',
  order_accepted: '✅',
  order_rejected: '❌',
  order_shipped: '📦',
  order_delivered: '🎉',
  payment_success: '💳'
}

const TYPE_COLORS = {
  new_order: 'border-l-blue-500 bg-blue-50',
  order_accepted: 'border-l-green-500 bg-green-50',
  order_rejected: 'border-l-red-500 bg-red-50',
  order_shipped: 'border-l-purple-500 bg-purple-50',
  order_delivered: 'border-l-emerald-500 bg-emerald-50',
  payment_success: 'border-l-yellow-500 bg-yellow-50'
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch { } finally { setLoading(false) }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch { }
  }

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch { }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!user) return (
    <div className="min-h-screen bg-gray-100"><Navbar />
      <div className="pt-32 text-center"><p>Please <Link to="/login" className="text-primary underline">login</Link> to view notifications.</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">🔔 Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-muted mt-1">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-primary font-semibold hover:underline">
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-5xl">🔔</p>
            <p className="text-gray-500 mt-4">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`card p-4 border-l-4 cursor-pointer transition-all hover:shadow-md
                  ${TYPE_COLORS[n.type] || 'border-l-gray-300 bg-white'}
                  ${!n.isRead ? 'opacity-100' : 'opacity-70'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-800">{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
