import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useSettingsStore from '../../store/settingsStore'
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react'
import useCartStore from '../../store/cartStore'

const BottomNav: React.FC = () => {
  const { pathname } = useLocation()
  const { count, getTotal, hasNewItem } = useCartStore()
  const { total } = getTotal()
  const { settings } = useSettingsStore()

  if (pathname.startsWith('/product/')) return null

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/wishlist', icon: Heart, label: 'Wishlist' },
    { 
      type: 'whatsapp', 
      icon: ShoppingBag, // Placeholder for icon but logic is different
      label: 'Help',
      href: `https://wa.me/91${settings.whatsappNumber || '7550350036'}?text=${encodeURIComponent('Hello Bafnadaily, I need help with...')}`
    },
    { to: '/cart', icon: ShoppingBag, label: 'Cart', badge: total > 0 ? `₹${total}` : null },
    { to: '/profile', icon: User, label: 'Me' },
  ]

  return (
    <nav className="fixed bottom-4 inset-x-4 bg-white/80 backdrop-blur-xl border border-white/20 lg:hidden z-40 safe-area-bottom shadow-[0_10px_40px_rgba(0,0,0,0.12)] rounded-[2.5rem]">
      <div className="flex items-center justify-between py-2.5 px-3">
        {links.map((link, i) => {
          if (link.type === 'whatsapp') {
            return (
              <a key={i} href={link.href} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-green-500 shadow-lg shadow-green-500/30 flex items-center justify-center text-white transition-transform active:scale-90">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.112.553 4.184 1.597 6.011L0 24l6.135-1.61a11.747 11.747 0 005.91 1.586h.005c6.635 0 12.032-5.396 12.035-12.032a11.76 11.76 0 00-3.489-8.452z" />
                  </svg>
                </div>
              </a>
            )
          }
          
          const active = pathname === link.to
          const isCart = link.to === '/cart'
          // Raise if it's a new item (any page) OR if on Home and cart is not empty
          const shouldRaise = isCart && (hasNewItem || (pathname === '/' && count > 0))
          const Icon = link.icon!
          
          return (
            <Link key={i} to={link.to!}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 relative transition-all duration-500 ${active ? 'text-primary' : 'text-gray-400'} ${shouldRaise ? '-translate-y-5 shadow-inner' : ''}`}>
              
              <div className={`
                relative transition-all duration-500
                ${isCart && hasNewItem ? 'animate-cart-pulse' : ''}
                ${shouldRaise ? 'w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center -mt-3' : ''}
              `}>
                <Icon size={shouldRaise ? 26 : 22} className={`transition-all duration-500 ${active ? 'scale-110' : ''}`} />
                {link.badge && (
                  <span className={`absolute -top-2 -right-3 px-1.5 py-0.5 rounded-full border-2 border-white font-black shadow-sm ${shouldRaise ? 'bg-white text-primary text-[9px]' : 'bg-red-500 text-white text-[8px]'}`}>
                    {link.badge}
                  </span>
                )}
              </div>

              {!shouldRaise && (
                <span className="text-[9px] font-black uppercase tracking-wider">{link.label}</span>
              )}
              
              {active && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(233,30,99,0.8)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
