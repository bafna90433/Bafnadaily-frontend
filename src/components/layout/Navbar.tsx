import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, ShoppingCart, Heart, User, Menu, X, Package,
  LogOut, ChevronDown, ShoppingBag, TrendingUp, ChevronRight,
  Zap, Gift, Sparkles, Crown, ArrowLeft,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import useSettingsStore from '../../store/settingsStore'
import api from '../../utils/api'

// ── Highlight matching text ─────────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-transparent text-primary font-black not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

const FIXED_TAGS = ['All Products', 'Under ₹99', 'Under ₹49', 'Deals of Day']

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { count, getTotal } = useCartStore()
  const { total } = getTotal()
  const { settings } = useSettingsStore()
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSugg, setLoadingSugg] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    setFocused(false)
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handler, { passive: true })
    api.get('/categories').then(res => {
      if (res.data.success) setCategories(res.data.categories)
    }).catch(() => { })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setLoadingSugg(true)
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(q)}&limit=7`)
      setSuggestions(res.data.products || [])
    } catch { setSuggestions([]) }
    finally { setLoadingSugg(false) }
  }, [])

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQ(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 280)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`)
      setSearchQ(''); setFocused(false); setSuggestions([])
    }
  }

  const goToProduct = (slug: string) => {
    navigate(`/product/${slug}`)
    setSearchQ(''); setFocused(false); setSuggestions([])
  }

  const handleTagClick = (tag: string) => {
    if (tag === 'All Products') navigate('/products')
    else if (tag === 'Under ₹99') navigate('/products?maxPrice=99')
    else if (tag === 'Under ₹49') navigate('/products?maxPrice=49')
    else if (tag === 'Deals of Day') navigate('/products?featured=true')
    else {
      const cat = categories.find(c => c.name.toLowerCase() === tag.toLowerCase())
      if (cat) navigate(`/category/${cat.slug}`)
      else navigate(`/search?q=${encodeURIComponent(tag)}`)
    }
    setFocused(false); setSearchQ('')
  }

  const trendingTags = [FIXED_TAGS[0], ...categories.slice(0, 5).map(c => c.name), ...FIXED_TAGS.slice(1)]
  const promoText = settings.promoText || `✨ Free Delivery on orders above ₹${settings.freeShippingAbove || 499} · COD Available · Gift Wrap at ₹29`
  const siteName = settings.siteName || 'Bafna Daily'

  return (
    <header className="sticky top-0 z-50">

      {/* ── Promo Bar — Desktop only ── */}
      <div className="hidden lg:block" style={{ background: 'linear-gradient(90deg, #C2185B, #E91E63, #AD1457)' }}>
        <div className="px-4 py-2 text-center overflow-hidden relative">
          <p className="text-white/80 text-[11px] font-semibold tracking-widest uppercase whitespace-nowrap">
            {promoText}
          </p>
        </div>
      </div>

      {/* ── Main Header Container ── */}
      <div className={`transition-all duration-500 ${scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-white/20'
          : 'bg-white border-b border-gray-100'
        }`}>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-10">

          {/* ── TOP LEVEL (Desktop & Mobile) ── */}
          <div className={`flex flex-col lg:flex-row lg:items-center lg:py-2 lg:gap-0 transition-all duration-300 ${pathname === '/' ? 'py-2 gap-2' : 'py-1.5 gap-0'}`}>

            {/* Logo & Mobile Actions — mobile pe sirf homepage pe dikhao */}
            <div className={`flex items-center justify-between lg:w-[250px] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
              pathname === '/' ? 'max-h-24 opacity-100 mb-0' : 'max-h-0 opacity-0 mb-0 lg:max-h-24 lg:opacity-100'
            }`}>
              {/* Logo */}
              <Link to="/" className="flex items-center group transition-transform active:scale-95">
                {settings.siteLogo ? (
                  <img 
                    src={settings.siteLogo} 
                    alt={siteName} 
                    className="h-10 lg:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-primary to-primary-dark">
                      <span className="text-white font-black text-lg">{siteName[0].toUpperCase()}</span>
                    </div>
                    <div className="hidden sm:flex flex-col leading-none">
                      <span className="font-heading font-black text-gray-900 text-lg tracking-tight">{siteName}</span>
                      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-primary/70">Official Store</span>
                    </div>
                  </div>
                )}
              </Link>

              {/* Mobile Actions (Visible only on mobile top-row) */}
              <div className="flex lg:hidden items-center gap-2">
                <button onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors bg-gray-50 border border-gray-100">
                  {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>

            {/* Desktop Center: Redesigned Search Pill */}
            <div ref={searchRef} className="flex-1 lg:max-w-xl mx-auto w-full relative group flex items-center gap-2">
              {/* Back button — mobile only, non-home pages */}
              {pathname !== '/' && (
                <button
                  onClick={() => navigate(-1)}
                  className="lg:hidden flex-shrink-0 p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 active:scale-95 transition-all"
                >
                  <ArrowLeft size={19} />
                </button>
              )}
              <form onSubmit={handleSearch} className="flex-1 relative">
                <div className={`relative flex items-center rounded-2xl border transition-all duration-300 ${focused
                    ? 'border-primary shadow-[0_10px_30px_rgba(233,30,99,0.1)] bg-white'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 hover:shadow-md'
                  }`}>
                  <Search size={18} className={`ml-4 transition-colors duration-300 ${focused ? 'text-primary' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={onSearchChange}
                    onFocus={() => setFocused(true)}
                    placeholder="Search products, gifts, accessories…"
                    className="flex-1 bg-transparent py-2 lg:py-2.5 px-3 text-sm font-semibold text-gray-800 placeholder:text-gray-400 outline-none"
                  />
                  <button type="submit"
                    className="m-1 text-white text-xs font-black px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                    style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)' }}>
                    Search
                  </button>
                </div>
              </form>

              {/* Dropdown with high-end feel */}
              {focused && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  {searchQ.length === 0 ? (
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={14} className="text-primary" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Popular Right Now</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trendingTags.map((tag, i) => (
                          <button key={i} onMouseDown={() => handleTagClick(tag)}
                            className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-[11px] font-bold text-gray-600 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {loadingSugg && (
                        <div className="flex items-center gap-3 px-6 py-5 text-sm text-gray-400"><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />Searching store…</div>
                      )}
                      {!loadingSugg && suggestions.length === 0 && (
                        <div className="px-6 py-8 text-center">
                          <p className="text-3xl mb-3 opacity-50">🔍</p>
                          <p className="text-sm font-medium text-gray-500">No products found for "<span className="font-bold text-gray-700">{searchQ}</span>"</p>
                          <button
                            onMouseDown={() => { navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`); setSearchQ(''); setFocused(false) }}
                            className="mt-3 text-xs text-primary font-bold hover:underline"
                          >
                            View all results →
                          </button>
                        </div>
                      )}
                      {suggestions.map(product => (
                        <button key={product._id} onMouseDown={() => goToProduct(product.slug)}
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group/item">
                          <div className="w-12 h-12 rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm transition-transform group-hover/item:scale-110 flex-shrink-0">
                            {product.images?.[0]?.url ? <img src={product.images[0].url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate"><HighlightText text={product.name} query={searchQ} /></p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">₹{product.price}</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:translate-x-1" />
                        </button>
                      ))}
                      {suggestions.length > 0 && (
                        <button
                          onMouseDown={() => { navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`); setSearchQ(''); setFocused(false); setSuggestions([]) }}
                          className="w-full py-3 text-xs font-black text-primary hover:bg-primary/5 transition-colors text-center border-t border-gray-50"
                        >
                          See all results for "{searchQ}" →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Action Icons */}
            <div className="hidden lg:flex items-center gap-2 lg:w-[250px] justify-end flex-shrink-0">
              <Link to="/wishlist" className="p-3 rounded-2xl text-gray-500 hover:text-primary hover:bg-primary/5 transition-all group relative">
                <Heart size={21} className="group-hover:fill-primary transition-all" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              {/* Enhanced Cart */}
              <Link to="/cart"
                className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 group overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)' }}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <ShoppingBag size={21} className="text-white transition-transform group-hover:rotate-12" />
                  {count > 0 && (
                    <span className="absolute -top-3.5 -right-3.5 w-5 h-5 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-primary/20 pt-0.5">
                      {count}
                    </span>
                  )}
                </div>
                <div className="flex flex-col leading-tight relative">
                  <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Cart</span>
                  <span className="text-white font-black text-sm">{count > 0 ? `₹${total}` : 'Empty'}</span>
                </div>
              </Link>

              {/* User Account */}
              {user ? (
                <div className="relative group ml-1">
                  <button className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-inner"
                      style={{ background: 'linear-gradient(135deg, #8E2DE2, #4A00E0)' }}>
                      {user.name[0].toUpperCase()}
                    </div>
                    <ChevronDown size={14} className="text-gray-400 group-hover:rotate-180 transition-transform mr-1" />
                  </button>
                  <div className="absolute right-0 top-full pt-3 w-56 opacity-0 translate-y-3 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-300 z-50">
                    <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="font-black text-gray-900 text-sm truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">{user.phone}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link to="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 hover:text-primary rounded-xl text-sm font-bold text-gray-700 transition-colors"><User size={16} /> Dashboard</Link>
                        <Link to="/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 hover:text-primary rounded-xl text-sm font-bold text-gray-700 transition-colors"><Package size={16} /> My Orders</Link>
                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-500 rounded-xl text-sm font-bold transition-colors text-left"><LogOut size={16} /> Sign Out</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="ml-2 px-6 py-3 rounded-2xl text-xs font-black text-white shadow-lg bg-gray-900 border-2 border-gray-900 hover:bg-transparent hover:text-gray-900 transition-all active:scale-95">
                  Sign In
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile Menu Overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 overflow-y-auto" style={{ top: '72px' }}>
          <div className="px-4 py-5 pb-24">

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { to: '/products', label: '✨ All Products', bg: 'bg-primary/5 text-primary border-primary/15' },
                { to: '/products?trending=true', label: '🔥 Trending', bg: 'bg-orange-50 text-orange-600 border-orange-200' },
                { to: '/products?maxPrice=199', label: '⚡ Under ₹199', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
                { to: '/category/gifts', label: '🎁 Gift Sets', bg: 'bg-green-50 text-green-700 border-green-200' },
              ].map(q => (
                <Link key={q.to} to={q.to}
                  className={`p-3 rounded-xl border text-xs font-bold text-center ${q.bg}`}>
                  {q.label}
                </Link>
              ))}
            </div>

            {/* Categories */}
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Categories</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {categories.map(c => (
                <Link key={c.slug} to={`/category/${c.slug}`}
                  className="p-3 bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary border border-transparent hover:border-primary/20 transition-all">
                  {c.name}
                </Link>
              ))}
            </div>

            {/* Account */}
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Account</p>
            <div className="space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, #fdf2f8, #f3e8ff)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
                      style={{ background: 'linear-gradient(135deg, #C77DFF, #7B2FBE)' }}>
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.phone}</p>
                    </div>
                  </div>
                  <Link to="/profile" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-sm font-semibold text-gray-700"><User size={17} /> My Profile</Link>
                  <Link to="/orders" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-sm font-semibold text-gray-700"><Package size={17} /> My Orders</Link>
                  <Link to="/wishlist" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-sm font-semibold text-gray-700"><Heart size={17} /> Wishlist</Link>
                  <button onClick={logout}
                    className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-sm font-bold text-red-500 w-full text-left">
                    <LogOut size={17} /> Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login"
                  className="block text-center p-4 rounded-2xl text-sm font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)' }}>
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
