import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, ShoppingCart, Heart, User, Menu, X, Package,
  LogOut, ChevronDown, ShoppingBag, TrendingUp, ChevronRight,
  Zap, Gift, Sparkles, Crown,
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

  useEffect(() => { setMobileOpen(false); setFocused(false) }, [pathname])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
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
    navigate(`/products/${slug}`)
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

      {/* ── Promo Bar ── */}
      <div style={{ background: 'linear-gradient(90deg, #C2185B, #E91E63, #AD1457)' }}>
        <div className="px-4 py-2 text-center overflow-hidden relative">
          <p className="text-white/80 text-[11px] font-semibold tracking-widest uppercase whitespace-nowrap">
            {promoText}
          </p>
        </div>
      </div>

      {/* ── Main Header ── */}
      <div className={`transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100'
          : 'bg-white border-b border-gray-100'
        }`}>
        <div className="max-w-full mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-4 lg:gap-8 h-16 lg:h-18">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)' }}
              >
                <span className="text-white font-black text-lg leading-none">{siteName[0].toUpperCase()}</span>
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-heading font-black text-gray-900 text-lg tracking-tight">{siteName}</span>
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-primary/70">Official Store</span>
              </div>
            </Link>

            {/* ── Search Bar ── */}
            <div ref={searchRef} className="flex-1 relative min-w-0">
              <form onSubmit={handleSearch}>
                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${focused
                    ? 'border-primary/40 shadow-md shadow-primary/10 bg-white'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                  <Search size={16} className={`ml-3 flex-shrink-0 transition-colors ${focused ? 'text-primary' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={onSearchChange}
                    onFocus={() => setFocused(true)}
                    placeholder="Search products, gifts, accessories…"
                    className="flex-1 bg-transparent py-2.5 px-3 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none min-w-0"
                  />
                  {searchQ && (
                    <button type="button" onClick={() => { setSearchQ(''); setSuggestions([]) }}
                      className="p-1 mr-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <X size={14} />
                    </button>
                  )}
                  <button type="submit"
                    className="m-1 flex-shrink-0 text-white text-xs font-black px-4 py-2 rounded-lg transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)' }}>
                    Search
                  </button>
                </div>
              </form>

              {/* ── Search Dropdown ── */}
              {focused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {searchQ.length === 0 ? (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={13} className="text-primary" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trending Searches</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trendingTags.map((tag, i) => (
                          <button key={i} onMouseDown={() => handleTagClick(tag)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all">
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {loadingSugg && (
                        <div className="flex items-center gap-3 px-5 py-4 text-sm text-gray-400">
                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          Searching…
                        </div>
                      )}
                      {!loadingSugg && suggestions.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">
                          <p className="text-2xl mb-2">🔍</p>
                          No results for "{searchQ}"
                        </div>
                      )}
                      {suggestions.map(product => (
                        <button key={product._id} onMouseDown={() => goToProduct(product.slug)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                            {product.images?.[0]?.url
                              ? <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-base">📦</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              <HighlightText text={product.name} query={searchQ} />
                            </p>
                            {product.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-black text-primary">₹{product.price}</span>
                            <ChevronRight size={13} className="text-gray-300" />
                          </div>
                        </button>
                      ))}
                      {suggestions.length > 0 && (
                        <button
                          onMouseDown={() => { navigate(`/search?q=${encodeURIComponent(searchQ)}`); setFocused(false); setSearchQ(''); setSuggestions([]) }}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-50 hover:bg-primary/5 text-primary text-xs font-black transition-colors border-t border-gray-100">
                          <Search size={13} /> View all results for "{searchQ}" <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Desktop Action Icons ── */}
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0">

              {/* Wishlist */}
              <Link to="/wishlist"
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-500 hover:text-primary hover:bg-primary/5 transition-all group">
                <Heart size={20} className="group-hover:fill-primary transition-all" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link to="/cart"
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)', boxShadow: '0 4px 14px rgba(233,30,99,0.25)' }}>
                <div className="relative">
                  <ShoppingBag size={18} className="text-white" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-white text-primary text-[9px] rounded-full flex items-center justify-center font-black border border-primary/20">
                      {count}
                    </span>
                  )}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-white/70 text-[9px] font-semibold">My Cart</span>
                  <span className="text-white font-black text-sm">{count > 0 ? `₹${total}` : 'Empty'}</span>
                </div>
              </Link>

              {/* User menu */}
              {user ? (
                <div className="relative group ml-1">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                      style={{ background: 'linear-gradient(135deg, #C77DFF, #7B2FBE)' }}>
                      {user.name[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col leading-none text-left">
                      <span className="text-[9px] text-gray-400 font-semibold">Hello,</span>
                      <span className="text-xs font-bold text-gray-800 max-w-[60px] truncate">{user.name.split(' ')[0]}</span>
                    </div>
                    <ChevronDown size={13} className="text-gray-400 group-hover:rotate-180 transition-transform duration-200" />
                  </button>
                  <div className="absolute right-0 top-full pt-3 w-56 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-50" style={{ background: 'linear-gradient(135deg, #fdf2f8, #f3e8ff)' }}>
                        <p className="font-black text-gray-900 text-sm truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{user.phone}</p>
                      </div>
                      <div className="p-1.5">
                        <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors"><User size={15} /> My Account</Link>
                        <Link to="/orders" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors"><Package size={15} /> My Orders</Link>
                        <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors"><Heart size={15} /> Wishlist</Link>
                        <div className="my-1 border-t border-gray-100" />
                        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-semibold text-red-500 transition-colors text-left">
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login"
                  className="ml-1 px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all active:scale-95 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)', boxShadow: '0 4px 14px rgba(233,30,99,0.2)' }}>
                  Sign In
                </Link>
              )}
            </div>

            {/* ── Mobile: Cart + Hamburger ── */}
            <div className="flex lg:hidden items-center gap-2 ml-auto flex-shrink-0">
              <Link to="/cart" className="relative p-2 rounded-xl text-gray-700">
                <ShoppingBag size={22} />
                {count > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-black">
                    {count}
                  </span>
                )}
              </Link>
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
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
