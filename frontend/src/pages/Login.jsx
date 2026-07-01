import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { t } from '../utils/translations.js'
import api from '../api/api.js'
import { showToast } from '../components/Toast.jsx'

export default function Login() {
  const { login } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [role, setRole] = useState('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPass, setShowPass] = useState(false)

  // Load Google Sign-In script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [])

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true)
    setError(null)
    try {
      const res = await api.post('/auth/google', { credential: response.credential, role })
      login(res.data.token, res.data.user)
      showToast(`Welcome, ${res.data.user.name}! 🎉`, 'success')
      navigate(res.data.user.role === 'seller' ? '/seller/dashboard' : '/customer/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Google login failed'
      const endpoint = err.config?.url ? `${err.config.baseURL || ''}${err.config.url}` : '/auth/google'
      console.error('Google login error:', endpoint, err.response?.status, err.response?.data)
      setError(`${msg}${err.response?.status === 404 ? ` (endpoint: ${endpoint})` : ''}`)
      if (err.response?.data?.code === 'WOMEN_ONLY') {
        setError(lang === 'hi'
          ? 'प्रोग्रेसिव नारी केवल महिला उद्यमियों के लिए है। कृपया ग्राहक के रूप में लॉगिन करें।'
          : 'Progressive Naari sellers are women only. Please login as Customer.')
      }
    } finally { setGoogleLoading(false) }
  }

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'your_google_client_id') {
      showToast('Google login not configured. Use email/password.', 'info')
      return
    }
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse
      })
      window.google.accounts.id.prompt()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const userRole = res.data.user.role
      if (userRole !== role) {
        setError(lang === 'hi'
          ? `यह खाता "${userRole}" के रूप में रजिस्टर है। सही भूमिका चुनें।`
          : `This account is registered as "${userRole}". Please select correct role.`)
        return
      }
      login(res.data.token, res.data.user)
      showToast(lang === 'hi' ? `स्वागत है, ${res.data.user.name}!` : `Welcome back, ${res.data.user.name}!`, 'success')
      navigate(userRole === 'seller' ? '/seller/dashboard' : userRole === 'delivery_person' ? '/delivery/dashboard' : '/customer/dashboard')
    } catch (err) {
      const message = err.response?.data?.message || (lang === 'hi' ? 'लॉगिन विफल' : 'Login failed')
      const endpoint = err.config?.url ? `${err.config.baseURL || ''}${err.config.url}` : '/auth/login'
      console.error('Login error:', endpoint, err.response?.status, err.response?.data)
      setError(`${message}${err.response?.status === 404 ? ` (endpoint: ${endpoint})` : ''}`)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-primary/5">
      <Navbar />
      <div className="pt-32 pb-12 px-4">
        <div className="max-w-md mx-auto">

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['seller', 'customer', 'delivery_person'].map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`py-3 rounded-2xl font-semibold text-sm transition-all border-2 flex items-center justify-center gap-2 shadow-sm
                  ${role === r
                    ? r === 'seller' ? 'bg-primary border-primary text-white shadow-primary/20 shadow-lg' : r === 'delivery_person' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-600/20 shadow-lg' : 'bg-dark border-dark text-white shadow-dark/20 shadow-lg'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <span className="text-lg">{r === 'seller' ? '🏪' : r === 'delivery_person' ? '🚚' : '🛍️'}</span>
                <span>{r === 'seller' ? 'Seller' : r === 'delivery_person' ? 'Delivery' : 'Customer'}</span>
              </button>
            ))}
          </div>

          <div className="card p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">{role === 'seller' ? '🏪' : '🛍️'}</span>
              </div>
              <h1 className="font-display text-2xl font-bold">{lang === 'hi' ? 'लॉगिन करें' : 'Login'}</h1>
              <p className="text-sm text-muted mt-1">
                {role === 'seller'
                  ? (lang === 'hi' ? 'अपना विक्रेता डैशबोर्ड एक्सेस करें' : 'Access your seller dashboard')
                  : (lang === 'hi' ? 'महिला उद्यमियों से खरीदें' : 'Shop from women entrepreneurs')}
              </p>
            </div>

            {/* Google Login */}
            <button onClick={handleGoogleClick} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold text-sm text-gray-700 mb-4 disabled:opacity-50">
              {googleLoading ? '⏳' : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.4 5.6-5 7.3v6h8.1c4.7-4.4 7.2-10.8 7.2-17.4z"/>
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-8.1-6c-2.1 1.4-4.8 2.2-7.7 2.2-5.9 0-10.9-4-12.7-9.3H2.9v6.2C6.8 42.5 14.9 48 24 48z"/>
                  <path fill="#FBBC05" d="M11.3 29.1c-.5-1.4-.7-2.9-.7-4.4s.2-3 .7-4.4v-6.2H2.9C1 17.8 0 20.8 0 24s1 6.2 2.9 9.3l8.4-4.2z"/>
                  <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.6 3.3l6.4-6.4C35.9 2.1 30.5 0 24 0 14.9 0 6.8 5.5 2.9 13.5l8.4 6.2c1.8-5.3 6.8-10.2 12.7-10.2z"/>
                </svg>
              )}
              {lang === 'hi' ? 'Google से लॉगिन करें' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-2 mb-4">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-muted">{lang === 'hi' ? 'या' : 'OR'}</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t(lang, 'email')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t(lang, 'password')}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-md
                  ${role === 'seller' ? 'bg-gradient-to-r from-primary to-red-600' : 'bg-gradient-to-r from-dark to-gray-700'}`}>
                {loading ? (lang === 'hi' ? '⏳ लॉगिन हो रहा है...' : '⏳ Logging in...') : (role === 'seller' ? (lang === 'hi' ? 'विक्रेता लॉगिन' : 'Seller Login') : (lang === 'hi' ? 'ग्राहक लॉगिन' : 'Customer Login'))}
              </button>
            </form>

            <p className="text-center text-sm text-muted mt-4">
              {t(lang, 'new_here')}{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">{t(lang, 'create_account_link')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
