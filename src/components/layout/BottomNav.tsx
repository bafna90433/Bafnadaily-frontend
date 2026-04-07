import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react'
import useCartStore from '../../store/cartStore'

const BottomNav: React.FC = () => {
  const { pathname } = useLocation()
  const { count } = useCartStore()

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: count },
    { to: '/wishlist', icon: Heart, label: 'Wishlist' },
    { to: '/profile', icon: User, label: 'Me' },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 lg:hidden z-40 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-1">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5 px-3 py-1 relative">
              <div className="relative">
                <Icon size={22} className={active ? 'text-primary' : 'text-gray-400'} />
                {(badge ?? 0) > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {(badge ?? 0) > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
