import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, MapPin, CreditCard, Gift, AlertCircle } from 'lucide-react'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Order } from '../types'

interface Addr { name:string; phone:string; addressLine1:string; addressLine2:string; city:string; state:string; pincode:string }

declare global { interface Window { Razorpay: any } }

const CheckoutPage: React.FC = () => {
  const { cart, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { couponDiscount = 0, coupon: couponCode = '' } = (location.state as any) || {}

  const { subtotal, total } = getTotal()
  const shipping = subtotal >= (settings.freeShippingAbove || 499) ? 0 : (settings.standardShippingCharge || 49)
  const [loading, setLoading] = useState(false)
  const [payMethod, setPayMethod] = useState<'cod'|'upi'|'online'>('cod')
  const [addr, setAddr] = useState<Addr>({ name: user?.name||'', phone: user?.phone||'', addressLine1:'', addressLine2:'', city:'', state:'', pincode:'' })
  const [giftWrap, setGiftWrap] = useState(false)
  const [giftMsg, setGiftMsg] = useState('')
  const [placed, setPlaced] = useState<Order|null>(null)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])

  const giftWrapCharge = settings.giftWrapCharge || 29
  const codFlatCharge = settings.codFlatCharge || 0
  const codAdvancePercent = settings.codAdvancePercent || 0
  const finalTotal = total + (giftWrap ? giftWrapCharge : 0) - couponDiscount + shipping + (payMethod === 'cod' ? codFlatCharge : 0)
  const advanceAmount = payMethod === 'cod' && codAdvancePercent > 0 ? Math.ceil(finalTotal * codAdvancePercent / 100) : 0
  const onDeliveryAmount = advanceAmount > 0 ? finalTotal - advanceAmount : 0

  // Customer-specific COD availability
  const customerCodEnabled = user ? (user as any).codEnabled !== false : true
  const codAvailable = settings.codEnabled && customerCodEnabled

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    // Load saved addresses
    api.get('/auth/me').then(r => setSavedAddresses(r.data.user?.addresses || [])).catch(() => {})
    // If COD not available, default to UPI
    if (!codAvailable) setPayMethod('upi')
  }, [user])

  const selectAddress = (a: any) => {
    setAddr({ name: a.name, phone: a.phone, addressLine1: a.addressLine1, addressLine2: a.addressLine2||'', city: a.city, state: a.state, pincode: a.pincode })
  }

  const setA = (k: keyof Addr, v: string) => setAddr(a => ({ ...a, [k]: v }))

  const handleRazorpay = async (orderPayload: any) => {
    try {
      // Create Razorpay order on backend
      const rzRes = await api.post('/settings/razorpay/create-order', { amount: advanceAmount > 0 ? advanceAmount : finalTotal })
      const { order: rzOrder, keyId } = rzRes.data

      // Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        document.body.appendChild(script)
        await new Promise(resolve => script.onload = resolve)
      }

      return new Promise((resolve, reject) => {
        const rz = new window.Razorpay({
          key: keyId,
          amount: rzOrder.amount,
          currency: 'INR',
          name: settings.siteName || 'Reteiler',
          description: 'Order Payment',
          image: settings.siteLogo || '',
          order_id: rzOrder.id,
          prefill: { name: addr.name, contact: addr.phone, email: (user as any).email || '' },
          theme: { color: '#E91E63' },
          handler: (response: any) => resolve(response.razorpay_payment_id),
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        })
        rz.open()
      })
    } catch (err) { throw err }
  }

  const placeOrder = async () => {
    if (!addr.addressLine1 || !addr.city || !addr.pincode || !addr.name || !addr.phone) {
      toast.error('Please fill all delivery address fields'); return
    }
    setLoading(true)
    try {
      let paymentId = ''

      // Handle online payment (Razorpay)
      if (payMethod === 'online' && settings.razorpayEnabled) {
        try {
          paymentId = await handleRazorpay({}) as string
        } catch (err: any) {
          if (err.message === 'Payment cancelled') { toast.error('Payment cancelled'); setLoading(false); return }
          toast.error('Payment failed. Try COD instead.'); setLoading(false); return
        }
      }

      // Handle COD advance (if advance % configured)
      if (payMethod === 'cod' && codAdvancePercent > 0 && settings.razorpayEnabled) {
        try {
          paymentId = await handleRazorpay({}) as string
          toast.success(`Advance ₹${advanceAmount} paid! Remaining ₹${onDeliveryAmount} on delivery.`)
        } catch (err: any) {
          if (err.message === 'Payment cancelled') { toast.error('Advance payment cancelled'); setLoading(false); return }
          // Allow COD without advance if Razorpay fails
          toast('Advance payment skipped. Full COD on delivery.', { icon: 'ℹ️' })
        }
      }

      const items = cart?.items?.map(i => ({ productId: i.product._id, quantity: i.quantity, variant: i.variant })) || []
      const res = await api.post('/orders', {
        items, shippingAddress: addr, paymentMethod: payMethod, couponCode,
        giftWrapping: giftWrap, giftMessage: giftMsg,
        paymentId, paymentStatus: paymentId ? 'paid' : 'pending',
      })
      setPlaced(res.data.order)
      clearCart()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (placed) return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={44} className="text-green-500"/>
      </div>
      <h1 className="text-2xl font-heading font-bold mb-2">Order Placed! 🎉</h1>
      <p className="text-gray-500 mb-1">Order #{placed.orderNumber}</p>
      <p className="text-gray-400 text-sm mb-6">Thank you for shopping with {settings.siteName || 'Reteiler'}!</p>
      <div className="card p-4 text-left mb-6 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">₹{placed.total}</span></div>
        {advanceAmount > 0 && <div className="flex justify-between text-green-600"><span>Paid now</span><span className="font-bold">₹{advanceAmount}</span></div>}
        {onDeliveryAmount > 0 && <div className="flex justify-between text-orange-500"><span>Pay on delivery</span><span className="font-bold">₹{onDeliveryAmount}</span></div>}
        <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="uppercase text-orange-500 font-bold">{placed.paymentMethod}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-green-600 font-bold capitalize">{placed.orderStatus}</span></div>
      </div>
      <button onClick={() => navigate('/orders')} className="btn-primary w-full">Track My Order →</button>
    </div>
  )

  const paymentOptions = [
    ...(codAvailable ? [{ v:'cod' as const, label:'💵 Cash on Delivery', desc: codAdvancePercent > 0 ? `Pay ${codAdvancePercent}% now (₹${advanceAmount > 0 ? advanceAmount : '—'}), rest on delivery${codFlatCharge > 0 ? ` + ₹${codFlatCharge} COD charge` : ''}` : 'Pay at your doorstep' }] : []),
    ...(settings.upiEnabled ? [{ v:'upi' as const, label:'📱 UPI Payment', desc: `Pay via ${settings.upiId || 'PhonePe / GPay / Paytm'}` }] : []),
    ...(settings.razorpayEnabled ? [{ v:'online' as const, label:'💳 Card / Netbanking', desc: 'Visa, Mastercard, RuPay, Netbanking' }] : []),
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold mb-6">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Saved addresses */}
          {savedAddresses.length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold text-base mb-3 flex items-center gap-2"><MapPin size={16} className="text-primary"/> Saved Addresses</h2>
              <div className="flex gap-2 flex-wrap">
                {savedAddresses.map((a: any, i) => (
                  <button key={i} onClick={() => selectAddress(a)}
                    className="text-sm border-2 border-gray-200 hover:border-primary rounded-xl px-4 py-2 text-left transition-colors">
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-gray-400 text-xs">{a.city}, {a.pincode}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Address form */}
          <div className="card p-5">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2"><MapPin size={16} className="text-primary"/> Delivery Address</h2>
            <div className="grid grid-cols-2 gap-3">
              {([['name','Full Name *'],['phone','Phone *'],['addressLine1','Address Line 1 *'],['addressLine2','Area / Landmark'],['city','City *'],['state','State *'],['pincode','Pincode *']] as [keyof Addr, string][]).map(([k,l]) => (
                <div key={k} className={k==='addressLine1'||k==='addressLine2'?'col-span-2':''}>
                  <label className="text-xs font-bold text-gray-600 block mb-1">{l}</label>
                  <input value={addr[k]} onChange={e => setA(k, e.target.value)} className="input" placeholder={l.replace(' *','')}/>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="card p-5">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2"><CreditCard size={16} className="text-primary"/> Payment Method</h2>
            {paymentOptions.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                <AlertCircle size={16}/> No payment methods available. Contact support.
              </div>
            )}
            <div className="space-y-3">
              {paymentOptions.map(({ v, label, desc }) => (
                <label key={v} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${payMethod===v?'border-primary bg-primary/5':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="pay" value={v} checked={payMethod===v} onChange={() => setPayMethod(v)} className="accent-primary mt-0.5"/>
                  <div>
                    <p className="font-bold text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {!codAvailable && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
                <AlertCircle size={14}/> COD is not available for your account. Please pay online.
              </div>
            )}
          </div>

          {/* Gift wrap */}
          <div className="card p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={giftWrap} onChange={e => setGiftWrap(e.target.checked)} className="accent-primary w-4 h-4"/>
              <div>
                <p className="font-semibold flex items-center gap-2 text-sm"><Gift size={15} className="text-pink-500"/> Gift Wrapping <span className="text-gray-400 font-normal">(+₹{giftWrapCharge})</span></p>
                <p className="text-xs text-gray-400 mt-0.5">Beautiful packaging with a handwritten message card</p>
              </div>
            </label>
            {giftWrap && (
              <textarea value={giftMsg} onChange={e => setGiftMsg(e.target.value)} className="input mt-3 text-sm resize-none" rows={2} placeholder="Gift message (optional)…"/>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="card p-5 h-fit sticky top-24">
          <h3 className="font-bold text-lg mb-4">Order Summary</h3>
          <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
            {cart?.items?.map(i => (
              <div key={i._id} className="flex justify-between text-sm">
                <span className="text-gray-600 line-clamp-1 flex-1 mr-2">{i.product?.name} ×{i.quantity}</span>
                <span className="font-medium flex-shrink-0">₹{(i.price||i.product?.price||0)*i.quantity}</span>
              </div>
            ))}
          </div>
          <hr className="mb-3"/>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={shipping===0?'text-green-600 font-semibold':''}>{shipping===0?'FREE ✨':`₹${shipping}`}</span></div>
            {giftWrap && <div className="flex justify-between"><span className="text-gray-500">Gift Wrap</span><span>₹{giftWrapCharge}</span></div>}
            {couponDiscount > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>Coupon</span><span>-₹{couponDiscount}</span></div>}
            {payMethod === 'cod' && codFlatCharge > 0 && <div className="flex justify-between text-orange-500"><span>COD Charge</span><span>₹{codFlatCharge}</span></div>}
            <hr/>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{finalTotal}</span></div>
          </div>

          {/* COD Advance breakdown */}
          {payMethod === 'cod' && codAdvancePercent > 0 && finalTotal > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5 text-xs">
              <p className="font-bold text-amber-800">💳 COD Payment Breakdown</p>
              <div className="flex justify-between text-amber-700"><span>Pay now ({codAdvancePercent}% advance)</span><strong>₹{advanceAmount}</strong></div>
              <div className="flex justify-between text-amber-700"><span>Pay on delivery ({100-codAdvancePercent}%)</span><strong>₹{onDeliveryAmount}</strong></div>
            </div>
          )}

          <button onClick={placeOrder} disabled={loading || paymentOptions.length === 0} className="btn-primary w-full mt-5 py-3.5 text-base justify-center">
            {loading ? 'Processing…' : payMethod === 'cod' && codAdvancePercent > 0 && settings.razorpayEnabled
              ? `Pay Advance ₹${advanceAmount} & Place Order`
              : payMethod === 'online' || (payMethod === 'cod' && false)
              ? `Pay ₹${finalTotal} & Place Order`
              : `Place Order — ₹${finalTotal}`}
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">By ordering you agree to our Terms & Conditions</p>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
