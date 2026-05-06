import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import useSettingsStore from '../../store/settingsStore'

const FloatingCartBar: React.FC = () => {
  const { count, getTotal } = useCartStore()
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Hide on cart, checkout pages
  if (pathname === '/cart' || pathname === '/checkout') return null
  if (count === 0) return null

  const { subtotal, shipping } = getTotal()
  const freeShippingAbove = settings.freeShippingAbove || 499
  const actualShipping = subtotal >= freeShippingAbove ? 0 : (settings.standardShippingCharge || 49)
  const total = subtotal + actualShipping
  const remaining = freeShippingAbove - subtotal

  const handleClick = () => {
    navigate(user ? '/checkout' : '/login')
  }

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 bg-white border border-gray-200 shadow-xl rounded-2xl px-5 py-3 items-center gap-4 animate-pulse-once">
      <div className="relative flex-shrink-0">
        <ShoppingBag size={22} className="text-primary" />
        <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none animate-bounce">{count}</span>
      </div>
      <div className="leading-none">
        <p className="text-[11px] text-gray-400 mb-1">TOTAL</p>
        <p className="text-base font-bold text-gray-900">₹{total}</p>
      </div>
      <button onClick={handleClick} className="btn-primary px-5 py-2 text-sm font-bold rounded-xl">
        {user ? 'Checkout →' : 'Login →'}
      </button>
    </div>
  )
}

export default FloatingCartBar
