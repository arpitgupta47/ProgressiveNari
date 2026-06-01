import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar.jsx'

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

const STEPS = [
  { step: '01', title: 'Register', icon: '📝', desc: 'Sign up using your Aadhar, bank details, email, or phone number. Complete your profile with your skills and offerings.' },
  { step: '02', title: 'List Products/Services', icon: '🛍️', desc: 'Add your products or services with photos, descriptions, and pricing. Set your availability.' },
  { step: '03', title: 'Receive Orders', icon: '🔔', desc: 'Get notified when customers place orders. Accept or decline based on your capacity.' },
  { step: '04', title: 'Deliver & Earn', icon: '💰', desc: 'Fulfill orders, receive payments directly to your bank account, and grow your business!' }
]

const WHY = [
  { icon: '🏡', title: 'Work From Home', desc: 'Balance family and career. Set your own schedule and work at your pace' },
  { icon: '💪', title: 'Skill Utilization', desc: 'Put your talents to work. Turn your hobbies into profitable businesses' },
  { icon: '🤝', title: 'Community Support', desc: 'Join a network of like-minded women entrepreneurs across India' },
  { icon: '📚', title: 'Continuous Learning', desc: 'Access free courses, webinars, and skill development programs' }
]

export default function About() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setCount(c => c < 16 ? c + 1 : 16), 100)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary via-red-600 to-secondary text-white py-16 px-4 text-center">
          <AnimSection>
            <div className="max-w-4xl mx-auto">
              <div className="text-5xl mb-4">🌸</div>
              <h1 className="font-display text-4xl md:text-5xl font-bold">About Progressive Women of India</h1>
              <p className="mt-3 text-xl text-white/80">Empowering India's <span className="font-bold text-yellow-300">{count} crore</span> housewives to become successful entrepreneurs</p>
            </div>
          </AnimSection>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">

          {/* Mission */}
          <AnimSection>
            <div className="card p-8 border-l-4 border-primary">
              <h2 className="font-display text-2xl font-bold mb-4">🎯 Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">In India, approximately <strong className="text-primary">16 crore housewives</strong> between the ages of 20-30 possess incredible talent and skills but lack opportunities to earn income. Progressive Women of India aims to bridge this gap by creating a comprehensive platform where talented women can showcase their products and services, connect with customers, and build sustainable businesses.</p>
            </div>
          </AnimSection>

          {/* Platform Features */}
          <AnimSection>
            <h2 className="font-display text-3xl font-bold text-center mb-8">🌈 Platform Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* For Sellers */}
              <div className="card p-6 border-t-4 border-primary">
                <h3 className="font-display text-xl font-bold mb-4">👩‍💼 For Sellers (Women Only)</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">Three Ways to Earn:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {['Sell products online', 'Offer booking services', 'Teach online courses'].map(i => (
                        <li key={i} className="flex items-center gap-2"><span className="text-primary">✓</span>{i}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">Registration Options:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {['Aadhar Card', 'Bank Account Number', 'Email Address', 'Personal Phone Number'].map(i => (
                        <li key={i} className="flex items-center gap-2"><span className="text-blue-500">→</span>{i}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* For Customers */}
              <div className="card p-6 border-t-4 border-dark">
                <h3 className="font-display text-xl font-bold mb-4">🛍️ For Customers (Everyone)</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">Who Can Buy:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {['Men, women, and families', 'Anyone looking for quality products', 'Support local women entrepreneurs'].map(i => (
                        <li key={i} className="flex items-center gap-2"><span className="text-green-500">✓</span>{i}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">Easy Discovery:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {['Search by district', 'Filter by locality', 'Find nearby sellers'].map(i => (
                        <li key={i} className="flex items-center gap-2"><span className="text-blue-500">→</span>{i}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </AnimSection>

          {/* Pricing */}
          <AnimSection>
            <div className="card p-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center">
              <h2 className="font-display text-2xl font-bold mb-2">💰 Fair Pricing Model</h2>
              <div className="text-6xl font-display font-black text-green-600 my-4">98%</div>
              <p className="text-xl font-semibold text-gray-700">Profit goes directly to the Seller!</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {['Only ₹10 platform fee per order', 'Transparent pricing', 'Direct income earning', 'No hidden charges'].map(f => (
                  <div key={f} className="bg-white rounded-xl p-3 shadow-sm text-sm text-gray-600 font-medium">✅ {f}</div>
                ))}
              </div>
              <div className="mt-6 bg-green-600 text-white rounded-xl p-4 inline-block">
                <p className="font-bold text-lg">Example: Sell for ₹250, Keep ₹240!</p>
              </div>
            </div>
          </AnimSection>

          {/* Impact */}
          <AnimSection>
            <div className="card p-8 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
              <h2 className="font-display text-2xl font-bold mb-6 text-center">🎯 Our Impact Goal</h2>
              <div className="text-center mb-6">
                <div className="text-5xl font-display font-black text-primary">16-20 Crore</div>
                <p className="text-gray-600 mt-1">Women We're Targeting</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Create income opportunities', 'Build entrepreneurial skills', 'Foster financial independence', 'Strengthen local economies'].map(g => (
                  <div key={g} className="text-center p-3 bg-white rounded-xl shadow-sm text-sm text-gray-700 font-medium">🌸 {g}</div>
                ))}
              </div>
            </div>
          </AnimSection>

          {/* Why */}
          <AnimSection>
            <h2 className="font-display text-3xl font-bold text-center mb-8">🌟 Why Progressive Women of India?</h2>
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

          {/* How it works */}
          <AnimSection>
            <h2 className="font-display text-3xl font-bold text-center mb-8">📊 How It Works</h2>
            <div className="grid md:grid-cols-4 gap-5 relative">
              <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-primary/30 z-0" />
              {STEPS.map((s, i) => (
                <div key={s.step} className="card p-5 text-center relative z-10 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">{s.step}</div>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">Step {i+1}: {s.title}</h3>
                  <p className="text-xs text-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </AnimSection>

          {/* CTA */}
          <AnimSection>
            <div className="card p-10 text-center bg-gradient-to-r from-primary to-secondary text-white">
              <h2 className="font-display text-3xl font-bold">Join the Movement! 🌸</h2>
              <p className="mt-2 text-white/80 text-lg">Be part of India's largest women entrepreneur network</p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <a href="/register" className="bg-white text-primary font-bold px-8 py-3 rounded-full hover:scale-105 transition-all shadow-lg">Register as Seller</a>
                <a href="/products" className="border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white hover:text-primary transition-all">Shop Now</a>
              </div>
            </div>
          </AnimSection>
        </div>
      </main>
    </div>
  )
}
