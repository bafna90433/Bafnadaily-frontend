import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User, Menu, X, Package, LogOut, ChevronDown } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import useSettingsStore from '../../store/settingsStore'
import api from '../../utils/api'

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { count } = useCartStore()
  const { settings } = useSettingsStore()
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    api.get('/categories').then(res => {
      if (res.data.success) setCategories(res.data.categories)
    }).catch(() => {})
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`)
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  const promoText = settings.promoText || `🚚 Free Delivery on orders above ₹${settings.freeShippingAbove || 499} | COD Available 🎁`

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-white border-b border-gray-100'}`}>
      {/* Promo bar */}
      <div className="bg-primary text-white text-center text-xs py-1.5 font-medium tracking-wide">
        {promoText}
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl leading-none">{(settings.siteName || 'Reteiler')[0].toUpperCase()}</span>
            </div>
            <span className="font-heading font-bold text-xl text-gray-900">{settings.siteName || 'Reteiler'}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {categories.slice(0, 7).map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`}
                className="text-sm font-medium text-gray-600 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors">
                {c.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search products..." className="input w-44 py-2 text-sm" />
                <button type="button" onClick={() => setSearchOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={18} /></button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search size={20} className="text-gray-600" />
              </button>
            )}

            <Link to="/wishlist" className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart size={20} className="text-gray-600" />
            </Link>

            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart size={20} className="text-gray-600" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group hidden md:block">
                <button className="flex items-center gap-2 pl-2 pr-3 py-2 hover:bg-gray-100 rounded-full transition-colors">
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-400">+91 {user.phone}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><User size={15} /> My Profile</Link>
                  <Link to="/orders" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><Package size={15} /> My Orders</Link>
                  <Link to="/wishlist" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><Heart size={15} /> Wishlist</Link>
                  <hr className="my-1" />
                  <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-sm text-red-500">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-5 text-sm hidden md:flex">Login</Link>
            )}

            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-full" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 shadow-lg">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {categories.map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`}
                className="p-3 bg-gray-50 rounded-xl text-xs font-semibold text-center hover:bg-primary/10 hover:text-primary transition-colors">
                {c.name}
              </Link>
            ))}
          </div>
          {user ? (
            <div className="border-t border-gray-100 pt-3 space-y-1">
              <Link to="/profile" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl text-sm"><User size={16} /> Profile</Link>
              <Link to="/orders" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl text-sm"><Package size={16} /> Orders</Link>
              <button onClick={logout} className="flex items-center gap-2 p-2 hover:bg-red-50 rounded-xl text-sm text-red-500 w-full"><LogOut size={16} /> Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary w-full text-sm">Login / Register</Link>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar
