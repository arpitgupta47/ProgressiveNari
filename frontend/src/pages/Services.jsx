import { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import { showToast } from '../components/Toast.jsx'

function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}
function AnimSection({ children, delay = 0 }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {children}
    </div>
  )
}

const SERVICES = [
  {
    icon: '💍', title: 'Mehandi Artists', color: 'from-red-500 to-pink-400', bg: 'bg-red-50', border: 'border-red-200',
    services: ['Wedding Mehandi Packages', 'Haldi Ceremony Mehandi', 'Festival Special Designs', 'Designer Arabic Mehandi', 'Traditional Rajasthani Style', 'Modern Fusion Patterns']
  },
  {
    icon: '🎉', title: 'Event Decoration', color: 'from-yellow-400 to-orange-400', bg: 'bg-yellow-50', border: 'border-yellow-200',
    services: ['Birthday Party Decoration', 'Anniversary Celebrations', 'Ghadi & Pooja Decoration', 'Baby Shower Themes', 'Festival Decorations', 'Custom Theme Setup']
  },
  {
    icon: '💄', title: 'Beauty Services', color: 'from-pink-500 to-purple-400', bg: 'bg-pink-50', border: 'border-pink-200',
    services: ['Bridal Makeup Packages', 'Party Makeup', 'Hair Styling & Treatments', 'Threading & Waxing', 'Facial & Cleanup', 'At-Home Beauty Sessions']
  },
  {
    icon: '🧹', title: 'Household Services', color: 'from-teal-500 to-green-400', bg: 'bg-teal-50', border: 'border-teal-200',
    services: ['Daily House Cleaning', 'Kitchen Deep Cleaning', 'Utensil Washing Service', 'Festival Cleaning', 'Wedding Event Staff', 'Laundry Services']
  },
  {
    icon: '📚', title: 'Home Tuition', color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50', border: 'border-blue-200',
    services: ['1-8 Days Quick Courses', 'Regular Classes (3-12 days)', 'Subject-Specific Tutoring', 'Language Learning', 'Exam Preparation', 'Hobby Classes']
  }
]

const WHY = [
  { icon: '🔍', title: 'Verified Professionals', desc: 'All service providers are background-verified and skill-tested' },
  { icon: '💯', title: 'Satisfaction Guarantee', desc: "100% money-back guarantee if you're not satisfied" },
  { icon: '⏰', title: 'Flexible Timing', desc: 'Book services at your convenient date and time' },
  { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges. What you see is what you pay' }
]

function BookingModal({ service, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', phone: '', location: '', date: '', time: '', notes: '', paymentMode: 'cash' })
  const [submitted, setSubmitted] = useState(false)

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.location.trim() || !form.date) {
      showToast('Please fill all required fields', 'error')
      return
    }
    setSubmitted(true)
    onSubmit(service.title, form)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-2xl leading-none">×</button>
          <div className="text-3xl mb-2">{service.icon}</div>
          <h2 className="font-display text-2xl font-bold">Book {service.title}</h2>
          <p className="text-sm text-white/80 mt-1">Please complete the booking form to request this service.</p>
        </div>

        {submitted ? (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold">Booking Request Sent!</h3>
            <p className="text-muted mt-2">We have received your request for {service.title}. Our team will contact you soon.</p>
            <button onClick={onClose} className="mt-6 px-6 py-3 bg-primary text-white rounded-full font-semibold">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-gray-700">Name *</label>
              <input type="text" value={form.name} onChange={update('name')} className="input-field" placeholder="Your full name" required />
              <label className="block text-sm font-semibold text-gray-700">Phone *</label>
              <input type="tel" value={form.phone} onChange={update('phone')} className="input-field" placeholder="Mobile number" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Location *</label>
                <input type="text" value={form.location} onChange={update('location')} className="input-field" placeholder="City, area" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Preferred Date *</label>
                <input type="date" value={form.date} onChange={update('date')} className="input-field" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Preferred Time</label>
                <input type="time" value={form.time} onChange={update('time')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Payment Mode</label>
                <select value={form.paymentMode} onChange={update('paymentMode')} className="input-field">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Notes</label>
              <textarea value={form.notes} onChange={update('notes')} rows={3} className="input-field resize-none" placeholder="Any special instructions?" />
            </div>

            <button type="submit" className="w-full py-3 bg-primary text-white rounded-full font-semibold hover:bg-primaryDark transition-colors">Request Booking</button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Services() {
  const [selectedService, setSelectedService] = useState(null)
  const [recentBooking, setRecentBooking] = useState(null)

  const handleBookingSubmit = (title) => {
    setRecentBooking(title)
    setTimeout(() => setRecentBooking(null), 4500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-teal-600 via-green-500 to-emerald-600 text-white py-16 px-4 text-center relative overflow-hidden">
          <div className="relative max-w-3xl mx-auto">
            <div className="text-5xl mb-4">✨</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold">Professional Services at Your Doorstep</h1>
            <p className="mt-3 text-xl text-white/80">Book skilled professionals for various occasions and daily needs</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
          {recentBooking && (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-900 shadow-sm">
              <p className="font-semibold">Your booking request for <span className="font-bold">{recentBooking}</span> has been sent. We will contact you shortly.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc, i) => (
              <AnimSection key={svc.title} delay={i * 80}>
                <div className={`card border ${svc.border} hover:shadow-xl transition-all hover:-translate-y-1 h-full`}>
                  <div className={`bg-gradient-to-r ${svc.color} p-5 text-white`}>
                    <div className="text-4xl mb-2">{svc.icon}</div>
                    <h3 className="font-display text-xl font-bold">{svc.title}</h3>
                  </div>
                  <div className={`p-5 ${svc.bg}`}>
                    <ul className="space-y-1.5 mb-4">
                      {svc.services.map(s => (
                        <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-primary text-xs">●</span>{s}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setSelectedService(svc)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r ${svc.color} hover:opacity-90 transition-all hover:scale-[1.02] active:scale-95 shadow-md`}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>

          <AnimSection>
            <h2 className="font-display text-3xl font-bold text-center mb-8">✨ Why Book Through Us?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {WHY.map(w => (
                <div key={w.title} className="card p-5 text-center hover:shadow-lg transition-all hover:-translate-y-1 group">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{w.icon}</div>
                  <h3 className="font-semibold text-gray-800 text-sm">{w.title}</h3>
                  <p className="text-xs text-muted mt-1">{w.desc}</p>
                </div>
              ))}
            </div>
          </AnimSection>

          <AnimSection>
            <div className="card p-10 text-center bg-gradient-to-r from-teal-600 to-green-500 text-white">
              <h2 className="font-display text-3xl font-bold">Book a Service Today! ✨</h2>
              <p className="mt-2 text-white/80">Trusted by 10,000+ satisfied customers across India</p>
              <a href="/register" className="mt-6 inline-block bg-white text-teal-600 font-bold px-8 py-3 rounded-full hover:scale-105 transition-all shadow-lg">
                Register as Service Provider
              </a>
            </div>
          </AnimSection>
        </div>
      </main>

      {selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onSubmit={handleBookingSubmit}
        />
      )}
    </div>
  )
}
