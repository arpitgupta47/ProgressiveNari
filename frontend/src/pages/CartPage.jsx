import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LangContext.jsx'
import { t } from '../utils/translations.js'
import { showToast } from '../components/Toast.jsx'
import api from '../api/api.js'

const DELIVERY_OPTIONS = [
  { value: 'self_pickup', label: 'Self Pickup', hi: 'खुद लें', charge: 0, icon: '🚶', desc: 'Pick up from seller directly', hi_desc: 'विक्रेता से सीधे लें' },
  { value: 'seller_delivery', label: 'Seller Delivery', hi: 'सेलर डिलीवरी', charge: 50, icon: '🏍️', desc: 'Delivered by seller', hi_desc: 'विक्रेता द्वारा डिलीवरी' },
  { value: 'company_delivery', label: 'Company Delivery', hi: 'कंपनी डिलीवरी', charge: 200, icon: '📦', desc: 'Pan-India courier delivery', hi_desc: 'पूरे भारत में डिलीवरी' },
]

const PAYMENT_METHODS = [
  { value: 'razorpay', label: 'Online Payment', hi: 'ऑनलाइन भुगतान', icon: '💳', desc: 'UPI, Card, Net Banking via Razorpay', hi_desc: 'UPI, कार्ड, नेट बैंकिंग' },
  { value: 'cod', label: 'Cash on Delivery', hi: 'कैश ऑन डिलीवरी', icon: '💵', desc: 'Pay when order is delivered', hi_desc: 'डिलीवरी पर भुगतान करें' },
]

const PLATFORM_FEE = 10

export default function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal } = useCart()
  const { lang } = useLang()
  const [deliveryType, setDeliveryType] = useState('self_pickup')
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryPincode, setDeliveryPincode] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [step, setStep] = useState('cart') // cart | payment | success
  const [orderId, setOrderId] = useState(null)
  const [razorpayConfigured, setRazorpayConfigured] = useState(true)

  useEffect(() => {
    // Check if Razorpay is configured
    api.get('/payment/key').then(r => setRazorpayConfigured(r.data.configured)).catch(() => {})
    // Load Razorpay script
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script')
      script.id = 'razorpay-script'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
    }
  }, [])

  const deliveryCharge = DELIVERY_OPTIONS.find(d => d.value === deliveryType)?.charge || 0
  const total = subtotal + deliveryCharge + PLATFORM_FEE

  // Step 1: Place order
  const handlePlaceOrder = async () => {
    if (!user) { navigate('/login'); return }
    if (cart.length === 0) { showToast('Cart is empty', 'error'); return }
    if (deliveryType !== 'self_pickup' && !deliveryAddress.trim()) {
      showToast(lang === 'hi' ? 'डिलीवरी पता दर्ज करें' : 'Enter delivery address', 'error'); return
    }
    setPlacing(true)
    try {
      const items = cart.map(i => ({ productId: i._id, quantity: i.quantity }))
      const res = await api.post('/orders', {
        items, deliveryType, deliveryAddress, deliveryCity, deliveryPincode, customerNote, paymentMethod
      })
      setOrderId(res.data.order._id)
      setStep('payment')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order', 'error')
    } finally { setPlacing(false) }
  }

  // Step 2a: Pay online via Razorpay
  const handleRazorpayPayment = async () => {
    if (!razorpayConfigured) {
      showToast('Razorpay not configured. Use COD or add keys to .env', 'error'); return
    }
    setPlacing(true)
    try {
      const payRes = await api.post('/payment/create-order', { orderId })
      const { razorpayOrderId, amount, keyId } = payRes.data

      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        name: 'Progressive Naari',
        description: `Order Payment — ₹${PLATFORM_FEE} platform fee included`,
        image: 'https://i.imgur.com/placeholder.png',
        order_id: razorpayOrderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#E63946' },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId
            })
            clearCart()
            showToast('🎉 Payment successful!', 'success')
            setStep('success')
          } catch {
            showToast('Payment verification failed. Contact support.', 'error')
          }
        },
        modal: { ondismiss: () => showToast('Payment cancelled', 'info') }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => showToast('Payment failed. Try again.', 'error'))
      rzp.open()
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment error', 'error')
    } finally { setPlacing(false) }
  }

  // Step 2b: COD confirmation
  const handleCOD = async () => {
    setPlacing(true)
    try {
      await api.post('/payment/cod-confirm', { orderId })
      clearCart()
      showToast(lang === 'hi' ? '✅ ऑर्डर कन्फर्म! डिलीवरी पर ₹' + total + ' दें' : `✅ Order confirmed! Pay ₹${total} on delivery`, 'success')
      setStep('success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error')
    } finally { setPlacing(false) }
  }

  // SUCCESS screen
  if (step === 'success') return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-32 pb-12 max-w-lg mx-auto px-4 text-center">
        <div className="card p-10">
          <div className="text-7xl mb-4 animate-bounce">🎉</div>
          <h1 className="font-display text-3xl font-bold text-dark">{lang === 'hi' ? 'ऑर्डर हो गया!' : 'Order Placed!'}</h1>
          <p className="text-muted mt-2">{lang === 'hi' ? 'विक्रेता जल्द ही स्वीकार करेगा। आपको सूचना मिलेगी।' : 'Seller will accept soon. You will be notified.'}</p>
          {paymentMethod === 'cod' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              💵 {lang === 'hi' ? `डिलीवरी पर ₹${total} नकद दें।` : `Pay ₹${total} cash at delivery.`}
            </div>
          )}
          <div className="mt-6 space-y-2">
            <Link to="/orders" className="block btn-primary text-center">{lang === 'hi' ? 'ऑर्डर देखें' : 'View My Orders'}</Link>
            <Link to="/products" className="block btn-secondary text-center">{lang === 'hi' ? 'खरीदारी जारी रखें' : 'Continue Shopping'}</Link>
          </div>
        </div>
      </div>
    </div>
  )

  // PAYMENT screen
  if (step === 'payment') return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-28 pb-12 max-w-lg mx-auto px-4">
        <div className="card p-6 shadow-xl">
          <h1 className="font-display text-2xl font-bold mb-2">💳 {lang === 'hi' ? 'भुगतान करें' : 'Choose Payment'}</h1>
          <p className="text-muted text-sm mb-6">{lang === 'hi' ? 'भुगतान का तरीका चुनें' : 'Select how you want to pay'}</p>

          {/* Amount summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between text-muted"><span>{lang === 'hi' ? 'उप-कुल' : 'Subtotal'}</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between text-muted"><span>{lang === 'hi' ? 'डिलीवरी' : 'Delivery'}</span><span>{deliveryCharge === 0 ? (lang === 'hi' ? 'मुफ्त' : 'FREE') : `₹${deliveryCharge}`}</span></div>
            <div className="flex justify-between text-muted"><span>{lang === 'hi' ? 'प्लेटफॉर्म शुल्क' : 'Platform Fee'}</span><span>₹{PLATFORM_FEE}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span className="text-dark">{lang === 'hi' ? 'कुल' : 'Total'}</span>
              <span className="text-primary text-lg">₹{total}</span>
            </div>
          </div>

          {/* Payment methods */}
          <div className="space-y-3 mb-6">
            {/* Razorpay */}
            <div className="border-2 border-primary bg-primary/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💳</span>
                <div>
                  <p className="font-bold text-gray-800">{lang === 'hi' ? 'ऑनलाइन भुगतान' : 'Pay Online'}</p>
                  <p className="text-xs text-muted">{lang === 'hi' ? 'UPI, कार्ड, नेट बैंकिंग' : 'UPI, Card, Net Banking, Wallet'}</p>
                </div>
              </div>
              {/* UPI logos */}
              <div className="flex gap-3 mb-4 flex-wrap">
                {['🏦 GPay', '📱 PhonePe', '💰 Paytm', '💳 Card', '🏦 NetBanking'].map(m => (
                  <span key={m} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600">{m}</span>
                ))}
              </div>
              <button onClick={handleRazorpayPayment} disabled={placing || !razorpayConfigured}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-all disabled:opacity-50 text-lg">
                {placing ? '⏳...' : `⚡ ${lang === 'hi' ? '₹' + total + ' अभी भुगतान करें' : `Pay ₹${total} Now`}`}
              </button>
              {!razorpayConfigured && (
                <p className="text-xs text-center text-red-500 mt-2">⚠️ Razorpay not configured. Add keys to backend .env</p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-muted font-semibold">{lang === 'hi' ? 'या' : 'OR'}</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            {/* COD */}
            <div className="border-2 border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💵</span>
                <div>
                  <p className="font-bold text-gray-800">{lang === 'hi' ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}</p>
                  <p className="text-xs text-muted">{lang === 'hi' ? 'डिलीवरी पर नकद भुगतान करें' : 'Pay cash when order arrives'}</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3 text-xs text-yellow-800">
                ⚠️ {lang === 'hi' ? 'डिलीवरी पर ₹' + total + ' तैयार रखें।' : `Keep ₹${total} ready at delivery.`}
              </div>
              <button onClick={handleCOD} disabled={placing}
                className="w-full py-3 bg-dark text-white font-bold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50">
                {placing ? '⏳...' : `📦 ${lang === 'hi' ? 'COD से ऑर्डर करें' : 'Place COD Order'}`}
              </button>
            </div>
          </div>

          <button onClick={() => setStep('cart')} className="w-full text-center text-sm text-muted hover:text-primary transition-colors">
            ← {lang === 'hi' ? 'कार्ट पर वापस जाएं' : 'Back to Cart'}
          </button>
        </div>
      </div>
    </div>
  )

  // CART screen
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">
        <h1 className="font-display text-2xl font-bold mb-6">🛒 {lang === 'hi' ? 'आपका कार्ट' : 'Your Cart'}</h1>

        {cart.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-5xl">🛒</p>
            <p className="text-gray-500 mt-4 text-lg">{lang === 'hi' ? 'कार्ट खाली है' : 'Your cart is empty'}</p>
            <Link to="/products" className="btn-primary mt-4 inline-block">{lang === 'hi' ? 'खरीदारी शुरू करें' : 'Start Shopping'}</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_380px] gap-6">
            {/* Cart items */}
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item._id} className="card p-4 flex items-center gap-4">
                  <img src={item.imageUrl || 'https://placehold.co/80x80/f0f2f5/ccc?text=?'}
                    onError={e => e.target.src = 'https://placehold.co/80x80/f0f2f5/ccc?text=?'}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted">{item.category}</p>
                    <p className="text-primary font-bold mt-1">₹{item.price?.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-bold flex items-center justify-center transition-colors">-</button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-bold flex items-center justify-center transition-colors">+</button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark">₹{(item.price * item.quantity)?.toLocaleString()}</p>
                    <button onClick={() => removeFromCart(item._id)} className="text-xs text-red-500 hover:underline mt-1">
                      {lang === 'hi' ? 'हटाएं' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="card p-5 h-fit sticky top-28 space-y-4">
              <h2 className="font-semibold text-gray-800 text-lg">{lang === 'hi' ? 'ऑर्डर सारांश' : 'Order Summary'}</h2>

              {/* Delivery type */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">🚚 {lang === 'hi' ? 'डिलीवरी प्रकार:' : 'Delivery Type:'}</p>
                <div className="space-y-2">
                  {DELIVERY_OPTIONS.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${deliveryType === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="delivery" value={opt.value} checked={deliveryType === opt.value} onChange={() => setDeliveryType(opt.value)} className="text-primary" />
                      <span>{opt.icon}</span>
                      <span className="text-sm font-semibold flex-1">{lang === 'hi' ? opt.hi : opt.label}</span>
                      <span className="text-sm font-bold text-primary">{opt.charge === 0 ? (lang === 'hi' ? 'मुफ्त' : 'FREE') : `₹${opt.charge}`}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Address */}
              {deliveryType !== 'self_pickup' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{lang === 'hi' ? 'डिलीवरी पता *' : 'Delivery Address *'}</label>
                  <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                    rows={2} className="input-field resize-none text-sm" placeholder={lang === 'hi' ? 'पूरा पता...' : 'Full address with landmark...'} />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)}
                      className="input-field text-sm" placeholder={lang === 'hi' ? 'शहर' : 'City'} />
                    <input value={deliveryPincode} onChange={e => setDeliveryPincode(e.target.value)}
                      className="input-field text-sm" placeholder={lang === 'hi' ? 'पिनकोड' : 'Pincode'} />
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{lang === 'hi' ? 'विक्रेता को नोट' : 'Note to Seller'}</label>
                <input value={customerNote} onChange={e => setCustomerNote(e.target.value)}
                  className="input-field text-sm" placeholder={lang === 'hi' ? 'कोई विशेष निर्देश?' : 'Any special instructions?'} />
              </div>

              {/* Price breakdown */}
              <div className="space-y-1 text-sm border-t pt-3">
                <div className="flex justify-between text-muted"><span>{lang === 'hi' ? 'उप-कुल' : 'Subtotal'}</span><span>₹{subtotal?.toLocaleString()}</span></div>
                <div className="flex justify-between text-muted"><span>{lang === 'hi' ? 'डिलीवरी' : 'Delivery'}</span><span>{deliveryCharge === 0 ? (lang === 'hi' ? 'मुफ्त' : 'FREE') : `₹${deliveryCharge}`}</span></div>
                <div className="flex justify-between text-muted"><span>{lang === 'hi' ? 'प्लेटफॉर्म शुल्क' : 'Platform Fee'}</span><span>₹{PLATFORM_FEE}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>{lang === 'hi' ? 'कुल' : 'Total'}</span>
                  <span className="text-primary text-lg">₹{total?.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handlePlaceOrder} disabled={placing}
                className="w-full py-3.5 bg-accent hover:bg-yellow-400 text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50 text-base">
                {placing ? '⏳...' : `${lang === 'hi' ? 'आगे बढ़ें →' : 'Proceed to Payment →'}`}
              </button>
              <p className="text-xs text-center text-muted">{lang === 'hi' ? 'अगले स्टेप पर भुगतान चुनें' : 'Choose payment method in next step'}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
