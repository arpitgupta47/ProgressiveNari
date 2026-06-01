import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar.jsx'

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

const TIERS = [
  {
    stars: '⭐',
    name: 'Bronze Star',
    sales: '₹50K+',
    color: 'from-amber-700 to-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-800',
    perks: ['Featured in local listings', '5% bonus on monthly sales', 'Priority customer support']
  },
  {
    stars: '⭐⭐',
    name: 'Silver Star',
    sales: '₹1L+',
    color: 'from-gray-500 to-gray-300',
    bg: 'bg-gray-50',
    border: 'border-gray-400',
    badge: 'bg-gray-100 text-gray-700',
    perks: ['Featured in Start & Market section', '10% bonus on monthly sales', 'Free marketing materials', 'Business training sessions'],
    popular: true
  },
  {
    stars: '⭐⭐⭐',
    name: 'Gold Star',
    sales: '₹2L+',
    color: 'from-yellow-500 to-yellow-300',
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800',
    perks: ['Homepage feature', '15% bonus on monthly sales', 'Dedicated account manager', 'Media coverage opportunities', 'Networking events access']
  }
]

const BENEFITS = [
  { icon: '📈', title: 'Business Analytics', desc: 'Track your sales, customer preferences, and growth trends with detailed dashboards' },
  { icon: '🎯', title: 'Targeted Marketing', desc: 'Get featured in locality-specific searches. Customers can find you by district and area' },
  { icon: '💳', title: 'Instant Payments', desc: 'Receive payments directly to your bank account within 24-48 hours' },
  { icon: '📱', title: 'Easy Mobile App', desc: 'Manage your entire business from your phone. Accept orders, update inventory, communicate with customers' },
  { icon: '🛡️', title: 'Seller Protection', desc: 'We protect your interests with fair policies and dispute resolution support' },
  { icon: '🎓', title: 'Free Training', desc: 'Access business skills training, digital marketing courses, and success workshops' }
]

const STORIES = [
  { initials: 'BS', name: 'Mrs. Bina Singh', location: 'Delhi', tier: 'Gold Star Seller', quote: 'Started with just homemade pickles. Now I earn ₹80,000 monthly and achieved Gold Star status in 6 months!', color: 'bg-yellow-500' },
  { initials: 'PJ', name: 'Mrs. Preeti Joshi', location: 'Mumbai', tier: 'Silver Star Professional', quote: 'As a mehandi artist, I now get bookings from across my city. The platform changed my life completely!', color: 'bg-gray-400' },
  { initials: 'DG', name: 'Mrs. Devi Gupta', location: 'Bangalore', tier: 'Silver Star Seller', quote: 'My handmade crafts now reach customers I never imagined. Earning ₹60K monthly while working from home!', color: 'bg-gray-400' }
]

function AnimSection({ children, className = '' }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      {children}
    </div>
  )
}

export default function StarWorker() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white py-16 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {Array(20).fill(0).map((_, i) => (
              <div key={i} className="absolute text-4xl animate-float" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*3}s`, animationDuration: `${3+Math.random()*2}s` }}>⭐</div>
            ))}
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="text-5xl mb-4">⭐</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold">Become a Star Worker</h1>
            <p className="mt-3 text-xl text-yellow-100">Earn more, grow faster, and build your brand with our Star Worker Program</p>
            <a href="/register" className="mt-6 inline-block bg-white text-amber-600 font-bold px-8 py-3 rounded-full hover:bg-yellow-50 transition-all hover:scale-105 shadow-lg">
              Join Now — It's Free!
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
          {/* Tiers */}
          <AnimSection>
            <h2 className="font-display text-3xl font-bold text-center mb-2">🌟 3-Tier Star Worker Program</h2>
            <p className="text-center text-muted mb-8">Progress through tiers and unlock amazing benefits as you grow</p>
            <div className="grid md:grid-cols-3 gap-6">
              {TIERS.map((tier) => (
                <div key={tier.name} className={`card border-2 ${tier.border} ${tier.bg} relative hover:shadow-xl transition-all hover:-translate-y-1`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</div>
                  )}
                  <div className={`bg-gradient-to-r ${tier.color} p-5 text-center`}>
                    <div className="text-3xl">{tier.stars}</div>
                    <h3 className="font-display text-xl font-bold text-white mt-1">{tier.name}</h3>
                    <div className="text-white/90 text-sm mt-1">Monthly Sales</div>
                    <div className="text-3xl font-bold text-white mt-1">{tier.sales}</div>
                  </div>
                  <div className="p-5">
                    <ul className="space-y-2">
                      {tier.perks.map(perk => (
                        <li key={perk} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 font-bold mt-0.5">✓</span>
                          <span className="text-gray-700">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </AnimSection>

          {/* Benefits */}
          <AnimSection>
            <h2 className="font-display text-3xl font-bold text-center mb-8">💎 Additional Seller Benefits</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {BENEFITS.map(b => (
                <div key={b.title} className="card p-5 hover:shadow-lg transition-all hover:-translate-y-1 group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{b.icon}</div>
                  <h3 className="font-semibold text-gray-800 text-base">{b.title}</h3>
                  <p className="text-sm text-muted mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </AnimSection>

          {/* Success Stories */}
          <AnimSection>
            <h2 className="font-display text-3xl font-bold text-center mb-8">💬 Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {STORIES.map(s => (
                <div key={s.name} className="card p-6 hover:shadow-lg transition-all">
                  <div className="text-4xl text-yellow-400 font-serif leading-none mb-3">"</div>
                  <p className="text-gray-600 text-sm italic">{s.quote}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className={`w-10 h-10 ${s.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>{s.initials}</div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{s.name}</p>
                      <p className="text-xs text-muted">{s.location} | {s.tier}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimSection>

          {/* CTA */}
          <AnimSection>
            <div className="card p-10 text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <h2 className="font-display text-3xl font-bold">Ready to Become a Star? 🌟</h2>
              <p className="mt-2 text-white/80">Join thousands of women already earning with Progressive Naari</p>
              <a href="/register" className="mt-6 inline-block bg-white text-amber-600 font-bold px-8 py-3 rounded-full hover:scale-105 transition-all shadow-lg">
                Start Your Journey Today
              </a>
            </div>
          </AnimSection>
        </div>
      </main>
    </div>
  )
}
