import { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import { useLang } from '../context/LangContext.jsx'
import { t } from '../utils/translations.js'
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

const COURSES = [
  {
    icon: '🍳', title: 'Culinary Arts', hi: 'पाक कला', color: 'from-orange-400 to-red-400', bg: 'bg-orange-50', border: 'border-orange-200',
    topics: ['Homemade Pizza Mastery', 'Authentic Momos Preparation', 'Traditional Halwa Varieties', 'Soup Making Techniques', 'Gourmet Sandwiches', 'Fusion Dhokla Recipes', 'Cake Baking Basics to Advanced'],
    hi_topics: ['होममेड पिज्जा', 'मोमोज बनाना', 'हलवा की किस्में', 'सूप बनाना', 'सैंडविच', 'ढोकला रेसिपी', 'केक बेकिंग'],
    duration: '4-8 weeks', fees: '₹499 - ₹1,499', level: 'Beginner to Advanced'
  },
  {
    icon: '💃', title: 'Dance & Performance', hi: 'नृत्य कला', color: 'from-pink-400 to-purple-400', bg: 'bg-pink-50', border: 'border-pink-200',
    topics: ['Wedding Dance Choreography', 'Stage Performance Prep', 'Hip Hop Dance Styles', 'Classical Kathakali', 'Bollywood Dance', 'Contemporary Fusion', "Kids' Dance Classes"],
    hi_topics: ['शादी डांस', 'स्टेज परफॉर्मेंस', 'हिप हॉप', 'कत्थकली', 'बॉलीवुड डांस', 'समकालीन फ्यूजन', 'बच्चों की क्लास'],
    duration: '6-12 weeks', fees: '₹799 - ₹2,499', level: 'All Levels'
  },
  {
    icon: '🧘', title: 'Yoga & Wellness', hi: 'योग और स्वास्थ्य', color: 'from-green-400 to-teal-400', bg: 'bg-green-50', border: 'border-green-200',
    topics: ['Senior Citizen Yoga Programs', 'Weight Loss Yoga Plans', 'Height Increase Exercises', "Women's Health Yoga", 'Prenatal Yoga', 'Stress Relief Sessions', 'Meditation & Mindfulness'],
    hi_topics: ['वरिष्ठ नागरिक योग', 'वजन घटाने का योग', 'ऊंचाई बढ़ाने के व्यायाम', 'महिला स्वास्थ्य योग', 'प्रसव पूर्व योग', 'तनाव मुक्ति', 'ध्यान'],
    duration: '4-16 weeks', fees: '₹399 - ₹1,999', level: 'Beginner Friendly'
  },
  {
    icon: '📖', title: 'Language & Communication', hi: 'भाषा और संचार', color: 'from-blue-400 to-cyan-400', bg: 'bg-blue-50', border: 'border-blue-200',
    topics: ['English Speaking Course', 'Hindi Matra Teaching', 'Public Speaking Skills', 'Business Communication', 'Creative Writing', 'Regional Languages'],
    hi_topics: ['अंग्रेजी बोलना', 'हिंदी मात्राएं', 'सार्वजनिक बोलना', 'व्यवसाय संचार', 'रचनात्मक लेखन', 'क्षेत्रीय भाषाएं'],
    duration: '8-16 weeks', fees: '₹599 - ₹2,999', level: 'Beginner to Advanced'
  },
  {
    icon: '✂️', title: 'Fashion & Design', hi: 'फैशन और डिजाइन', color: 'from-purple-400 to-pink-400', bg: 'bg-purple-50', border: 'border-purple-200',
    topics: ['Tailoring & Stitching', 'Fashion Design Basics', 'Embroidery & Handwork', 'Boutique Management', 'Jewelry Making', 'Accessory Design'],
    hi_topics: ['सिलाई', 'फैशन डिजाइन', 'कढ़ाई', 'बुटीक प्रबंधन', 'गहने बनाना', 'एक्सेसरी डिजाइन'],
    duration: '8-20 weeks', fees: '₹999 - ₹3,999', level: 'All Levels'
  },
  {
    icon: '💻', title: 'Digital Skills', hi: 'डिजिटल कौशल', color: 'from-gray-500 to-blue-500', bg: 'bg-gray-50', border: 'border-gray-200',
    topics: ['Social Media Marketing', 'Basic Computer Skills', 'Online Business Setup', 'Product Photography', 'E-commerce Basics', 'Digital Payment Systems'],
    hi_topics: ['सोशल मीडिया मार्केटिंग', 'बेसिक कंप्यूटर', 'ऑनलाइन बिजनेस', 'प्रोडक्ट फोटोग्राफी', 'ई-कॉमर्स', 'डिजिटल पेमेंट'],
    duration: '4-12 weeks', fees: '₹499 - ₹2,499', level: 'Beginner Friendly'
  }
]

const BENEFITS = [
  { iconKey: '📱', titleKey: 'learn_anywhere', descEn: 'Access courses on mobile, tablet, or computer at your convenience', descHi: 'मोबाइल, टैबलेट या कंप्यूटर पर कहीं भी सीखें' },
  { iconKey: '🏆', titleKey: 'certification', descEn: 'Receive recognized certificates upon course completion', descHi: 'कोर्स पूरा करने पर मान्यता प्राप्त सर्टिफिकेट पाएं' },
  { iconKey: '👩‍🏫', titleKey: 'expert_instructors', descEn: 'Learn from successful women entrepreneurs and professionals', descHi: 'सफल महिला उद्यमियों से सीखें' },
  { iconKey: '💼', titleKey: 'career_support', descEn: 'Get guidance to start your own business after completing courses', descHi: 'कोर्स के बाद अपना व्यवसाय शुरू करने में मार्गदर्शन' }
]

// Enrollment Modal
function EnrollModal({ course, lang, onClose }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '', state: '',
    mode: 'online', duration: '', batch: 'morning', experience: 'beginner',
    paymentMode: 'online', agreeTerms: false
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.city) {
      showToast(lang === 'hi' ? 'कृपया सभी जरूरी फ़ील्ड भरें' : 'Please fill all required fields', 'error')
      return
    }
    if (!form.agreeTerms) {
      showToast(lang === 'hi' ? 'कृपया नियम और शर्तें स्वीकार करें' : 'Please accept terms and conditions', 'error')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1500)
  }

  if (submitted) return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h3 className="font-display text-2xl font-bold text-dark">{lang === 'hi' ? 'दाखिला हो गया!' : 'Enrollment Successful!'}</h3>
        <p className="text-muted text-sm mt-2">{lang === 'hi' ? `${course.hi} में आपका दाखिला हो गया है! हम जल्द संपर्क करेंगे।` : `You've enrolled in ${course.title}! We'll contact you soon.`}</p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4 text-left text-sm">
          <p className="font-semibold text-green-700">{lang === 'hi' ? 'आपकी जानकारी:' : 'Your Details:'}</p>
          <p className="text-gray-600 mt-1">👤 {form.name}</p>
          <p className="text-gray-600">📱 {form.phone}</p>
          <p className="text-gray-600">📍 {form.city}, {form.state}</p>
          <p className="text-gray-600">📚 {form.mode === 'online' ? (lang === 'hi' ? 'ऑनलाइन' : 'Online') : (lang === 'hi' ? 'ऑफलाइन' : 'Offline')}</p>
        </div>
        <button onClick={onClose} className="mt-5 w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primaryDark transition-colors">
          {lang === 'hi' ? 'बंद करें' : 'Close'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${course.color} p-5 text-white rounded-t-2xl relative`}>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-lg transition-colors">×</button>
          <div className="text-3xl mb-1">{course.icon}</div>
          <h3 className="font-display text-xl font-bold">{lang === 'hi' ? course.hi : course.title}</h3>
          <div className="flex gap-3 mt-2 flex-wrap">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">⏱ {course.duration}</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">💰 {course.fees}</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">📊 {course.level}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <h4 className="font-semibold text-gray-800">{lang === 'hi' ? '📝 दाखिला फॉर्म' : '📝 Enrollment Form'}</h4>

          {/* Personal info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}</label>
              <input value={form.name} onChange={update('name')} className="input-field text-sm" placeholder={lang === 'hi' ? 'आपका नाम' : 'Your full name'} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'फोन नंबर *' : 'Phone Number *'}</label>
              <input value={form.phone} onChange={update('phone')} className="input-field text-sm" placeholder="10-digit number" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}</label>
            <input type="email" value={form.email} onChange={update('email')} className="input-field text-sm" placeholder="your@email.com" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'शहर *' : 'City *'}</label>
              <input value={form.city} onChange={update('city')} className="input-field text-sm" placeholder={lang === 'hi' ? 'आपका शहर' : 'Your city'} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'राज्य' : 'State'}</label>
              <input value={form.state} onChange={update('state')} className="input-field text-sm" placeholder={lang === 'hi' ? 'राज्य' : 'State'} />
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">{lang === 'hi' ? 'सीखने का तरीका *' : 'Learning Mode *'}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'online', label: lang === 'hi' ? '💻 ऑनलाइन' : '💻 Online', desc: lang === 'hi' ? 'घर से सीखें' : 'Learn from home' },
                { value: 'offline', label: lang === 'hi' ? '🏫 ऑफलाइन' : '🏫 Offline', desc: lang === 'hi' ? 'सेंटर पर आएं' : 'Visit center' }
              ].map(m => (
                <label key={m.value} className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${form.mode === m.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="mode" value={m.value} checked={form.mode === m.value} onChange={update('mode')} className="hidden" />
                  <span className="font-semibold text-sm">{m.label}</span>
                  <span className="text-xs text-muted">{m.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'अवधि *' : 'Preferred Duration *'}</label>
            <select value={form.duration} onChange={update('duration')} className="input-field text-sm" required>
              <option value="">{lang === 'hi' ? 'अवधि चुनें' : 'Select duration'}</option>
              <option value="4weeks">{lang === 'hi' ? '4 सप्ताह' : '4 Weeks'} — {lang === 'hi' ? 'बेसिक' : 'Basic'}</option>
              <option value="8weeks">{lang === 'hi' ? '8 सप्ताह' : '8 Weeks'} — {lang === 'hi' ? 'स्टैंडर्ड' : 'Standard'}</option>
              <option value="12weeks">{lang === 'hi' ? '12 सप्ताह' : '12 Weeks'} — {lang === 'hi' ? 'एडवांस' : 'Advanced'}</option>
              <option value="custom">{lang === 'hi' ? 'कस्टम (बाद में तय करें)' : 'Custom (Decide later)'}</option>
            </select>
          </div>

          {/* Batch timing */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'बैच टाइमिंग' : 'Batch Timing'}</label>
            <select value={form.batch} onChange={update('batch')} className="input-field text-sm">
              <option value="morning">{lang === 'hi' ? '🌅 सुबह (6am-10am)' : '🌅 Morning (6am-10am)'}</option>
              <option value="afternoon">{lang === 'hi' ? '☀️ दोपहर (11am-2pm)' : '☀️ Afternoon (11am-2pm)'}</option>
              <option value="evening">{lang === 'hi' ? '🌆 शाम (4pm-8pm)' : '🌆 Evening (4pm-8pm)'}</option>
              <option value="flexible">{lang === 'hi' ? '🕐 लचीला समय' : '🕐 Flexible Timing'}</option>
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'अनुभव स्तर' : 'Experience Level'}</label>
            <select value={form.experience} onChange={update('experience')} className="input-field text-sm">
              <option value="beginner">{lang === 'hi' ? '🌱 बिल्कुल नया' : '🌱 Complete Beginner'}</option>
              <option value="some">{lang === 'hi' ? '📚 थोड़ा अनुभव' : '📚 Some Experience'}</option>
              <option value="intermediate">{lang === 'hi' ? '⚡ मध्यम' : '⚡ Intermediate'}</option>
              <option value="advanced">{lang === 'hi' ? '🏆 एडवांस' : '🏆 Advanced'}</option>
            </select>
          </div>

          {/* Payment mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{lang === 'hi' ? 'भुगतान का तरीका' : 'Payment Mode'}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'online', label: lang === 'hi' ? '💳 ऑनलाइन' : '💳 Online' },
                { value: 'cash', label: lang === 'hi' ? '💵 नकद' : '💵 Cash' },
                { value: 'emi', label: lang === 'hi' ? '📅 EMI' : '📅 EMI' }
              ].map(p => (
                <label key={p.value} className={`flex items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer text-sm font-semibold transition-all ${form.paymentMode === p.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="paymentMode" value={p.value} checked={form.paymentMode === p.value} onChange={update('paymentMode')} className="hidden" />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {/* Course fee info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm">
            <p className="font-semibold text-yellow-800">💰 {lang === 'hi' ? 'कोर्स फीस:' : 'Course Fee:'} {course.fees}</p>
            <p className="text-yellow-700 text-xs mt-1">{lang === 'hi' ? 'फीस अवधि के अनुसार अलग होगी। दाखिले के बाद पूरी जानकारी मिलेगी।' : 'Fee varies by duration. Full details will be shared after enrollment.'}</p>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={form.agreeTerms} onChange={e => setForm(p => ({ ...p, agreeTerms: e.target.checked }))} className="mt-1" />
            <span className="text-xs text-gray-600">{lang === 'hi' ? 'मैं नियम और शर्तों से सहमत हूं और प्रोग्रेसिव नारी के कोर्स में दाखिला लेना चाहती हूं।' : 'I agree to the terms & conditions and want to enroll in Progressive Naari courses.'}</span>
          </label>

          <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-md">
            {loading ? (lang === 'hi' ? '⏳ हो रहा है...' : '⏳ Processing...') : (lang === 'hi' ? '✅ दाखिला लें' : '✅ Confirm Enrollment')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Courses() {
  const { lang } = useLang()
  const [selectedCourse, setSelectedCourse] = useState(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {selectedCourse && <EnrollModal course={selectedCourse} lang={lang} onClose={() => setSelectedCourse(null)} />}

      <main className="pt-28 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-primary text-white py-16 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0">
            {['📖','💻','🍳','💃','🧘','✂️'].map((e, i) => (
              <div key={i} className="absolute text-5xl opacity-10 animate-float" style={{ left: `${(i+1)*14}%`, top: `${20 + (i%3)*25}%`, animationDelay: `${i*0.5}s` }}>{e}</div>
            ))}
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="text-5xl mb-4">🎓</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold">{t(lang, 'courses_title')}</h1>
            <p className="mt-3 text-xl text-white/80">{t(lang, 'courses_subtitle')}</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
          {/* Courses grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES.map((course, i) => (
              <AnimSection key={course.title} delay={i * 80}>
                <div className={`card border ${course.border} hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col`}>
                  <div className={`bg-gradient-to-r ${course.color} p-5 text-white`}>
                    <div className="text-4xl mb-2">{course.icon}</div>
                    <h3 className="font-display text-xl font-bold">{lang === 'hi' ? course.hi : course.title}</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">⏱ {course.duration}</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">💰 {course.fees}</span>
                    </div>
                  </div>
                  <div className={`p-5 ${course.bg} flex-1 flex flex-col`}>
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {(lang === 'hi' ? course.hi_topics : course.topics).map((topic, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-primary text-xs">●</span>{topic}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r ${course.color} hover:opacity-90 transition-all hover:scale-[1.02] active:scale-95 shadow-md`}
                    >
                      {t(lang, 'enroll_now')}
                    </button>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>

          {/* Benefits */}
          <AnimSection>
            <h2 className="font-display text-3xl font-bold text-center mb-8">🎓 {lang === 'hi' ? 'कोर्स के फायदे' : 'Course Benefits'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {BENEFITS.map(b => (
                <div key={b.titleKey} className="card p-5 text-center hover:shadow-lg transition-all hover:-translate-y-1 group">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{b.iconKey}</div>
                  <h3 className="font-semibold text-gray-800 text-sm">{t(lang, b.titleKey)}</h3>
                  <p className="text-xs text-muted mt-1">{lang === 'hi' ? b.descHi : b.descEn}</p>
                </div>
              ))}
            </div>
          </AnimSection>

          {/* CTA */}
          <AnimSection>
            <div className="card p-10 text-center bg-gradient-to-r from-purple-600 to-pink-500 text-white">
              <h2 className="font-display text-3xl font-bold">{lang === 'hi' ? 'आज ही सीखना शुरू करें! 📚' : 'Start Learning Today! 📚'}</h2>
              <p className="mt-2 text-white/80">{lang === 'hi' ? '50,000+ महिलाएं पहले से सीख रही हैं' : 'Join 50,000+ women already learning on Progressive Naari'}</p>
              <a href="/register" className="mt-6 inline-block bg-white text-purple-600 font-bold px-8 py-3 rounded-full hover:scale-105 transition-all shadow-lg">
                {lang === 'hi' ? 'रजिस्टर करें और सीखें' : 'Register & Start Learning'}
              </a>
            </div>
          </AnimSection>
        </div>
      </main>
    </div>
  )
}
