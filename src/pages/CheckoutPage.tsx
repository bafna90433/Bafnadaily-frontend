import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, MapPin, CreditCard, Gift, AlertCircle, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Order } from '../types'

interface Addr {
  _id?: string
  shopName: string
  name: string
  phone: string
  whatsapp: string
  gstNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}

const BLANK_ADDR: Addr = { shopName:'', name:'', phone:'', whatsapp:'', gstNumber:'', addressLine1:'', addressLine2:'', city:'', state:'', pincode:'', isDefault:false }

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry']

declare global { interface Window { Razorpay: any } }

const CheckoutPage: React.FC = () => {
  const { cart, getTotal, clearCart, setHasNewItem } = useCartStore()
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { couponDiscount = 0, coupon: couponCode = '' } = (location.state as any) || {}

  const { subtotal, total } = getTotal()
  const shipping = subtotal >= (settings.freeShippingAbove || 499) ? 0 : (settings.standardShippingCharge || 49)

  const [loading, setLoading] = useState(false)
  const [payMethod, setPayMethod] = useState<'cod'|'upi'|'online'>('cod')
  const [giftWrap, setGiftWrap] = useState(false)
  const [giftMsg, setGiftMsg] = useState('')
  const [placed, setPlaced] = useState<Order|null>(null)

  // Addresses
  const [addresses, setAddresses] = useState<Addr[]>([])
  const [selectedAddr, setSelectedAddr] = useState<Addr|null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editAddr, setEditAddr] = useState<Addr|null>(null)
  const [form, setForm] = useState<Addr>(BLANK_ADDR)
  const [savingAddr, setSavingAddr] = useState(false)

  const giftWrapCharge = settings.giftWrapCharge || 29
  const codFlatCharge = settings.codFlatCharge || 0
  const codAdvancePercent = settings.codAdvancePercent || 0
  const finalTotal = total + (giftWrap ? giftWrapCharge : 0) - couponDiscount + shipping + (payMethod === 'cod' ? codFlatCharge : 0)
  const advanceAmount = payMethod === 'cod' && codAdvancePercent > 0 ? Math.ceil(finalTotal * codAdvancePercent / 100) : 0
  const onDeliveryAmount = advanceAmount > 0 ? finalTotal - advanceAmount : 0
  const customerCodEnabled = user ? (user as any).codEnabled !== false : true
  const codAvailable = settings.codEnabled && customerCodEnabled

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadAddresses()
    if (!codAvailable) setPayMethod('upi')
    
    // Stop cart blinking when user lands on checkout
    setHasNewItem(false)
  }, [user])

  const loadAddresses = async () => {
    try {
      const r = await api.get('/auth/me')
      const addrs: Addr[] = r.data.user?.addresses || []
      setAddresses(addrs)
      if (addrs.length > 0) {
        const def = addrs.find(a => a.isDefault) || addrs[0]
        setSelectedAddr(def)
      } else {
        setShowForm(true)
      }
    } catch {}
  }

  const fetchPincodeData = async (pincode: string) => {
    if (pincode.length !== 6) return
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      const data = await res.json()
      if (data[0]?.Status === 'Success') {
        const po = data[0].PostOffice[0]
        setForm(f => ({ ...f, city: po.District, state: po.State }))
      }
    } catch {}
  }

  const setF = (k: keyof Addr, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'pincode' && v.length === 6) fetchPincodeData(v)
    if (k === 'phone' && !form.whatsapp) setForm(f => ({ ...f, phone: v, whatsapp: v }))
  }

  const openNewForm = () => {
    setEditAddr(null)
    setForm({ ...BLANK_ADDR, name: user?.name || '', phone: (user as any)?.phone || '' })
    setShowForm(true)
  }

  const openEditForm = (a: Addr) => {
    setEditAddr(a)
    setForm({ ...a })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditAddr(null)
    setForm(BLANK_ADDR)
  }

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.shopName || !form.name || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      toast.error('Sabhi required fields bharo'); return
    }
    setSavingAddr(true)
    try {
      let res
      if (editAddr?._id) {
        res = await api.put(`/auth/address/${editAddr._id}`, form)
      } else {
        res = await api.post('/auth/address', { ...form, isDefault: addresses.length === 0 })
      }
      const updated: Addr[] = res.data.addresses || []
      setAddresses(updated)
      const saved = editAddr?._id
        ? updated.find(a => a._id === editAddr._id)
        : updated[updated.length - 1]
      if (saved) setSelectedAddr(saved)
      cancelForm()
      toast.success(editAddr ? 'Address updated!' : 'Address saved!')
    } catch { toast.error('Save failed') } finally { setSavingAddr(false) }
  }

  const deleteAddress = async (id: string) => {
    try {
      const res = await api.delete(`/auth/address/${id}`)
      const updated: Addr[] = res.data.addresses || []
      setAddresses(updated)
      if (selectedAddr?._id === id) setSelectedAddr(updated[0] || null)
      toast.success('Address deleted')
    } catch { toast.error('Delete failed') }
  }

  const handleRazorpay = async () => {
    const rzRes = await api.post('/settings/razorpay/create-order', { amount: advanceAmount > 0 ? advanceAmount : finalTotal })
    const { order: rzOrder, keyId } = rzRes.data
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      await new Promise(resolve => script.onload = resolve)
    }
    return new Promise<string>((resolve, reject) => {
      const rz = new window.Razorpay({
        key: keyId, amount: rzOrder.amount, currency: 'INR',
        name: settings.siteName || 'Store', order_id: rzOrder.id,
        prefill: { name: selectedAddr?.name, contact: selectedAddr?.phone },
        theme: { color: '#E91E63' },
        handler: (r: any) => resolve(r.razorpay_payment_id),
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      })
      rz.open()
    })
  }

  const placeOrder = async () => {
    if (!selectedAddr) { toast.error('Delivery address select karo'); return }
    setLoading(true)
    try {
      let paymentId = ''
      if (payMethod === 'online' && settings.razorpayEnabled) {
        try { paymentId = await handleRazorpay() }
        catch (e: any) { if (e.message === 'Payment cancelled') { toast.error('Payment cancelled'); return } throw e }
      }
      if (payMethod === 'cod' && codAdvancePercent > 0 && settings.razorpayEnabled) {
        try { 
          paymentId = await handleRazorpay(); 
          toast.success(`Advance ₹${advanceAmount} paid!`) 
        } catch (e: any) { 
          if (e.message === 'Payment cancelled') { 
            toast.error('Payment cancelled. Advance payment is required for COD.')
            setLoading(false)
            return 
          }
          toast('Advance skipped. Full COD.', { icon: 'ℹ️' }) 
        }
      }
      const shippingAddress = {
        name: selectedAddr.name,
        phone: selectedAddr.phone,
        addressLine1: [selectedAddr.shopName, selectedAddr.addressLine1].filter(Boolean).join(', '),
        addressLine2: selectedAddr.addressLine2,
        city: selectedAddr.city,
        state: selectedAddr.state,
        pincode: selectedAddr.pincode,
      }
      const items = cart?.items?.map(i => ({ productId: i.product._id, quantity: i.quantity, variant: i.variant })) || []
      const res = await api.post('/orders', { items, shippingAddress, paymentMethod: payMethod, couponCode, giftWrapping: giftWrap, giftMessage: giftMsg, paymentId, paymentStatus: paymentId ? 'paid' : 'pending' })
      setPlaced(res.data.order)
      clearCart()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Order failed')
    } finally { setLoading(false) }
  }

  if (placed) return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={44} className="text-green-500"/>
      </div>
      <h1 className="text-2xl font-heading font-bold mb-2">Order Placed! 🎉</h1>
      <p className="text-gray-500 mb-1">Order #{placed.orderNumber}</p>
      <p className="text-gray-400 text-sm mb-6">Thank you for shopping with {settings.siteName || 'us'}!</p>
      <div className="card p-4 text-left mb-6 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">₹{placed.total}</span></div>
        {advanceAmount > 0 && <div className="flex justify-between text-green-600"><span>Paid now</span><span className="font-bold">₹{advanceAmount}</span></div>}
        {onDeliveryAmount > 0 && <div className="flex justify-between text-orange-500"><span>Pay on delivery</span><span className="font-bold">₹{onDeliveryAmount}</span></div>}
        <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="uppercase text-orange-500 font-bold">{placed.paymentMethod}</span></div>
      </div>
      <button onClick={() => navigate('/orders')} className="btn-primary w-full">Track My Order →</button>
    </div>
  )

  const paymentOptions = [
    ...(codAvailable ? [{ v:'cod' as const, label:'💵 Cash on Delivery', desc: codAdvancePercent > 0 ? `${codAdvancePercent}% advance required` : 'Pay at doorstep' }] : []),
    ...(settings.upiEnabled ? [{ v:'upi' as const, label:'📱 UPI Payment', desc: settings.upiId || 'PhonePe / GPay / Paytm' }] : []),
    ...(settings.razorpayEnabled ? [{ v:'online' as const, label:'💳 Card / Netbanking', desc: 'Visa, Mastercard, RuPay' }] : []),
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold mb-6">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* ── Address Section ── */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base flex items-center gap-2"><MapPin size={16} className="text-primary"/> Delivery Address</h2>
              {!showForm && (
                <button onClick={openNewForm} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  <Plus size={15}/> New Address
                </button>
              )}
            </div>

            {/* Saved address cards */}
            {!showForm && addresses.length > 0 && (
              <div className="space-y-3 mb-4">
                {addresses.map(a => (
                  <div key={a._id}
                    onClick={() => setSelectedAddr(a)}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-colors ${selectedAddr?._id === a._id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold">{a.shopName || a.name}</p>
                          {a.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Default</span>}
                        </div>
                        {a.shopName && <p className="text-gray-500 text-xs mt-0.5">Contact: {a.name}</p>}
                        <p className="text-gray-600 mt-1">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                        <p className="text-gray-500">{a.city}, {a.state} – {a.pincode}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          <span>📞 {a.phone}</span>
                          {a.whatsapp && a.whatsapp !== a.phone && <span>💬 {a.whatsapp}</span>}
                          {a.gstNumber && <span>GST: {a.gstNumber}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {selectedAddr?._id === a._id && <Check size={18} className="text-primary mt-1"/>}
                        <button onClick={e => { e.stopPropagation(); openEditForm(a) }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={13}/></button>
                        <button onClick={e => { e.stopPropagation(); deleteAddress(a._id!) }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Address Form */}
            {showForm && (
              <form onSubmit={saveAddress} className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm text-gray-700">{editAddr ? 'Edit Address' : 'Add New Address'}</p>
                  {addresses.length > 0 && <button type="button" onClick={cancelForm} className="p-1 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
                </div>

                {/* Shop Name */}
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Shop / Business Name *</label>
                  <input value={form.shopName} onChange={e => setF('shopName', e.target.value)} required className="input" placeholder="Apni dukan ka naam"/>
                </div>

                {/* Name + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Contact Person *</label>
                    <input value={form.name} onChange={e => setF('name', e.target.value)} required className="input" placeholder="Full name"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Mobile Number *</label>
                    <input value={form.phone} onChange={e => { setF('phone', e.target.value.replace(/\D/g,'')); if(!form.whatsapp) setForm(f=>({...f,whatsapp:e.target.value.replace(/\D/g,'')})) }} maxLength={10} required className="input" placeholder="10-digit number"/>
                  </div>
                </div>

                {/* WhatsApp + GST */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">WhatsApp Number</label>
                    <input value={form.whatsapp} onChange={e => setF('whatsapp', e.target.value.replace(/\D/g,''))} maxLength={10} className="input" placeholder="Same as mobile?"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">GST Number (Optional)</label>
                    <input value={form.gstNumber} onChange={e => setF('gstNumber', e.target.value.toUpperCase())} maxLength={15} className="input" placeholder="15-digit GST"/>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Street / Shop Address *</label>
                  <input value={form.addressLine1} onChange={e => setF('addressLine1', e.target.value)} required className="input" placeholder="Gali, building, street number"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Area / Colony / Landmark</label>
                  <input value={form.addressLine2} onChange={e => setF('addressLine2', e.target.value)} className="input" placeholder="Nearby landmark (optional)"/>
                </div>

                {/* Pincode → City State auto */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Pincode *</label>
                    <input value={form.pincode} onChange={e => setF('pincode', e.target.value.replace(/\D/g,''))} maxLength={6} required className="input" placeholder="6-digit"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">City *</label>
                    <input value={form.city} onChange={e => setF('city', e.target.value)} required className="input" placeholder="City"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">State *</label>
                    <select value={form.state} onChange={e => setF('state', e.target.value)} required className="input">
                      <option value="">Select</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {addresses.length > 0 && (
                    <button type="button" onClick={cancelForm} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                  )}
                  <button type="submit" disabled={savingAddr} className="flex-1 btn-primary py-2.5 justify-center text-sm">
                    {savingAddr ? 'Saving...' : editAddr ? 'Update Address' : 'Save & Use This Address'}
                  </button>
                </div>
              </form>
            )}

            {!showForm && !selectedAddr && (
              <button onClick={openNewForm} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-400 hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                <Plus size={16}/> Add Delivery Address
              </button>
            )}
          </div>

          {/* ── Payment ── */}
          <div className="card p-5">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2"><CreditCard size={16} className="text-primary"/> Payment Method</h2>
            {paymentOptions.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                <AlertCircle size={16}/> No payment methods available.
              </div>
            )}
            <div className="space-y-3">
              {paymentOptions.map(({ v, label, desc }) => (
                <label key={v} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${payMethod===v?'border-primary bg-primary/5':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="pay" value={v} checked={payMethod===v} onChange={() => setPayMethod(v)} className="accent-primary mt-0.5"/>
                  <div><p className="font-bold text-sm">{label}</p><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Gift Wrap ── */}
          <div className="card p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={giftWrap} onChange={e => setGiftWrap(e.target.checked)} className="accent-primary w-4 h-4"/>
              <div>
                <p className="font-semibold flex items-center gap-2 text-sm"><Gift size={15} className="text-pink-500"/> Gift Wrapping <span className="text-gray-400 font-normal">(+₹{giftWrapCharge})</span></p>
                <p className="text-xs text-gray-400 mt-0.5">Beautiful packaging with handwritten message card</p>
              </div>
            </label>
            {giftWrap && <textarea value={giftMsg} onChange={e => setGiftMsg(e.target.value)} className="input mt-3 text-sm resize-none" rows={2} placeholder="Gift message (optional)…"/>}
          </div>
        </div>

        {/* ── Order Summary ── */}
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
            {payMethod==='cod' && codFlatCharge > 0 && <div className="flex justify-between text-orange-500"><span>COD Charge</span><span>₹{codFlatCharge}</span></div>}
            <hr/>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{finalTotal}</span></div>
          </div>
          {payMethod==='cod' && codAdvancePercent > 0 && finalTotal > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5 text-xs">
              <p className="font-bold text-amber-800">💳 COD Breakdown</p>
              <div className="flex justify-between text-amber-700"><span>Pay now ({codAdvancePercent}%)</span><strong>₹{advanceAmount}</strong></div>
              <div className="flex justify-between text-amber-700"><span>Pay on delivery</span><strong>₹{onDeliveryAmount}</strong></div>
            </div>
          )}
          <button onClick={placeOrder} disabled={loading || !selectedAddr || paymentOptions.length === 0} className="btn-primary w-full mt-5 py-3.5 text-base justify-center disabled:opacity-50">
            {loading ? 'Processing…' : payMethod==='online' ? `Pay ₹${finalTotal}` : payMethod==='cod' && codAdvancePercent > 0 && settings.razorpayEnabled ? `Pay Advance ₹${advanceAmount}` : `Place Order — ₹${finalTotal}`}
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">By ordering you agree to our Terms & Conditions</p>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
