import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import { useLang } from '../context/LangContext.jsx'
import { showToast } from '../components/Toast.jsx'

export default function Support() {
  const { lang } = useLang()
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: 'general', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      showToast(lang === 'hi' ? 'संदेश भेज दिया गया! हम जल्द संपर्क करेंगे।' : 'Message sent! We\'ll contact you soon.', 'success')
    }, 1200)
  }

  const FAQS = [
    { q: lang === 'hi' ? 'मैं विक्रेता कैसे बनूं?' : 'How do I become a seller?', a: lang === 'hi' ? 'Register पेज पर जाएं, "विक्रेता बनें" चुनें, अपना लिंग "महिला" चुनें, और फॉर्म भरें। केवल महिलाएं विक्रेता बन सकती हैं।' : 'Go to Register page, select "Join as Seller", choose gender as "Female", and fill the form. Only women can register as sellers.' },
    { q: lang === 'hi' ? 'प्लेटफॉर्म शुल्क क्या है?' : 'What is the platform fee?', a: lang === 'hi' ? 'हर ऑर्डर पर ₹10 प्लेटफॉर्म शुल्क है। यह ग्राहक की कुल भुगतान राशि में शामिल है। विक्रेता को बाकी राशि मिलती है।' : 'A flat ₹10 platform fee is charged per order, included in the customer\'s total. The seller receives the rest.' },
    { q: lang === 'hi' ? 'मुझे पैसे कब मिलेंगे?' : 'When will I receive my payment?', a: lang === 'hi' ? 'ऑर्डर डिलीवर होने के 24-48 घंटे के भीतर आपके UPI/बैंक में पैसे आएंगे।' : 'Payments are processed to your UPI/bank account within 24-48 hours of order delivery.' },
    { q: lang === 'hi' ? 'डिलीवरी के कितने विकल्प हैं?' : 'How many delivery options are available?', a: lang === 'hi' ? '3 विकल्प: सेल्फ पिकअप (मुफ्त), सेलर डिलीवरी (₹50), कंपनी डिलीवरी (₹200)।' : '3 options: Self Pickup (Free), Seller Delivery (₹50), Company Delivery (₹200).' },
    { q: lang === 'hi' ? 'Google से लॉगिन कैसे करें?' : 'How to login with Google?', a: lang === 'hi' ? 'Login/Register पेज पर "Google से लॉगिन" बटन क्लिक करें। विक्रेता के लिए पहले "महिला" लिंग चुनें।' : 'Click "Continue with Google" on the Login/Register page. For sellers, select "Female" gender first.' },
    { q: lang === 'hi' ? 'ऑर्डर रद्द कैसे करें?' : 'How to cancel an order?', a: lang === 'hi' ? 'ऑर्डर देने के 1 घंटे के भीतर support@progressivenaari.com पर संपर्क करें।' : 'Contact support@progressivenaari.com within 1 hour of placing the order.' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-16 max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold">{lang === 'hi' ? '🤝 सहायता केंद्र' : '🤝 Support Center'}</h1>
          <p className="text-muted mt-2">{lang === 'hi' ? 'हम आपकी मदद के लिए यहाँ हैं' : 'We\'re here to help you'}</p>
        </div>

        {/* Quick contacts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '📧', title: 'Email', value: 'guptaarpit.tech@gmail.com', action: 'mailto:guptaarpit.tech@gmail.com', label: lang === 'hi' ? 'ईमेल करें' : 'Send Email' },
            { icon: '📱', title: lang === 'hi' ? 'Customer Care' : 'Customer Care', value: '+91 1234567899', action: 'https://wa.me/1234567899', label: 'WhatsApp' },
            { icon: '⏰', title: lang === 'hi' ? 'समय' : 'Hours', value: lang === 'hi' ? 'सोम-शनि 9am-6pm' : 'Mon-Sat 9am-6pm', action: null, label: '' }
          ].map(c => (
            <div key={c.title} className="card p-5 text-center hover:shadow-md transition-all">
              <div className="text-3xl mb-2">{c.icon}</div>
              <h3 className="font-semibold text-gray-700 text-sm">{c.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{c.value}</p>
              {c.action && <a href={c.action} className="mt-2 inline-block text-xs text-primary font-semibold hover:underline">{c.label}</a>}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* FAQ */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold mb-4">{lang === 'hi' ? '❓ आम सवाल' : '❓ Frequently Asked Questions'}</h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between cursor-pointer py-2 font-semibold text-sm text-gray-800 hover:text-primary transition-colors list-none">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-gray-600 mt-2 pl-2 border-l-2 border-primary/30">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold mb-4">{lang === 'hi' ? '✉️ संदेश भेजें' : '✉️ Send Message'}</h2>
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="font-bold text-gray-800">{lang === 'hi' ? 'संदेश मिल गया!' : 'Message Received!'}</h3>
                <p className="text-muted text-sm mt-2">{lang === 'hi' ? 'हम 24 घंटे में जवाब देंगे।' : "We'll reply within 24 hours."}</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', category: 'general', message: '' }) }} className="mt-4 text-primary text-sm font-semibold hover:underline">
                  {lang === 'hi' ? 'नया संदेश भेजें' : 'Send another message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'नाम *' : 'Name *'}</label>
                    <input value={form.name} onChange={update('name')} className="input-field text-sm" placeholder={lang === 'hi' ? 'आपका नाम' : 'Your name'} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'फोन *' : 'Phone *'}</label>
                    <input value={form.phone} onChange={update('phone')} className="input-field text-sm" placeholder="10-digit" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'ईमेल' : 'Email'}</label>
                  <input type="email" value={form.email} onChange={update('email')} className="input-field text-sm" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'विषय' : 'Category'}</label>
                  <select value={form.category} onChange={update('category')} className="input-field text-sm">
                    <option value="general">{lang === 'hi' ? 'सामान्य' : 'General'}</option>
                    <option value="order">{lang === 'hi' ? 'ऑर्डर समस्या' : 'Order Issue'}</option>
                    <option value="payment">{lang === 'hi' ? 'भुगतान' : 'Payment'}</option>
                    <option value="seller">{lang === 'hi' ? 'विक्रेता सहायता' : 'Seller Support'}</option>
                    <option value="technical">{lang === 'hi' ? 'तकनीकी समस्या' : 'Technical Issue'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'संदेश *' : 'Message *'}</label>
                  <textarea value={form.message} onChange={update('message')} rows={4} className="input-field text-sm resize-none" placeholder={lang === 'hi' ? 'अपनी समस्या विस्तार से बताएं...' : 'Describe your issue in detail...'} required />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-all disabled:opacity-50">
                  {loading ? '⏳...' : (lang === 'hi' ? '📤 संदेश भेजें' : '📤 Send Message')}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
