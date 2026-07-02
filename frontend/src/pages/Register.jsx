import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { showToast } from '../components/Toast.jsx'
import api from '../api/api.js'

export default function Register() {
  const { login } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [role, setRole] = useState('customer')
  const [gender, setGender] = useState('')
  const [genderBlocked, setGenderBlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', address: '',
    city: '', state: '', pincode: '',
    vehicleType: '', vehicleNumber: '', deliveryZone: ''
  })

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const ROLES = [
    { value: 'customer', icon: '🛍️', label: lang === 'hi' ? 'ग्राहक' : 'Customer', desc: lang === 'hi' ? 'उत्पाद खरीदें' : 'Buy products' },
    { value: 'seller', icon: '🏪', label: lang === 'hi' ? 'विक्रेता' : 'Seller', desc: lang === 'hi' ? 'केवल महिला' : 'Women only' },
    { value: 'delivery', icon: '🏍️', label: lang === 'hi' ? 'डिलीवरी' : 'Delivery Boy', desc: lang === 'hi' ? 'ऑर्डर डिलीवर करें' : 'Deliver orders' },
  ]

  const handleGenderChange = (g) => {
    setGender(g)
    setGenderBlocked(role === 'seller' && g !== 'female')
    setError(null)
  }

  const handleRoleChange = (r) => {
    setRole(r)
    setGender('')
    setGenderBlocked(false)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 6) { setError(lang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षर' : 'Password min 6 characters'); return }
    if (role === 'seller' && !gender) { setError(lang === 'hi' ? 'लिंग चुनें' : 'Please select gender'); return }
    if (genderBlocked) return
    setLoading(true)
    try {
      const payload = { ...form, role }
      if (role === 'seller') payload.gender = gender
      const res = await api.post('/auth/register', payload)
      login(res.data.token, res.data.user)
      showToast(lang === 'hi' ? '🌸 खाता बन गया! स्वागत है!' : '🌸 Account created! Welcome!', 'success')
      if (res.data.user.role === 'seller') navigate('/seller/dashboard')
      else if (res.data.user.role === 'delivery') navigate('/delivery/dashboard')
      else navigate('/customer/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setError(msg)
      if (err.response?.data?.code === 'WOMEN_ONLY') setGenderBlocked(true)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-primary/5">
      <Navbar />
      <div className="pt-32 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ROLES.map(r => (
              <button key={r.value} onClick={() => handleRoleChange(r.value)}
                className={`p-3 rounded-2xl text-center border-2 transition-all ${role === r.value ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <span className="text-2xl">{r.icon}</span>
                <div className="font-semibold text-xs mt-1 text-gray-800">{r.label}</div>
                <div className="text-xs text-muted">{r.desc}</div>
              </button>
            ))}
          </div>

          <div className="card p-6 shadow-xl">
            <h1 className="font-display text-2xl font-bold mb-1">{lang === 'hi' ? 'खाता बनाएं' : 'Create Account'}</h1>
            <p className="text-sm text-muted mb-5">Progressive Naari 🌸</p>

            {/* Seller gender */}
            {role === 'seller' && (
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-pink-700 mb-3">🌸 {lang === 'hi' ? 'केवल महिलाओं के लिए' : 'Women Entrepreneurs Only'}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'female', l: lang === 'hi' ? '👩 महिला' : '👩 Female' }, { v: 'male', l: lang === 'hi' ? '👨 पुरुष' : '👨 Male' }, { v: 'other', l: lang === 'hi' ? '🧑 अन्य' : '🧑 Other' }].map(g => (
                    <label key={g.v} className={`flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer text-xs font-semibold transition-all ${gender === g.v ? (g.v === 'female' ? 'border-primary bg-primary/5 text-primary' : 'border-red-400 bg-red-50 text-red-600') : 'border-gray-200'}`}>
                      <input type="radio" name="gender" value={g.v} checked={gender === g.v} onChange={() => handleGenderChange(g.v)} className="hidden" />
                      {g.l}
                    </label>
                  ))}
                </div>
                {gender === 'female' && <p className="text-green-600 text-xs mt-2 font-semibold">✅ {lang === 'hi' ? 'विक्रेता पंजीकरण उपलब्ध' : 'Seller registration available'}</p>}
              </div>
            )}

            {/* Delivery vehicle info */}
            {role === 'delivery' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-indigo-700 mb-3">🏍️ {lang === 'hi' ? 'वाहन जानकारी' : 'Vehicle Information'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'वाहन प्रकार' : 'Vehicle Type'}</label>
                    <select value={form.vehicleType} onChange={update('vehicleType')} className="input-field text-sm">
                      <option value="">{lang === 'hi' ? 'चुनें' : 'Select'}</option>
                      <option value="bike">🏍️ Bike</option>
                      <option value="scooter">🛵 Scooter</option>
                      <option value="cycle">🚴 Cycle</option>
                      <option value="van">🚐 Van</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'वाहन नंबर' : 'Vehicle Number'}</label>
                    <input value={form.vehicleNumber} onChange={update('vehicleNumber')} className="input-field text-sm" placeholder="UP32 AB 1234" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'डिलीवरी ज़ोन (शहर/पिनकोड)' : 'Delivery Zone (City/Pincode)'}</label>
                    <input value={form.deliveryZone} onChange={update('deliveryZone')} className="input-field text-sm" placeholder={lang === 'hi' ? 'जैसे: Lucknow या 226001' : 'e.g. Lucknow or 226001'} />
                  </div>
                </div>
              </div>
            )}

            {/* Blocked message */}
            {genderBlocked && (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-4 text-center">
                <div className="text-3xl mb-2">🚫</div>
                <p className="font-bold text-red-700">{lang === 'hi' ? 'विक्रेता पंजीकरण संभव नहीं' : 'Seller Registration Not Allowed'}</p>
                <p className="text-sm text-red-600 mt-1">{lang === 'hi' ? 'यह प्लेटफॉर्म केवल महिला उद्यमियों के लिए है।' : 'This platform is exclusively for women entrepreneurs.'}</p>
                <button onClick={() => handleRoleChange('customer')} className="mt-3 bg-dark text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  {lang === 'hi' ? 'ग्राहक के रूप में रजिस्टर करें' : 'Register as Customer'}
                </button>
              </div>
            )}

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}

            {!genderBlocked && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}</label>
                    <input value={form.name} onChange={update('name')} className="input-field" placeholder={lang === 'hi' ? 'आपका नाम' : 'Your name'} required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'ईमेल *' : 'Email *'}</label>
                    <input type="email" value={form.email} onChange={update('email')} className="input-field" placeholder="your@email.com" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'फोन' : 'Phone'}</label>
                    <input value={form.phone} onChange={update('phone')} className="input-field" placeholder="10-digit" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'शहर' : 'City'}</label>
                    <input value={form.city} onChange={update('city')} className="input-field" placeholder={lang === 'hi' ? 'आपका शहर' : 'Your city'} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'राज्य' : 'State'}</label>
                    <input value={form.state} onChange={update('state')} className="input-field" placeholder="UP, MH..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'पिनकोड' : 'Pincode'}</label>
                    <input value={form.pincode} onChange={update('pincode')} className="input-field" placeholder="226001" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'पासवर्ड * (कम से कम 6)' : 'Password * (min 6)'}</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={form.password} onChange={update('password')} className="input-field pr-10" placeholder="••••••••" required />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-secondary transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-md">
                  {loading ? '⏳...' : (lang === 'hi' ? '✅ खाता बनाएं' : '✅ Create Account')}
                </button>
              </form>
            )}

            <p className="text-center text-sm text-muted mt-4">
              {lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">{lang === 'hi' ? 'लॉगिन करें' : 'Login'}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
