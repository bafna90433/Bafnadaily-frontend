import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react'
import useCartStore from '../../store/cartStore'

const BottomNav: React.FC = () => {
  const { pathname } = useLocation()
  const { count, getTotal } = useCartStore()
  const { total } = getTotal()

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: total > 0 ? `₹${total}` : null },
    { to: '/wishlist', icon: Heart, label: 'Wishlist' },
    { to: '/profile', icon: User, label: 'Me' },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 lg:hidden z-40 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around py-2 px-1">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to
          const isCart = to === '/cart'
          const shouldFloat = isCart && count > 0 && !active

          return (
            <Link 
              key={to} 
              to={to} 
              className={`flex flex-col items-center gap-0.5 px-3 py-1 relative transition-all duration-300 ${
                shouldFloat ? 'translate-y-[-20px]' : ''
              }`}
            >
              <div className={`relative p-2 rounded-full transition-all duration-500 ${
                shouldFloat 
                  ? 'bg-primary text-white shadow-lg scale-110 animate-pulse' 
                  : active ? 'text-primary' : 'text-gray-400'
              }`}>
                <Icon size={shouldFloat ? 26 : 22} />
                {badge && (
                  <span className={`absolute ${shouldFloat ? '-top-1 -right-4' : '-top-1 -right-2'} px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full border-2 border-white flex items-center justify-center font-black whitespace-nowrap shadow-sm`}>
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 transition-colors ${
                active ? 'text-primary' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
