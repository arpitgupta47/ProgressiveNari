import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { showToast } from '../components/Toast.jsx'
import api from '../api/api.js'

export default function Login() {
  const { login } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [role, setRole] = useState('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPass, setShowPass] = useState(false)

  const ROLES = [
    { value: 'customer', icon: '🛍️', label: lang === 'hi' ? 'ग्राहक' : 'Customer' },
    { value: 'seller', icon: '🏪', label: lang === 'hi' ? 'विक्रेता' : 'Seller' },
    { value: 'delivery', icon: '🏍️', label: lang === 'hi' ? 'डिलीवरी' : 'Delivery' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const userRole = res.data.user.role
      if (userRole !== role) {
        setError(lang === 'hi' ? `यह खाता "${userRole}" के रूप में रजिस्टर है।` : `This account is registered as "${userRole}". Select correct role.`)
        return
      }
      login(res.data.token, res.data.user)
      showToast(lang === 'hi' ? `स्वागत है, ${res.data.user.name}!` : `Welcome back, ${res.data.user.name}!`, 'success')
      if (userRole === 'seller') navigate('/seller/dashboard')
      else if (userRole === 'delivery') navigate('/delivery/dashboard')
      else navigate('/customer/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'hi' ? 'लॉगिन विफल' : 'Login failed'))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-primary/5">
      <Navbar />
      <div className="pt-32 pb-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ROLES.map(r => (
              <button key={r.value} onClick={() => { setRole(r.value); setError(null) }}
                className={`py-3 rounded-2xl font-semibold text-sm transition-all border-2 flex flex-col items-center gap-1
                  ${role === r.value ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <span className="text-xl">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          <div className="card p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">{ROLES.find(r => r.value === role)?.icon}</span>
              </div>
              <h1 className="font-display text-2xl font-bold">{lang === 'hi' ? 'लॉगिन करें' : 'Login'}</h1>
              <p className="text-sm text-muted mt-1">Progressive Naari 🌸</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'ईमेल' : 'Email'}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'पासवर्ड' : 'Password'}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-red-600 disabled:opacity-50 hover:scale-[1.02] transition-all shadow-md">
                {loading ? '⏳...' : `${lang === 'hi' ? 'लॉगिन करें' : 'Login'} →`}
              </button>
            </form>

            <p className="text-center text-sm text-muted mt-4">
              {lang === 'hi' ? 'नए हैं?' : 'New here?'}{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">{lang === 'hi' ? 'खाता बनाएं' : 'Create Account'}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
