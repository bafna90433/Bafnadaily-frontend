import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

const CartPage: React.FC = () => {
  const { cart, fetchCart, updateItem, removeItem, getTotal } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const { subtotal, shipping, total } = getTotal()

  useEffect(() => { if (user) fetchCart() }, [user])

  if (!user) return (
    <div className="max-w-md mx-auto text-center py-24 px-4">
      <ShoppingBag size={64} className="text-gray-200 mx-auto mb-4"/><h2 className="text-xl font-bold mb-2">Login to view cart</h2>
      <Link to="/login" className="btn-primary mt-4">Login</Link>
    </div>
  )

  const items = cart?.items || []
  if (!items.length) return (
    <div className="max-w-md mx-auto text-center py-24 px-4">
      <div className="text-6xl mb-4">🛒</div><h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-6">Discover our trendy collection!</p>
      <Link to="/products" className="btn-primary">Shop Now 🛍️</Link>
    </div>
  )

  const applyCoupon = async () => {
    if (!coupon) return
    setCouponLoading(true)
    try {
      const res = await api.post('/coupons/validate', { code: coupon, amount: subtotal })
      setCouponDiscount(res.data.discount)
      toast.success(`Coupon applied! Save ₹${res.data.discount} 🎉`)
    } catch (err: any) { toast.error(err.response?.data?.message || 'Invalid coupon'); setCouponDiscount(0) }
    finally { setCouponLoading(false) }
  }

  const finalTotal = total - couponDiscount

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold mb-6">Shopping Cart <span className="text-gray-400 font-normal text-lg">({items.length} items)</span></h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => {
            const p = item.product; if (!p) return null
            const img = p.images?.[0]?.url || `https://placehold.co/96x96/FCE4EC/E91E63?text=P`
            return (
              <div key={item._id} className="card p-4 flex gap-4">
                <Link to={`/product/${p.slug}`} className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50"><img src={img} alt={p.name} className="w-full h-full object-cover"/></Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p.slug}`} className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-primary">{p.name}</Link>
                  {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateItem(item._id, Math.max(p.minQty||1, item.quantity - 1))} className="px-3 py-1.5 hover:bg-gray-50"><Minus size={13}/></button>
                      <span className="px-3 py-1.5 text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateItem(item._id, item.quantity + 1)} className="px-3 py-1.5 hover:bg-gray-50"><Plus size={13}/></button>
                    </div>
                    <div className="text-right"><p className="font-bold text-gray-900">₹{(item.price||p.price)*item.quantity}</p><p className="text-xs text-gray-400">₹{item.price||p.price} each</p></div>
                  </div>
                </div>
                <button onClick={() => removeItem(item._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl self-start"><Trash2 size={17}/></button>
              </div>
            )
          })}
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={shipping===0?'text-green-600 font-semibold':''}>{shipping===0?'FREE 🎉':`₹${shipping}`}</span></div>
              {couponDiscount > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>Coupon Discount</span><span>-₹{couponDiscount}</span></div>}
              <hr/><div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{finalTotal}</span></div>
            </div>
            {shipping > 0 && <p className="text-xs text-orange-500 mt-3 bg-orange-50 p-2 rounded-lg">Add ₹{499-subtotal} more for free delivery!</p>}
            <button onClick={() => navigate('/checkout', { state: { couponDiscount, coupon } })} className="btn-primary w-full mt-5">
              Proceed to Checkout <ArrowRight size={18}/>
            </button>
          </div>
          <div className="card p-4">
            <p className="font-semibold mb-3 flex items-center gap-2 text-sm"><Tag size={15}/>Apply Coupon</p>
            <div className="flex gap-2">
              <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} className="input py-2 text-sm flex-1" placeholder="COUPON CODE"/>
              <button onClick={applyCoupon} disabled={couponLoading} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-dark disabled:opacity-60">Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
