import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { useLocation2 } from '../context/LocationContext.jsx'
import { t } from '../utils/translations.js'
import api from '../api/api.js'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const { lang, toggleLang } = useLang()
  const { location, requestLocation, locationStatus } = useLocation2()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      try { const res = await api.get('/notifications/unread-count'); setUnreadCount(res.data.count) } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
  }

  const handleLogout = () => { logout(); navigate('/') }

  const NAV_LINKS = [
    { to: '/products', key: 'products' },
    { to: '/services', key: 'services' },
    { to: '/courses', key: 'courses' },
    { to: '/star-worker', key: 'star_worker' },
    { to: '/about', key: 'about' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-lg">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-gray-900 via-dark to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-3 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">PN</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-display font-bold text-lg leading-none text-white">Progressive</div>
                <div className="text-xs text-accent leading-none font-semibold">Naari 🌸</div>
              </div>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2 hidden sm:flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(lang, 'search_placeholder')}
              className="flex-1 px-4 py-2 text-sm text-gray-800 bg-white rounded-l-lg outline-none border-0 focus:ring-2 focus:ring-accent"
            />
            <button type="submit" className="px-4 bg-accent hover:bg-yellow-400 rounded-r-lg transition-colors">
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Location button */}
            <button
              onClick={requestLocation}
              title={location ? location.displayName : t(lang, 'enable_location')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                locationStatus === 'granted'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
              }`}
            >
              <span>📍</span>
              <span className="max-w-20 truncate">
                {locationStatus === 'granted' ? location?.displayName : t(lang, 'enable_location')}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-bold transition-all"
              title="Switch Language / भाषा बदलें"
            >
              <span>{lang === 'en' ? '🇮🇳' : '🇬🇧'}</span>
              <span>{lang === 'en' ? 'हिंदी' : 'ENG'}</span>
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse-ring text-[10px]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                {user.role === 'customer' && (
                  <Link to="/cart" className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-gray-900 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px]">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <div className="w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow">
                      <span className="text-white font-bold text-xs">{user.name[0].toUpperCase()}</span>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-xs text-gray-300 leading-none">{lang === 'hi' ? 'नमस्ते,' : 'Hello,'} {user.name.split(' ')[0]}</div>
                      <div className="text-xs font-semibold capitalize leading-none mt-0.5">{user.role === 'seller' ? (lang === 'hi' ? 'विक्रेता' : 'Seller') : (lang === 'hi' ? 'ग्राहक' : 'Customer')}</div>
                    </div>
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-slide-in overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
                        <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <span className={`mt-1 badge text-xs ${user.role === 'seller' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-700'}`}>
                          {user.role === 'seller' ? '🏪 Seller' : '🛍️ Customer'}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link to={user.role === 'seller' ? '/seller/dashboard' : '/customer/dashboard'} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowDropdown(false)}>
                          🏠 {t(lang, 'my_dashboard')}
                        </Link>
                        {user.role === 'customer' && (
                          <Link to="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowDropdown(false)}>
                            📦 {t(lang, 'my_orders')}
                          </Link>
                        )}
                        <Link to="/notifications" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowDropdown(false)}>
                          🔔 {t(lang, 'notifications')}
                          {unreadCount > 0 && <span className="ml-auto badge bg-primary text-white text-xs">{unreadCount}</span>}
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                          🚪 {t(lang, 'logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-1.5">
                <Link to="/login" className="px-3 py-1.5 text-xs font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors">{t(lang, 'login')}</Link>
                <Link to="/register" className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors shadow-md">{t(lang, 'register')}</Link>
              </div>
            )}

            {/* Mobile menu */}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="sm:hidden p-2 hover:bg-white/10 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden px-3 pb-2">
          <form onSubmit={handleSearch} className="flex">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(lang, 'search_placeholder')} className="flex-1 px-3 py-2 text-sm text-gray-800 bg-white rounded-l-lg outline-none" />
            <button type="submit" className="px-3 bg-accent rounded-r-lg text-sm">🔍</button>
          </form>
        </div>
      </div>

      {/* Category/Nav bar */}
      <div className="bg-gray-800 text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto px-3 flex items-center gap-0.5 overflow-x-auto py-1 scrollbar-hide">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium hover:bg-white/10 rounded transition-colors whitespace-nowrap text-gray-300 hover:text-white">
              {t(lang, link.key)}
            </Link>
          ))}
          {/* Location pill in nav bar */}
          {locationStatus !== 'granted' && (
            <button onClick={requestLocation} className="flex-shrink-0 ml-auto flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600/20 text-green-300 border border-green-600/30 rounded-full hover:bg-green-600/30 transition-colors whitespace-nowrap">
              📍 {t(lang, 'enable_location')}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {showMobileMenu && (
        <div className="bg-dark border-t border-white/10 sm:hidden animate-slide-in shadow-xl">
          <div className="px-3 py-2">
            <button onClick={requestLocation} className="w-full mb-2 flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-300 border border-green-600/30 rounded-lg text-sm">
              📍 {locationStatus === 'granted' ? location?.displayName : t(lang, 'enable_location')}
            </button>
            <button onClick={toggleLang} className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 text-white border border-white/20 rounded-lg text-sm mb-2">
              {lang === 'en' ? '🇮🇳 हिंदी में बदलें' : '🇬🇧 Switch to English'}
            </button>
          </div>
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setShowMobileMenu(false)} className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 border-b border-white/5">
              {t(lang, link.key)}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
