import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User, Menu, X, Package, LogOut, ChevronDown, ShoppingBag, TrendingUp, ChevronRight } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import useSettingsStore from '../../store/settingsStore'
import api from '../../utils/api'

// ── Highlight matching text ───────────────────────────────────────────────────
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

const FIXED_TAGS = ['ALL TOYS', 'UNDER ₹99', 'UNDER ₹49', 'DEALS OF THE DAY']

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
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    api.get('/categories').then(res => {
      if (res.data.success) setCategories(res.data.categories)
    }).catch(() => {})
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
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
    } catch {
      setSuggestions([])
    } finally {
      setLoadingSugg(false)
    }
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
      setSearchQ('')
      setFocused(false)
      setSuggestions([])
    }
  }

  const goToProduct = (slug: string) => {
    navigate(`/products/${slug}`)
    setSearchQ('')
    setFocused(false)
    setSuggestions([])
  }

  const handleTagClick = (tag: string) => {
    if (tag === 'ALL TOYS') { navigate('/products'); }
    else if (tag === 'UNDER ₹99') { navigate('/products?maxPrice=99'); }
    else if (tag === 'UNDER ₹49') { navigate('/products?maxPrice=49'); }
    else if (tag === 'DEALS OF THE DAY') { navigate('/products?featured=true'); }
    else {
      const cat = categories.find(c => c.name.toUpperCase() === tag)
      if (cat) navigate(`/category/${cat.slug}`)
      else navigate(`/search?q=${encodeURIComponent(tag)}`)
    }
    setFocused(false)
    setSearchQ('')
  }

  const trendingTags = [
    FIXED_TAGS[0],
    ...categories.slice(0, 5).map(c => c.name.toUpperCase()),
    ...FIXED_TAGS.slice(1),
  ]

  const showDropdown = focused
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

          {/* ── Search Bar with Autocomplete ── */}
          <div ref={searchRef} className="flex-1 max-w-2xl mx-auto w-full lg:px-8 relative">
            <form onSubmit={handleSearch}>
              <div className={`relative transition-all duration-200 ${focused ? 'ring-2 ring-primary/30 rounded-2xl' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className={`transition-colors ${focused ? 'text-primary' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  value={searchQ}
                  onChange={onSearchChange}
                  onFocus={() => setFocused(true)}
                  placeholder="Search for toys, gift, premium collection..."
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-3 pl-12 pr-28 text-sm font-medium text-gray-900 transition-all shadow-sm focus:shadow-md outline-none"
                />
                {searchQ && (
                  <button type="button" onClick={() => { setSearchQ(''); setSuggestions([]) }}
                    className="absolute right-[88px] top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
                <button type="submit" className="absolute right-2 top-1.5 bottom-1.5 bg-primary text-white px-5 rounded-xl text-xs font-black shadow-sm hover:shadow-md active:scale-95 transition-all">
                  SEARCH
                </button>
              </div>
            </form>

            {/* ── Dropdown ── */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">

                {searchQ.length === 0 ? (
                  /* Trending tags */
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={15} className="text-primary" />
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Trending Now</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingTags.map((tag, i) => (
                        <button key={i} onMouseDown={() => handleTagClick(tag)}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-gray-700 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all">
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Suggestions */
                  <div>
                    {loadingSugg && (
                      <div className="flex items-center gap-3 px-5 py-4 text-sm text-gray-400">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Searching...
                      </div>
                    )}

                    {!loadingSugg && suggestions.length === 0 && (
                      <div className="px-5 py-6 text-center text-sm text-gray-400">
                        <p className="text-2xl mb-2">🔍</p>
                        No results for "{searchQ}"
                      </div>
                    )}

                    {suggestions.map(product => (
                      <button
                        key={product._id}
                        onMouseDown={() => goToProduct(product.slug)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        {/* Image */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                          {product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            <HighlightText text={product.name} query={searchQ} />
                          </p>
                          {product.sku && (
                            <p className="text-xs text-gray-400 font-medium mt-0.5">SKU: {product.sku}</p>
                          )}
                        </div>

                        {/* Price + arrow */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-black text-primary">₹{product.price}</span>
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      </button>
                    ))}

                    {suggestions.length > 0 && (
                      <button
                        onMouseDown={() => { navigate(`/search?q=${encodeURIComponent(searchQ)}`); setFocused(false); setSearchQ(''); setSuggestions([]) }}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-black transition-colors border-t border-primary/10"
                      >
                        <Search size={14} />
                        View all results for "{searchQ}"
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
