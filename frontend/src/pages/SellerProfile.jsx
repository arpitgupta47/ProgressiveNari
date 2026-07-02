import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { showToast } from '../components/Toast.jsx'
import api from '../api/api.js'

export default function SellerProfile() {
  const { user } = useAuth()
  const { lang } = useLang()
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', state: '', pincode: '', bankAccount: '', ifscCode: '', upiId: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState({ lat: null, lng: null })

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/me')
      const u = res.data
      setForm({
        name: u.name || '', phone: u.phone || '', address: u.address || '',
        city: u.city || '', state: u.state || '', pincode: u.pincode || '',
        bankAccount: u.bankAccount || '', ifscCode: u.ifscCode || '', upiId: u.upiId || ''
      })
      if (u.latitude && u.longitude) setCoords({ lat: u.latitude, lng: u.longitude })
    } catch {}
    setLoading(false)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        const data = await res.json()
        const addr = data.address || {}
        setForm(p => ({
          ...p,
          city: addr.city || addr.town || addr.village || p.city,
          state: addr.state || p.state,
          pincode: addr.postcode || p.pincode
        }))
        setCoords({ lat: latitude, lng: longitude })
        showToast('📍 ' + (lang === 'hi' ? 'लोकेशन मिल गई!' : 'Location detected!'), 'success')
      } catch {
        setCoords({ lat: latitude, lng: longitude })
        showToast('Location captured', 'success')
      }
      setLocating(false)
    }, () => { showToast('Location access denied', 'error'); setLocating(false) }, { enableHighAccuracy: true })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/auth/profile', { ...form, latitude: coords.lat, longitude: coords.lng })
      showToast(lang === 'hi' ? '✅ प्रोफाइल अपडेट हुई!' : '✅ Profile updated!', 'success')
    } catch { showToast('Failed to update', 'error') }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-2xl mx-auto px-4">
        <div className="card p-6">
          <h1 className="font-display text-2xl font-bold mb-5">👩 {lang === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile'}</h1>

          {loading ? <div className="text-center py-8 text-muted">{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</div> : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Basic info */}
              <div>
                <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">👤 {lang === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Info'}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'पूरा नाम' : 'Full Name'}</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'फोन' : 'Phone'}</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field" placeholder="10-digit" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'पिनकोड' : 'Pincode'}</label>
                    <input value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} className="input-field" placeholder="226001" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'शहर' : 'City'} ⭐</label>
                    <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="input-field" placeholder="Lucknow" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'राज्य' : 'State'}</label>
                    <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className="input-field" placeholder="Uttar Pradesh" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h2 className="font-semibold text-green-800 mb-2 text-sm">📍 {lang === 'hi' ? 'लोकेशन (जरूरी — ताकि पास के ग्राहक आपको खोज सकें)' : 'Location (Required — so nearby customers find you)'}</h2>
                {coords.lat ? (
                  <div className="flex items-center justify-between">
                    <p className="text-green-700 text-sm font-semibold">✅ {lang === 'hi' ? 'लोकेशन सेट है' : 'Location is set'} ({coords.lat?.toFixed(4)}, {coords.lng?.toFixed(4)})</p>
                    <button type="button" onClick={detectLocation} className="text-xs text-green-700 underline">{lang === 'hi' ? 'अपडेट करें' : 'Update'}</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-green-700 mb-2">{lang === 'hi' ? 'लोकेशन सेट करें ताकि आपके पास के ग्राहक आपके उत्पाद देख सकें।' : 'Set your location so nearby customers can see your products.'}</p>
                    <button type="button" onClick={detectLocation} disabled={locating}
                      className="w-full py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                      {locating ? '⏳...' : `📍 ${lang === 'hi' ? 'मेरी लोकेशन पता करें' : 'Detect My Location'}`}
                    </button>
                  </div>
                )}
              </div>

              {/* Bank/UPI */}
              <div>
                <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">💰 {lang === 'hi' ? 'भुगतान विवरण (पेआउट के लिए)' : 'Payment Details (for payouts)'}</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">UPI ID ⭐ {lang === 'hi' ? '(जल्दी पेमेंट)' : '(Fastest payout)'}</label>
                    <input value={form.upiId} onChange={e => setForm(p => ({ ...p, upiId: e.target.value }))} className="input-field" placeholder="yourname@upi" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'बैंक खाता' : 'Bank Account'}</label>
                      <input value={form.bankAccount} onChange={e => setForm(p => ({ ...p, bankAccount: e.target.value }))} className="input-field" placeholder="Account number" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">IFSC Code</label>
                      <input value={form.ifscCode} onChange={e => setForm(p => ({ ...p, ifscCode: e.target.value }))} className="input-field" placeholder="SBIN0001234" />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-all disabled:opacity-50">
                {saving ? '⏳...' : `💾 ${lang === 'hi' ? 'सेव करें' : 'Save Profile'}`}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
