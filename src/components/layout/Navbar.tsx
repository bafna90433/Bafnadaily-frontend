import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User, Menu, X, Package, LogOut, ChevronDown, ShoppingBag } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import useSettingsStore from '../../store/settingsStore'
import api from '../../utils/api'

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { count, getTotal } = useCartStore()
  const { total } = getTotal()
  const { settings } = useSettingsStore()
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
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
      setSearchQ('')
    }
  }

  const promoText = settings.promoText || `🚚 Free Delivery on orders above ₹${settings.freeShippingAbove || 499} | COD Available 🎁`

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-xl' : 'bg-white border-b border-gray-100'}`}>
      {/* ── Promo bar ── */}
      <div className="bg-primary text-white text-center text-[10px] md:text-xs py-1.5 font-bold tracking-widest uppercase">
        {promoText}
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 lg:h-20 gap-4">
          
          {/* ── Logo & Mobile Toggle ── */}
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                <span className="text-white font-black text-2xl leading-none">{(settings.siteName || 'Reteiler')[0].toUpperCase()}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-xl text-gray-900 leading-none">{settings.siteName || 'Reteiler'}</span>
                <span className="text-[10px] text-primary font-bold tracking-tighter uppercase">Official Store</span>
              </div>
            </Link>

            <div className="flex lg:hidden items-center gap-3">
              <Link to="/cart" className="relative p-2 text-gray-700">
                <ShoppingBag size={24} />
                {count > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">{count}</span>}
              </Link>
              <button className="p-2 text-gray-900" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>

          {/* ── Long Search Bar ── */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto w-full lg:px-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input 
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search for toys, gift, premium collection..."
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-gray-900 transition-all shadow-sm focus:shadow-md outline-none"
              />
              <button type="submit" className="absolute right-2 top-1.5 bottom-1.5 bg-primary text-white px-5 rounded-xl text-xs font-black shadow-sm hover:shadow-md active:scale-95 transition-all hidden md:block">
                SEARCH
              </button>
            </div>
          </form>

          {/* ── Actions (Desktop) ── */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/wishlist" className="flex flex-col items-center gap-1 text-gray-600 hover:text-primary transition-colors group">
              <div className="relative">
                <Heart size={24} className="group-hover:fill-primary transition-all" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Wishlist</span>
            </Link>

            <Link to="/cart" className="flex flex-col items-center gap-1 text-gray-600 hover:text-primary transition-colors group">
              <div className="relative">
                <ShoppingBag size={24} className="group-hover:scale-110 transition-transform" />
                {count > 0 && (
                  <span className="absolute -top-2 -right-3 px-1.5 py-0.5 bg-primary text-white text-[9px] rounded-full font-black min-w-[32px] text-center border-2 border-white shadow-sm">
                    ₹{total}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-primary transition-colors">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <User size={14} className="text-primary" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider max-w-[60px] truncate">{user.name.split(' ')[0]}</span>
                </button>
                <div className="absolute right-0 top-full pt-4 w-56 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all z-50">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                      <p className="font-black text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{user.phone}</p>
                    </div>
                    <div className="p-2">
                       <Link to="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 rounded-xl text-sm font-semibold text-gray-700 transition-colors"><User size={16} /> My Account</Link>
                       <Link to="/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 rounded-xl text-sm font-semibold text-gray-700 transition-colors"><Package size={16} /> My Orders</Link>
                       <Link to="/wishlist" className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 rounded-xl text-sm font-semibold text-gray-700 transition-colors"><Heart size={16} /> Wishlist</Link>
                       <div className="my-2 border-t border-gray-50" />
                       <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl text-sm font-semibold text-red-500 transition-colors text-left">
                         <LogOut size={16} /> Logout
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="bg-primary text-white py-2.5 px-6 rounded-2xl text-xs font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all">
                LOGIN
              </Link>
            )}
          </div>
        </div>
      </div>


      {/* ── Mobile Menu Overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[104px] bg-white z-50 animate-fade-in overflow-y-auto pb-20">
          <div className="px-4 py-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Shop by Category</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {categories.map((c) => (
                <Link key={c.slug} to={`/category/${c.slug}`}
                  className="p-4 bg-gray-50 rounded-2xl text-xs font-bold text-gray-800 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                  {c.name}
                </Link>
              ))}
            </div>
            
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Account Settings</p>
            <div className="space-y-2">
              {user ? (
                <>
                  <Link to="/profile" className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl text-sm font-bold text-gray-700"><User size={18} /> Profile</Link>
                  <Link to="/orders" className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl text-sm font-bold text-gray-700"><Package size={18} /> My Orders</Link>
                  <button onClick={logout} className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl text-sm font-bold text-red-500 w-full text-left"><LogOut size={18} /> Logout</button>
                </>
              ) : (
                <Link to="/login" className="bg-primary text-white p-4 rounded-2xl text-sm font-black text-center block shadow-lg shadow-primary/20">LOGIN / REGISTER</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
