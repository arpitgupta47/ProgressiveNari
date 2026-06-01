import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../components/Toast.jsx'
import api from '../api/api.js'

const DELIVERY_OPTIONS = [
  { value: 'self_pickup', label: 'Self Pickup', charge: 0, desc: 'Collect from seller', icon: '🚶' },
  { value: 'seller_delivery', label: 'Seller Delivery', charge: 50, desc: 'Delivered by seller', icon: '🏍️' },
  { value: 'company_delivery', label: 'Company Delivery', charge: 200, desc: 'Pan-India courier', icon: '📦' }
]

const PAYMENT_OPTIONS = [
  { value: 'online', label: 'Online Payment', desc: 'Pay securely with UPI, card, or net banking', icon: '💳' },
  { value: 'upi', label: 'UPI / QR Pay', desc: 'Pay using Google Pay, PhonePe, Paytm, or UPI apps', icon: '📲' },
  { value: 'cash', label: 'Cash on Delivery', desc: 'Pay cash when the order is delivered', icon: '💵' }
]

const PLATFORM_FEE = 10

export default function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal } = useCart()
  const [deliveryType, setDeliveryType] = useState('self_pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [paymentMode, setPaymentMode] = useState('online')
  const [placing, setPlacing] = useState(false)
  const [step, setStep] = useState('cart') // cart | payment | success

  const deliveryCharge = DELIVERY_OPTIONS.find(d => d.value === deliveryType)?.charge || 0
  const total = subtotal + deliveryCharge + PLATFORM_FEE

  const handleProceedToPayment = () => {
    if (!user) { navigate('/login'); return }
    if (cart.length === 0) { showToast('Cart is empty', 'error'); return }
    if ((deliveryType !== 'self_pickup') && !deliveryAddress.trim()) {
      showToast('Please enter delivery address', 'error'); return
    }
    setStep('payment')
  }

  const handleConfirmPayment = async () => {
    setPlacing(true)
    try {
      const items = cart.map(item => ({ productId: item._id, quantity: item.quantity }))
      const res = await api.post('/orders', {
        items, deliveryType, deliveryAddress, customerNote, paymentMode
      })

      const order = res.data.order
      if (paymentMode === 'online') {
        try {
          const payRes = await api.post('/payment/create-order', { orderId: order._id })
          const { razorpayOrderId, amount, keyId } = payRes.data

          const options = {
            key: keyId,
            amount,
            currency: 'INR',
            name: 'Progressive Naari',
            description: 'Order Payment',
            order_id: razorpayOrderId,
            handler: async (response) => {
              try {
                await api.post('/payment/verify', {
                  ...response,
                  orderId: order._id
                })
                clearCart()
                showToast('🎉 Order placed & payment successful!', 'success')
                setStep('success')
              } catch {
                showToast('Payment verification failed. Contact support.', 'error')
              }
            },
            prefill: { name: user.name, email: user.email },
            theme: { color: '#E63946' }
          }

          const rzp = new window.Razorpay(options)
          rzp.open()
        } catch (error) {
          clearCart()
          showToast('Order placed, but payment gateway is unavailable. Please pay via UPI/Cash later.', 'info')
          setStep('success')
        }
      } else {
        const message = paymentMode === 'cash'
          ? 'Order placed with Cash on Delivery. Please pay when the order arrives.'
          : 'Order placed. Please complete the UPI payment using the provided details.'

        clearCart()
        showToast(message, 'success')
        setStep('success')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order', 'error')
    } finally {
      setPlacing(false)
    }
  }

  if (step === 'success') return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-32 pb-12 max-w-lg mx-auto px-4 text-center">
        <div className="card p-10">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-display text-2xl font-bold text-dark">Order Placed Successfully!</h1>
          <p className="text-muted mt-2">Your order is confirmed. You will receive notifications about delivery and payment updates.</p>
          <div className="mt-6 space-y-2">
            <Link to="/orders" className="block btn-primary w-full text-center">View My Orders</Link>
            <Link to="/products" className="block btn-secondary w-full text-center">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  )

  const PaymentDetails = () => (
    <div className="card p-5 h-fit sticky top-28 space-y-4">
      <h2 className="font-semibold text-gray-800">Confirm Payment</h2>
      <p className="text-sm text-gray-600">Choose a payment method to complete your order.</p>

      <div className="space-y-2">
        {PAYMENT_OPTIONS.map(opt => (
          <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${paymentMode === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="paymentMode" value={opt.value} checked={paymentMode === opt.value} onChange={() => setPaymentMode(opt.value)} className="mt-2" />
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {paymentMode === 'upi' && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">UPI Payment Instructions</p>
          <p>Send payment to <span className="font-bold">progressivenaari@upi</span> or scan the UPI QR code provided at checkout.</p>
          <p className="text-xs text-gray-500 mt-2">Please complete the payment after order placement and share the UPI transaction ID in the notifications section.</p>
        </div>
      )}

      <div className="space-y-2 text-sm border-t pt-3">
        <div className="flex justify-between text-muted"><span>Subtotal ({cart.length} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
        <div className="flex justify-between text-muted"><span>Delivery</span><span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
        <div className="flex justify-between text-muted"><span>Platform Fee</span><span>₹{PLATFORM_FEE}</span></div>
        <hr className="border-gray-100 my-1" />
        <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">₹{total.toLocaleString()}</span></div>
      </div>

      <button onClick={handleConfirmPayment} disabled={placing}
        className="w-full py-3 bg-accent hover:bg-yellow-400 text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50">
        {placing ? '⏳ Processing...' : paymentMode === 'cash' ? `Pay Cash on Delivery — ₹${total.toLocaleString()}` : paymentMode === 'upi' ? `Confirm UPI Payment — ₹${total.toLocaleString()}` : `Pay Online — ₹${total.toLocaleString()}`}
      </button>
      <button onClick={() => setStep('cart')} className="w-full py-3 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">Back to Cart</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <Navbar />
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4">
        <h1 className="font-display text-2xl font-bold mb-6">🛒 Your Cart</h1>

        {cart.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-5xl">🛒</p>
            <p className="text-gray-500 mt-4 text-lg">Your cart is empty</p>
            <Link to="/products" className="btn-primary mt-4 inline-block">Start Shopping</Link>
          </div>
        ) : step === 'cart' ? (
          <div className="grid gap-6 md:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item._id} className="card p-4 flex items-center gap-4">
                  <img src={item.imageUrl || 'https://placehold.co/80x80/f0f2f5/ccc?text=?'}
                    onError={e => e.target.src='https://placehold.co/80x80/f0f2f5/ccc?text=?'}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted">{item.category}</p>
                    <p className="text-primary font-bold mt-1">₹{item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-bold flex items-center justify-center">-</button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-bold flex items-center justify-center">+</button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(item._id)}
                      className="text-xs text-red-500 hover:underline mt-1">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-5 h-fit md:sticky md:top-28 space-y-4">
              <h2 className="font-semibold text-gray-800">Order Summary</h2>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Delivery Type:</p>
                <div className="space-y-2">
                  {DELIVERY_OPTIONS.map(opt => (
                    <label key={opt.value}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm
                        ${deliveryType === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                      <input type="radio" name="delivery" value={opt.value}
                        checked={deliveryType === opt.value}
                        onChange={() => setDeliveryType(opt.value)} />
                      <span>{opt.icon} {opt.label}</span>
                      <span className="ml-auto font-semibold">{opt.charge === 0 ? 'FREE' : `+₹${opt.charge}`}</span>
                    </label>
                  ))}
                </div>
              </div>

              {deliveryType !== 'self_pickup' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Address *</label>
                  <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                    rows={2} className="input-field resize-none text-sm" placeholder="Full address with pincode..." />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Note to Seller (optional)</label>
                <input value={customerNote} onChange={e => setCustomerNote(e.target.value)}
                  className="input-field text-sm" placeholder="Any special instructions?" />
              </div>

              <div className="space-y-1 text-sm border-t pt-3">
                <div className="flex justify-between text-muted"><span>Subtotal ({cart.length} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-muted"><span>Delivery</span><span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
                <div className="flex justify-between text-muted"><span>Platform Fee</span><span>₹{PLATFORM_FEE}</span></div>
                <hr className="border-gray-100 my-1" />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">₹{total.toLocaleString()}</span></div>
              </div>

              <button onClick={handleProceedToPayment} disabled={placing}
                className="w-full py-3 bg-accent hover:bg-yellow-400 text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50">
                {placing ? '⏳ Please wait...' : `Proceed to Payment — ₹${total.toLocaleString()}`}
              </button>
              <p className="text-xs text-center text-muted">You can choose Cash, UPI, or Online payment on the next screen.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item._id} className="card p-4 flex items-center gap-4">
                  <img src={item.imageUrl || 'https://placehold.co/80x80/f0f2f5/ccc?text=?'}
                    onError={e => e.target.src='https://placehold.co/80x80/f0f2f5/ccc?text=?'}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted">{item.category}</p>
                    <p className="text-primary font-bold mt-1">₹{item.price.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <p className="text-xs text-muted mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <PaymentDetails />
          </div>
        )}
      </main>
    </div>
  )
}
