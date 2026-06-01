import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { t } from '../utils/translations.js'
import api from '../api/api.js'
import { showToast } from '../components/Toast.jsx'

export default function Register() {
  const { login } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [role, setRole] = useState('customer')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', gender: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [genderBlocked, setGenderBlocked] = useState(false)

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  // Check gender block for seller
  useEffect(() => {
    if (role === 'seller' && form.gender && form.gender !== 'female') {
      setGenderBlocked(true)
    } else {
      setGenderBlocked(false)
    }
  }, [role, form.gender])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [])

  const handleGoogleResponse = async (response) => {
    if (role === 'seller' && form.gender !== 'female') {
      setError(lang === 'hi'
        ? 'विक्रेता पंजीकरण केवल महिलाओं के लिए है।'
        : 'Seller registration is for women only.')
      return
    }
    setGoogleLoading(true)
    try {
      const res = await api.post('/auth/google', { credential: response.credential, role, gender: form.gender })
      login(res.data.token, res.data.user)
      showToast('Welcome to Progressive Naari! 🌸', 'success')
      navigate(res.data.user.role === 'seller' ? '/seller/dashboard' : '/customer/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Google signup failed')
    } finally { setGoogleLoading(false) }
  }

  const handleGoogleClick = () => {
    if (role === 'seller' && form.gender !== 'female') {
      setError(lang === 'hi' ? 'Google से रजिस्टर करने से पहले "महिला" चुनें।' : 'Please select "Female" before Google signup.')
      return
    }
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'your_google_client_id') {
      showToast('Google login not configured. Use email/password.', 'info')
      return
    }
    if (window.google) {
      window.google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleResponse })
      window.google.accounts.id.prompt()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 6) { setError(lang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए' : 'Password must be at least 6 characters'); return }
    if (role === 'seller' && !form.gender) { setError(lang === 'hi' ? 'कृपया लिंग चुनें' : 'Please select gender'); return }
    if (genderBlocked) return
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { ...form, role })
      login(res.data.token, res.data.user)
      showToast(lang === 'hi' ? 'खाता बन गया! स्वागत है! 🌸' : 'Account created! Welcome! 🌸', 'success')
      navigate(role === 'seller' ? '/seller/dashboard' : '/customer/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setError(msg)
      if (err.response?.data?.code === 'WOMEN_ONLY') {
        setGenderBlocked(true)
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-primary/5">
      <Navbar />
      <div className="pt-32 pb-12 px-4">
        <div className="max-w-lg mx-auto">

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { value: 'customer', label: lang === 'hi' ? 'ग्राहक बनें' : 'Join as Customer', icon: '🛍️', desc: lang === 'hi' ? 'उत्पाद खरीदें' : 'Buy products' },
              { value: 'seller', label: lang === 'hi' ? 'विक्रेता बनें' : 'Join as Seller', icon: '🏪', desc: lang === 'hi' ? 'उत्पाद बेचें (केवल महिला)' : 'Sell products (Women only)' }
            ].map(r => (
              <button key={r.value} onClick={() => { setRole(r.value); setError(null) }}
                className={`p-3 rounded-2xl text-left border-2 transition-all shadow-sm
                  ${role === r.value ? 'border-primary bg-primary/5 shadow-primary/10 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <span className="text-2xl">{r.icon}</span>
                <div className="font-semibold text-sm mt-1 text-gray-800">{r.label}</div>
                <div className="text-xs text-muted">{r.desc}</div>
              </button>
            ))}
          </div>

          <div className="card p-6 shadow-xl">
            <div className="mb-5 text-center">
              <h1 className="font-display text-2xl font-bold">{lang === 'hi' ? 'खाता बनाएं' : 'Create Account'}</h1>
              <p className="text-sm text-muted mt-1">{lang === 'hi' ? 'प्रोग्रेसिव नारी में शामिल हों' : 'Join Progressive Naari'}</p>
            </div>

            {/* Women-only seller note */}
            {role === 'seller' && (
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 mb-4 text-sm">
                <p className="font-semibold text-pink-700">🌸 {lang === 'hi' ? 'केवल महिलाओं के लिए' : 'Women Entrepreneurs Only'}</p>
                <p className="text-pink-600 text-xs mt-1">{lang === 'hi' ? 'प्रोग्रेसिव नारी केवल महिला उद्यमियों के लिए है। पुरुष केवल ग्राहक के रूप में रजिस्टर कर सकते हैं।' : 'Progressive Naari is exclusively for women entrepreneurs. Men can register as customers only.'}</p>
              </div>
            )}

            {/* Gender blocked message */}
            {genderBlocked && (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-4 text-center">
                <div className="text-3xl mb-2">🚫</div>
                <p className="font-bold text-red-700">{lang === 'hi' ? 'विक्रेता पंजीकरण संभव नहीं' : 'Seller Registration Not Allowed'}</p>
                <p className="text-sm text-red-600 mt-1">{lang === 'hi' ? 'यह प्लेटफॉर्म केवल महिला उद्यमियों के लिए है। आप ग्राहक के रूप में रजिस्टर कर सकते हैं।' : 'This platform is exclusively for women entrepreneurs. You can register as a Customer.'}</p>
                <button onClick={() => { setRole('customer'); setForm(p => ({ ...p, gender: '' })); setGenderBlocked(false); setError(null) }}
                  className="mt-3 bg-dark text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
                  {lang === 'hi' ? 'ग्राहक के रूप में रजिस्टर करें' : 'Register as Customer Instead'}
                </button>
              </div>
            )}

            {!genderBlocked && (
              <>
                {/* Google signup */}
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
                  {lang === 'hi' ? 'Google से जुड़ें' : 'Continue with Google'}
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <hr className="flex-1 border-gray-200" />
                  <span className="text-xs text-muted">{lang === 'hi' ? 'या' : 'OR'}</span>
                  <hr className="flex-1 border-gray-200" />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Gender selection for sellers */}
                  {role === 'seller' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'hi' ? 'लिंग *' : 'Gender *'}
                        <span className="text-xs text-muted ml-1">({lang === 'hi' ? 'केवल महिलाएं विक्रेता बन सकती हैं' : 'Only women can register as sellers'})</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'female', label: lang === 'hi' ? '👩 महिला' : '👩 Female' },
                          { value: 'male', label: lang === 'hi' ? '👨 पुरुष' : '👨 Male' },
                          { value: 'other', label: lang === 'hi' ? '🧑 अन्य' : '🧑 Other' }
                        ].map(g => (
                          <label key={g.value}
                            className={`flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer text-sm font-semibold transition-all
                              ${form.gender === g.value
                                ? g.value === 'female' ? 'border-primary bg-primary/5 text-primary' : 'border-red-400 bg-red-50 text-red-600'
                                : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="radio" name="gender" value={g.value} checked={form.gender === g.value} onChange={update('gender')} className="hidden" />
                            {g.label}
                          </label>
                        ))}
                      </div>
                      {form.gender === 'female' && <p className="text-green-600 text-xs mt-1">✅ {lang === 'hi' ? 'विक्रेता पंजीकरण उपलब्ध है' : 'Seller registration available'}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t(lang, 'full_name')} *</label>
                      <input value={form.name} onChange={update('name')} className="input-field" placeholder={lang === 'hi' ? 'आपका पूरा नाम' : 'Your full name'} required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t(lang, 'email')} *</label>
                      <input type="email" value={form.email} onChange={update('email')} className="input-field" placeholder="your@email.com" required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t(lang, 'password')} * ({lang === 'hi' ? 'कम से कम 6 अक्षर' : 'min 6 chars'})</label>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={form.password} onChange={update('password')} className="input-field pr-10" placeholder="••••••••" required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? '🙈' : '👁️'}</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t(lang, 'phone')}</label>
                      <input value={form.phone} onChange={update('phone')} className="input-field" placeholder="10-digit" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t(lang, 'address')}</label>
                      <input value={form.address} onChange={update('address')} className="input-field" placeholder={lang === 'hi' ? 'शहर, राज्य' : 'City, State'} />
                    </div>
                  </div>

                  <button type="submit" disabled={loading || genderBlocked}
                    className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-secondary transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-md">
                    {loading ? (lang === 'hi' ? '⏳ बन रहा है...' : '⏳ Creating...') : (lang === 'hi' ? '✅ खाता बनाएं' : '✅ Create Account')}
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-sm text-muted mt-4">
              {t(lang, 'already_account')}{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">{t(lang, 'login_here')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}; 