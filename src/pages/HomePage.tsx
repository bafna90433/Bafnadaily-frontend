import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Gift, Truck, Shield, Tag, Sparkles, Crown, Star, ShoppingBag, TrendingUp, Diamond, Watch, Award, HeartHandshake, Package, RotateCcw, ChevronRight } from 'lucide-react'
import { Product, Banner, Category } from '../types'
import api from '../utils/api'
import ProductCard from '../components/product/ProductCard'
import useSettingsStore from '../store/settingsStore'

const CATEGORIES = [
  { name: 'Keychains', slug: 'keychains', emoji: '🔑', bg: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { name: 'Women', slug: 'women-accessories', emoji: '👗', bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { name: 'Fashion', slug: 'fashion', emoji: '👜', bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { name: 'Beauty', slug: 'beauty', emoji: '💄', bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100' },
  { name: 'Gifts', slug: 'gifts', emoji: '🎁', bg: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { name: 'Cute Items', slug: 'cute-items', emoji: '💕', bg: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
]

const FEATURES = [
  { icon: Truck, title: 'Free Delivery', desc: 'Orders above ₹499' },
  { icon: Shield, title: 'Secure Pay', desc: 'COD & UPI available' },
  { icon: Gift, title: 'Gift Wrap', desc: 'At just ₹29 extra' },
  { icon: Zap, title: 'Fast Dispatch', desc: 'Ships in 24 hrs' },
]

const SkeletonCard = () => (
  <div className="card overflow-hidden">
    <div className="aspect-square skeleton" />
    <div className="p-3 space-y-2">
      <div className="h-3 skeleton rounded w-1/2" /><div className="h-4 skeleton rounded" />
      <div className="h-4 skeleton rounded w-3/4" /><div className="h-5 skeleton rounded w-1/3" />
    </div>
  </div>
)

interface SectionProps { title: string; products: Product[]; loading: boolean; viewAll: string }
const ProductSection: React.FC<SectionProps> = ({ title, products, loading, viewAll }) => (
  <section className="max-w-7xl mx-auto px-4 py-8">
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-2xl md:text-3xl font-heading font-bold">{title}</h2>
      <Link to={viewAll} className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRight size={15} /></Link>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
      {loading ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : products.map(p => <ProductCard key={p._id} product={p} />)}
    </div>
    {!loading && products.length === 0 && (
      <div className="text-center py-14 text-gray-400"><p className="text-4xl mb-3">🛍️</p><p>No products yet — add from admin panel</p></div>
    )}
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HERO LAYOUT 1 — Classic Split (Category Cards Right)
// ═══════════════════════════════════════════════════════════════════════════════
const HeroLayout1 = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50">
    <div className="max-w-7xl mx-auto px-4 py-14 md:py-24 flex flex-col md:flex-row items-center gap-10">
      <div className="flex-1 text-center md:text-left">
        <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-4 py-2 rounded-full mb-5">
          <Zap size={14} className="fill-primary" /> New Collection 2024
        </span>
        <h1 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 leading-tight mb-4">
          Trendy Gifts &<br /><span className="text-primary">Cute Accessories</span>
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto md:mx-0">
          Keychains, jewelry, fashion & gift items — starting at just <strong className="text-primary">₹99!</strong>
        </p>
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          <Link to="/products" className="btn-primary text-base px-8 py-4">Shop Now <ArrowRight size={18} /></Link>
          <Link to="/products?maxPrice=299" className="btn-outline text-base px-8 py-4"><Tag size={16} /> Under ₹299</Link>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 max-w-sm w-full">
        {CATEGORIES.slice(0, 4).map(cat => (
          <Link key={cat.slug} to={`/category/${cat.slug}`} className={`p-5 rounded-2xl border-2 text-center transition-all hover:-translate-y-1 hover:shadow-md ${cat.bg}`}>
            <div className="text-3xl mb-2">{cat.emoji}</div>
            <p className="text-sm font-bold text-gray-700">{cat.name}</p>
          </Link>
        ))}
      </div>
    </div>
    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full pointer-events-none" />
    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-100/40 rounded-full pointer-events-none" />
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HERO LAYOUT 2 — Full-Width Gradient with Floating Stats
// ═══════════════════════════════════════════════════════════════════════════════
const HeroLayout2 = () => (
  <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
    <div className="max-w-7xl mx-auto px-4 py-16 md:py-28 text-center relative z-10">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Crown size={18} className="text-amber-400" />
        <span className="text-amber-400 text-sm font-black uppercase tracking-[0.2em]">Premium Collection</span>
        <Crown size={18} className="text-amber-400" />
      </div>
      <h1 className="text-4xl md:text-7xl font-heading font-black text-white leading-tight mb-5">
        Your Style,<br /><span className="bg-gradient-to-r from-primary via-pink-400 to-purple-400 bg-clip-text text-transparent">Your Story</span>
      </h1>
      <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
        Discover handpicked accessories, unique gifts & trending fashion. Every item tells a story.
      </p>
      <div className="flex flex-wrap gap-4 justify-center mb-12">
        <Link to="/products" className="bg-primary text-white font-bold px-10 py-4 rounded-2xl text-base hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2">
          <ShoppingBag size={18} /> Explore Collection
        </Link>
        <Link to="/products?trending=true" className="bg-white/10 backdrop-blur text-white font-bold px-10 py-4 rounded-2xl text-base border border-white/20 hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2">
          <TrendingUp size={18} /> Trending Now
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
        {[
          { emoji: '🔑', label: 'Keychains', count: '500+' },
          { emoji: '💍', label: 'Accessories', count: '300+' },
          { emoji: '🎁', label: 'Gift Sets', count: '200+' },
          { emoji: '🔥', label: 'Trending', count: '100+' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
            <p className="text-2xl mb-1">{s.emoji}</p>
            <p className="text-white font-black text-lg">{s.count}</p>
            <p className="text-gray-400 text-xs font-semibold">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-900/20 rounded-full pointer-events-none" />
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-900/20 rounded-full pointer-events-none" />
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD — 2x8 CATEGORY GRID
// ═══════════════════════════════════════════════════════════════════════════════
const MainDashboard = ({ categories }: { categories: any[] }) => {
  const navigate = useNavigate()

  // Specific categories the user asked for
  const focusSlugs = ['belt', 'keychains', 'hand-bags', 'women-kit', 'men']

  // Create 16 slots
  const slots = Array(16).fill({ name: 'Coming Soon', emoji: '📦', soon: true })

  // Fill focus ones first if they exist in DB, otherwise use placeholder labels
  const focusMap: Record<string, string> = {
    'belt': 'BELT',
    'keychains': 'KEYCHAIN',
    'hand-bags': 'HAND BAG',
    'women-kit': 'WOMEN KIT',
    'men': 'MEN'
  }

  const items = slots.map((s, i) => {
    const slug = focusSlugs[i]
    if (slug) {
      const cat = categories.find(c => c.slug === slug || c.name.toLowerCase() === focusMap[slug].toLowerCase())
      if (cat) return { ...cat, soon: false }
      return { name: focusMap[slug], slug, emoji: '⚡', soon: false }
    }
    return s
  })

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {items.map((cat, i) => (
          <Link
            key={i}
            to={cat.soon ? '#' : `/category/${cat.slug}`}
            className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center p-6 transition-all duration-300 ${cat.soon
                ? 'bg-gray-50 border-gray-100 opacity-40 grayscale cursor-not-allowed'
                : 'bg-white border-primary/20 hover:border-primary hover:shadow-xl hover:-translate-y-1'
              }`}
          >
            <div className="text-4xl mb-3">{cat.emoji || (cat.soon ? '📦' : '✨')}</div>
            <p className="text-xs font-black text-gray-800 text-center uppercase tracking-wider">{cat.name}</p>
            {cat.soon && <span className="text-[8px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full mt-2 font-bold">SOON</span>}
          </Link>
        ))}
      </div>
    </section>
  )
}
const HeroLayout3 = () => (
  <section className="relative overflow-hidden bg-white">
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-100 text-primary text-xs font-black px-5 py-2 rounded-full mb-6 uppercase tracking-wider">
          <Sparkles size={14} /> Curated with Love
        </div>
        <h1 className="text-3xl md:text-5xl font-heading font-black text-gray-900 leading-tight mb-4">
          Discover <span className="text-primary">Beautiful</span> Things
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-lg mx-auto mb-8">
          Handpicked gifts, accessories & fashion — brought to you with love & care ✨
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/products" className="btn-primary text-sm px-8 py-3.5">Shop All Products</Link>
          <Link to="/products?newArrival=true" className="btn-outline text-sm px-8 py-3.5 flex items-center gap-2"><Sparkles size={14} /> New Arrivals</Link>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden -mx-4 px-4 md:justify-center">
        {CATEGORIES.map(cat => (
          <Link key={cat.slug} to={`/category/${cat.slug}`}
            className="flex items-center gap-2.5 px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl flex-shrink-0 hover:border-primary/30 hover:bg-primary/5 transition-all group">
            <span className="text-xl">{cat.emoji}</span>
            <span className="text-sm font-bold text-gray-700 group-hover:text-primary whitespace-nowrap">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
    <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/3 rounded-full pointer-events-none" />
    <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-purple-50 rounded-full pointer-events-none" />
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURES BAR component (shared)
// ═══════════════════════════════════════════════════════════════════════════════
const FeaturesBar = () => (
  <section className="bg-white border-y border-gray-100">
    <div className="max-w-7xl mx-auto px-4 py-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0"><Icon size={20} className="text-primary" /></div>
            <div><p className="font-bold text-sm">{title}</p><p className="text-xs text-gray-500">{desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES SECTION component (shared)
// ═══════════════════════════════════════════════════════════════════════════════
const CategoriesSection = () => (
  <section className="max-w-7xl mx-auto px-4 py-10">
    <h2 className="text-2xl md:text-3xl font-heading font-bold mb-5">Shop by Category</h2>
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {CATEGORIES.map(cat => (
        <Link key={cat.slug} to={`/category/${cat.slug}`} className={`p-4 rounded-2xl border-2 text-center transition-all hover:shadow-md hover:-translate-y-1 ${cat.bg}`}>
          <div className="text-3xl mb-2">{cat.emoji}</div>
          <p className="text-xs font-bold text-gray-700">{cat.name}</p>
        </Link>
      ))}
    </div>
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// PROMO BANNERS component (shared)
// ═══════════════════════════════════════════════════════════════════════════════
const PromoBanners: React.FC<{ sec: any }> = ({ sec }) => (
  <section className="max-w-7xl mx-auto px-4 pb-4 grid md:grid-cols-2 gap-4">
    {sec.underPriceBanner !== false && (
      <Link to="/products?maxPrice=199" className="relative bg-gradient-to-r from-primary to-pink-400 rounded-3xl p-7 text-white overflow-hidden group hover:shadow-xl transition-shadow">
        <div className="relative z-10">
          <p className="text-sm font-semibold opacity-80 mb-1">Special Section</p>
          <h3 className="text-3xl font-heading font-bold mb-2">Under ₹199 🛍️</h3>
          <p className="text-white/80 text-sm mb-5">Trending items at micro prices</p>
          <span className="bg-white text-primary text-sm font-bold px-5 py-2 rounded-full inline-block">Shop Now →</span>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
      </Link>
    )}
    {sec.giftComboBanner !== false && (
      <Link to="/category/gifts" className="relative bg-gradient-to-r from-secondary to-amber-400 rounded-3xl p-7 text-white overflow-hidden group hover:shadow-xl transition-shadow">
        <div className="relative z-10">
          <p className="text-sm font-semibold opacity-80 mb-1">Most Popular</p>
          <h3 className="text-3xl font-heading font-bold mb-2">Gift Combos 🎁</h3>
          <p className="text-white/80 text-sm mb-5">Keychain + Earrings sets & more</p>
          <span className="bg-white text-secondary text-sm font-bold px-5 py-2 rounded-full inline-block">Explore →</span>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
      </Link>
    )}
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HERO LAYOUT 4 — Soft Pastel Boutique (Keychain & Women's Fashion)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Right-column banner card slider for Layout 4 ─────────────────────────────
const HeroBannerCard: React.FC<{ banners: Banner[]; mobile?: boolean }> = ({ banners, mobile }) => {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => setActive(i => (i + 1) % banners.length), 3500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [banners.length])

  return (
    <div className="relative w-full overflow-hidden bg-white"
      style={{ borderRadius: mobile ? '1rem' : '2rem', aspectRatio: mobile ? '16/7' : '21/9', boxShadow: mobile ? '0 4px 20px rgba(0,0,0,0.10)' : '0 24px 64px rgba(233,30,99,0.18), 0 8px 24px rgba(0,0,0,0.08)' }}>
      {/* Decorative ring */}
      {!mobile && (
        <div className="absolute inset-0 rounded-[2rem] pointer-events-none z-20"
          style={{ border: '1.5px solid rgba(233,30,99,0.15)' }} />
      )}

      {banners.map((bn, i) => (
        <Link key={bn._id} to={bn.link || '/products'}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {bn.image
            ? <img src={bn.image} alt={bn.title} className="w-full h-full" style={{ objectFit: mobile ? 'contain' : 'cover', objectPosition: 'center' }} />
            : <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#E91E63,#C77DFF)' }}>
              <p className="text-white font-black text-xl text-center px-6">{bn.title}</p>
            </div>
          }
          {/* Gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }} />
          {bn.title && (
            <div className="absolute bottom-5 left-5 right-5 z-10">
              <p className="text-white font-black text-base leading-snug drop-shadow-lg">{bn.title}</p>
              {bn.subtitle && <p className="text-white/75 text-xs mt-1">{bn.subtitle}</p>}
            </div>
          )}
        </Link>
      ))}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-5 flex gap-1.5 z-20">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${i === active ? 'bg-white w-5 h-1.5' : 'bg-white/50 w-1.5 h-1.5'}`} />
          ))}
        </div>
      )}

      {/* "Shop Now" pill */}
      <Link to={banners[active]?.link || '/products'}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-full backdrop-blur-sm"
        style={{ background: 'rgba(255,255,255,0.92)', color: '#E91E63', boxShadow: '0 2px 12px rgba(233,30,99,0.2)' }}>
        Shop <ArrowRight size={11} />
      </Link>
    </div>
  )
}

const HeroLayout4: React.FC<{ heroBanners: Banner[]; hangingBanners: Banner[] }> = ({ heroBanners, hangingBanners }) => (
  <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #fdf2ff 40%, #fff8f0 70%, #fefffe 100%)' }}>
    {/* Soft decorative blobs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.07) 0%, transparent 70%)' }} />
      <div className="absolute top-10 right-10 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(199,125,255,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,139,90,0.06) 0%, transparent 70%)' }} />
    </div>
    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(233,30,99,0.25), rgba(199,125,255,0.25), transparent)' }} />

    {/* Mobile only: full-width landscape banner */}
    {heroBanners.length > 0 && (
      <div className="block lg:hidden w-full relative z-10 px-3 pt-3 pb-1">
        <HeroBannerCard banners={heroBanners} mobile />
      </div>
    )}

    {/* Desktop: split layout — text left, banner right */}
    <div className="hidden lg:flex w-full px-14 xl:px-24 py-12 relative z-10 items-stretch" style={{ minHeight: '60vh' }}>
      <div className="w-full flex flex-row items-stretch gap-16">

        {/* Left Column — Hanging Keychains (up to 6) */}
        <div className="flex-1 flex flex-row items-start justify-center gap-4 overflow-visible" style={{ alignSelf: 'stretch', marginTop: '-45px' }}>
          <style>{`
            @keyframes sway-hero { 0%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} 100%{transform:rotate(-6deg)} }
            .hero-kc { transform-origin: top center; }
            .hero-kc:nth-child(odd)  { animation: sway-hero 3.2s ease-in-out infinite; }
            .hero-kc:nth-child(even) { animation: sway-hero 3.2s ease-in-out infinite 0.7s; }
            .hero-kc:nth-child(3n)   { animation: sway-hero 3.2s ease-in-out infinite 1.4s; }
          `}</style>
          {hangingBanners.slice(0, 6).map((b, i) => (
            <a key={i} href={b.link || '/products'} className="hero-kc flex flex-col items-center" style={{ textDecoration: 'none', flexShrink: 0 }}>
              {/* Rope string (Fine-tuned length) */}
              <div style={{ width: '2px', height: '45px', background: 'linear-gradient(180deg,#f43f8e,#e879a0)', borderRadius: '1px' }} />
              {/* Metal ring */}
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #9ca3af', background: 'transparent', marginBottom: '-3px', zIndex: 2 }} />
              {/* Image card */}
              <div style={{ background: 'white', padding: '5px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(244,63,142,0.18)', border: '2px solid rgba(244,63,142,0.12)' }}>
                <img src={b.image} alt={b.title || 'keychain'} style={{ width: '100px', height: '150px', borderRadius: '15px', objectFit: 'cover', display: 'block' }} />
                {b.title && (
                  <div style={{ marginTop: '6px', background: 'linear-gradient(135deg,#f43f8e,#ec4899)', borderRadius: '12px', padding: '4px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(244,63,142,0.3)' }}>
                    <span style={{ color: 'white', fontSize: '11px', fontWeight: 900, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{b.title}</span>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>

        {/* Right Column — Banner */}
        {heroBanners.length > 0 && (
          <div className="flex-[1.5] flex flex-col justify-center">
            <HeroBannerCard banners={heroBanners} />
          </div>
        )}

      </div>
    </div>
  </section>
)

// ── Full-Width Product Section (Layout 4) ────────────────────────────────────
const FullWidthProductSection: React.FC<SectionProps> = ({ title, products, loading, viewAll }) => (
  <section className="px-6 md:px-14 lg:px-24 py-14">
    {/* Section header with gradient accent */}
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-heading font-black text-gray-900 leading-tight">{title}</h2>
        <div className="h-1 w-16 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, #E91E63, #C77DFF)' }} />
      </div>
      <Link to={viewAll}
        className="inline-flex items-center gap-2 text-xs font-bold text-primary border border-primary/20 bg-primary/5 px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all duration-200">
        View All <ArrowRight size={13} />
      </Link>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {loading ? Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />) : products.map(p => <ProductCard key={p._id} product={p} />)}
    </div>
    {!loading && products.length === 0 && (
      <div className="text-center py-16 text-gray-400"><p className="text-5xl mb-4">🛍️</p><p className="font-medium">No products yet — add from admin panel</p></div>
    )}
  </section>
)

// ── Full-Width Features Bar (Layout 4) ───────────────────────────────────────
const FullWidthFeaturesBar = () => (
  <div style={{ background: 'linear-gradient(90deg,#fff0f6,#fdf2ff,#fff0f6)', borderTop: '1px solid rgba(233,30,99,0.1)', borderBottom: '1px solid rgba(233,30,99,0.1)' }}>
    <div className="px-6 md:px-14 lg:px-24 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { Icon: Truck, title: 'Free Delivery', desc: 'Orders above ₹499', color: '#E91E63' },
          { Icon: Shield, title: 'Secure Payment', desc: 'COD & UPI available', color: '#9C27B0' },
          { Icon: Package, title: 'Gift Wrapping', desc: 'At just ₹29 extra', color: '#FF9800' },
          { Icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free', color: '#E91E63' },
        ].map(({ Icon, title, desc, color }) => (
          <div key={title} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3" style={{ boxShadow: '0 2px 10px rgba(233,30,99,0.06)', border: '1px solid rgba(233,30,99,0.07)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-xs">{title}</p>
              <p className="text-gray-400 text-[11px]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ── Full-Width Categories (Layout 4) ─────────────────────────────────────────
const FullWidthCategories = () => (
  <section className="px-6 md:px-14 lg:px-24 py-12" style={{ background: 'linear-gradient(180deg,#fff 0%,#fff5fb 100%)' }}>
    <div className="flex items-end justify-between mb-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E91E63' }}>Browse Categories</p>
        <h2 className="text-2xl md:text-3xl font-heading font-black text-gray-900">Shop by Category</h2>
        <div className="h-1 w-14 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#E91E63,#C77DFF)' }} />
      </div>
    </div>
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {CATEGORIES.map((cat) => (
        <Link key={cat.slug} to={`/category/${cat.slug}`}
          className={`group rounded-2xl text-center p-4 border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${cat.bg}`}>
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{cat.emoji}</div>
          <p className="text-xs font-bold text-gray-700 group-hover:text-primary transition-colors">{cat.name}</p>
        </Link>
      ))}
    </div>
  </section>
)

// ── Full-Width Promo Banners (Layout 4) ───────────────────────────────────────
const FullWidthPromoBanners: React.FC<{ sec: any }> = ({ sec }) => (
  <section className="px-6 md:px-14 lg:px-24 pb-6 grid md:grid-cols-2 gap-6">
    {sec.underPriceBanner !== false && (
      <Link to="/products?maxPrice=199"
        className="relative rounded-3xl p-8 md:p-10 overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
        style={{ background: 'linear-gradient(135deg, #E91E63 0%, #FF6B9D 60%, #FF8FAB 100%)' }}>
        <div className="relative z-10">
          <span className="inline-block text-xs font-black text-white/70 uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full mb-4">Special Section</span>
          <h3 className="text-3xl md:text-4xl font-heading font-black text-white mb-2">Under ₹199</h3>
          <p className="text-white/70 text-sm mb-6">Trending items at micro prices — grab before they sell out!</p>
          <span className="inline-flex items-center gap-2 bg-white text-primary text-sm font-black px-6 py-2.5 rounded-full group-hover:gap-3 transition-all">
            Shop Now <ArrowRight size={14} />
          </span>
        </div>
        <div className="absolute -right-12 -top-12 w-52 h-52 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute right-8 -bottom-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute top-6 right-36 w-4 h-4 bg-white/20 rounded-full" />
      </Link>
    )}
    {sec.giftComboBanner !== false && (
      <Link to="/category/gifts"
        className="relative rounded-3xl p-8 md:p-10 overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
        style={{ background: 'linear-gradient(135deg, #FF9F43 0%, #FFBE76 60%, #FFC947 100%)' }}>
        <div className="relative z-10">
          <span className="inline-block text-xs font-black text-white/70 uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full mb-4">Most Popular</span>
          <h3 className="text-3xl md:text-4xl font-heading font-black text-white mb-2">Gift Combos</h3>
          <p className="text-white/70 text-sm mb-6">Keychain + Earrings sets & more — perfect for every occasion.</p>
          <span className="inline-flex items-center gap-2 bg-white text-amber-600 text-sm font-black px-6 py-2.5 rounded-full group-hover:gap-3 transition-all">
            Explore <ArrowRight size={14} />
          </span>
        </div>
        <div className="absolute -right-12 -top-12 w-52 h-52 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute right-8 -bottom-6 w-28 h-28 bg-white/10 rounded-full" />
      </Link>
    )}
  </section>
)

// ── Hanging Keychain Strip ────────────────────────────────────────────────────
const HangingStrip: React.FC<{ hangingBanners: Banner[] }> = ({ hangingBanners }) => {
  if (!hangingBanners.length) return null
  const items = [...hangingBanners, ...hangingBanners, ...hangingBanners, ...hangingBanners]
  return (
    <div className="w-full overflow-hidden border-y border-pink-100"
      style={{ background: 'linear-gradient(180deg,#fff0f6 0%,#ffffff 100%)', height: '150px' }}>
      <div className="marquee-track h-full items-end pb-3">
        {items.map((b, i) => (
          <div key={i} className="hang-item flex flex-col items-center mx-5" style={{ paddingTop: '6px' }}>
            {/* String */}
            <div style={{ width: '2px', height: '22px', background: 'linear-gradient(180deg,#f43f8e,#c084fc)', borderRadius: '1px' }} />
            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-lg"
              style={{ width: '80px', height: '80px', border: '2px solid rgba(233,30,99,0.18)' }}>
              <img src={b.image} alt={b.title || 'keychain'} className="w-full h-full object-cover" />
            </div>
            {/* Label */}
            {b.title && (
              <div style={{ marginTop: '4px', backgroundColor: '#f43f8e', borderRadius: '10px', padding: '2px 8px' }}>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: 900, letterSpacing: '0.3px' }}>{b.title}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pastel palette cycle for circles ─────────────────────────────────────────
const CIRCLE_PALETTES = [
  { bg: '#fce4ec', border: '#f48fb1' },
  { bg: '#f3e5f5', border: '#ce93d8' },
  { bg: '#fff3e0', border: '#ffcc80' },
  { bg: '#e8f5e9', border: '#a5d6a7' },
  { bg: '#e3f2fd', border: '#90caf9' },
  { bg: '#fff8e1', border: '#ffe082' },
  { bg: '#fce4ec', border: '#f48fb1' },
  { bg: '#f3e5f5', border: '#ce93d8' },
  { bg: '#fff3e0', border: '#ffcc80' },
  { bg: '#e8f5e9', border: '#a5d6a7' },
  { bg: '#e3f2fd', border: '#90caf9' },
  { bg: '#fff8e1', border: '#ffe082' },
]

// ── Horizontal Circle Categories (Layout 4) ──────────────────────────────────
const HorizontalCategoryScroll: React.FC<{ categories: Category[] }> = ({ categories }) => (
  <section className="px-6 md:px-14 lg:px-24 py-8">
    <div className="flex items-center justify-between mb-5">
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#E91E63' }}>Browse</p>
        <h2 className="text-xl md:text-2xl font-heading font-black text-gray-900">Shop by Category</h2>
      </div>
      <Link to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-full transition-all"
        style={{ background: 'rgba(233,30,99,0.07)', border: '1.5px solid rgba(233,30,99,0.2)', color: '#E91E63' }}>
        View All <ArrowRight size={12} />
      </Link>
    </div>
    {/* Horizontal scroll row */}
    <div className="flex gap-7 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {categories.slice(0, 12).map((cat, i) => {
        const p = CIRCLE_PALETTES[i % CIRCLE_PALETTES.length]
        return (
          <Link key={cat._id} to={`/category/${cat.slug}`}
            className="flex flex-col items-center gap-2.5 flex-shrink-0 group">
            {/* Circle */}
            <div className="w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
              style={{ background: p.bg, border: `2.5px solid ${p.border}` }}>
              {cat.image
                ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                : <span className="text-2xl md:text-5xl">{cat.icon || '🛍️'}</span>
              }
            </div>
            {/* Label */}
            <p className="text-xs md:text-sm font-bold text-gray-600 group-hover:text-primary transition-colors text-center" style={{ maxWidth: '70px' }}>{cat.name}</p>
          </Link>
        )
      })}
    </div>
  </section>
)

// ── Full-Width Bottom CTA (Layout 4) ─────────────────────────────────────────
const FullWidthBottomCTA = () => (
  <section className="px-6 md:px-14 lg:px-24 py-12">
    <div className="relative rounded-[2.5rem] overflow-hidden text-center px-8 py-14"
      style={{ background: 'linear-gradient(135deg,#FCE4EC 0%,#F3E5F5 40%,#FFF0F6 70%,#FCE4EC 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-14 -left-14 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle,rgba(233,30,99,0.1) 0%,transparent 70%)' }} />
        <div className="absolute -bottom-14 -right-14 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle,rgba(156,39,176,0.1) 0%,transparent 70%)' }} />
        <div className="absolute top-8 right-16 text-4xl opacity-25 select-none">🔑</div>
        <div className="absolute bottom-8 left-16 text-4xl opacity-20 select-none">👗</div>
        <div className="absolute top-1/2 -translate-y-1/2 left-8 text-3xl opacity-20 select-none">💕</div>
        <div className="absolute top-1/2 -translate-y-1/2 right-8 text-3xl opacity-20 select-none">✨</div>
      </div>
      <div className="relative z-10">
        <span className="inline-block text-xs font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-5" style={{ background: 'rgba(233,30,99,0.1)', color: '#E91E63', border: '1px solid rgba(233,30,99,0.2)' }}>💕 Youth Collection</span>
        <h2 className="font-heading font-black text-gray-900 mb-3" style={{ fontSize: 'clamp(1.8rem,4vw,3.5rem)', letterSpacing: '-0.02em' }}>
          Under ₹299 Store 🛍️
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto text-base leading-relaxed">
          Trendy keychains &amp; accessories that won't break your budget. Perfect for gifting!
        </p>
        <Link to="/products?maxPrice=299"
          className="inline-flex items-center gap-3 font-black px-10 py-3.5 rounded-2xl text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#E91E63,#C2185B)', boxShadow: '0 8px 28px rgba(233,30,99,0.3)' }}>
          <ShoppingBag size={17} /> Shop Under ₹299
        </Link>
      </div>
    </div>
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM CTA (shared)
// ═══════════════════════════════════════════════════════════════════════════════
const BottomCTA = () => (
  <section className="max-w-7xl mx-auto px-4 py-10">
    <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-3xl p-10 text-center text-white relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-sm font-semibold text-gray-400 mb-2">Youth Collection</p>
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">Under ₹299 Store 🛍️</h2>
        <p className="text-gray-400 mb-7 max-w-md mx-auto">Trendy items that won't break your budget. Perfect for gifting!</p>
        <Link to="/products?maxPrice=299" className="bg-primary text-white font-bold px-10 py-3.5 rounded-full hover:bg-primary-dark transition-colors inline-block shadow-lg shadow-primary/30">
          Shop Under ₹299
        </Link>
      </div>
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-900/30 rounded-full" />
    </div>
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const sec = settings.homepageSections
  const layout = settings.websiteLayout || settings.homeLayout || 4
  const [trending, setTrending] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [featured, setFeatured] = useState<Product[]>([])
  const [heroBanners, setHeroBanners] = useState<Banner[]>([])
  const [hangingBanners, setHangingBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch banners
    api.get('/banners?isActive=true').then(res => {
      const all: Banner[] = res.data.banners || []
      setHeroBanners(all.filter(b => b.type !== 'hanging' && b.isActive))
      setHangingBanners(all.filter(b => b.type === 'hanging' && b.showOnWebsite !== false))
    }).catch(() => { })

    // Fetch categories
    api.get('/categories?isActive=true&limit=12').then(res => {
      setCategories(res.data.categories || [])
    }).catch(() => { })

    Promise.all([
      api.get('/products?trending=true&limit=8'),
      api.get('/products?newArrival=true&limit=8'),
      api.get('/products?featured=true&limit=8'),
    ]).then(([t, n, f]) => {
      setTrending(t.data.products)
      setNewArrivals(n.data.products)
      setFeatured(f.data.products)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // ── Layout 5: Category Dashboard (New Default) ───────────────────────
  if (layout === 5 || !layout) return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white py-10 mb-8 border-b">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Bafnadaily" className="h-16 mb-4" onError={e => (e.target as any).src = 'https://placehold.co/200x60?text=Bafnadaily'} />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Premium Quality Wholesale Store</p>
        </div>
      </div>
      <MainDashboard categories={categories} />
      <BottomCTA />
    </div>
  )

  // ── Layout 1: Classic (default) ─────────────────────────────────────────
  if (layout === 1) return (
    <div>
      {sec.heroBanner !== false && <HeroLayout1 />}
      {sec.featuresBar !== false && <FeaturesBar />}
      {sec.categories !== false && <CategoriesSection />}
      {sec.promoBanners !== false && <PromoBanners sec={sec} />}
      {sec.trendingProducts !== false && <ProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true" />}
      {sec.newArrivals !== false && <ProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true" />}
      {sec.featuredProducts !== false && <ProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true" />}
      <BottomCTA />
    </div>
  )

  // ── Layout 2: Dark Premium Hero ─────────────────────────────────────────
  if (layout === 2) return (
    <div>
      {sec.heroBanner !== false && <HeroLayout2 />}
      {sec.featuresBar !== false && <FeaturesBar />}
      {sec.trendingProducts !== false && <ProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true" />}
      {sec.promoBanners !== false && <PromoBanners sec={sec} />}
      {sec.categories !== false && <CategoriesSection />}
      {sec.newArrivals !== false && <ProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true" />}
      {sec.featuredProducts !== false && <ProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true" />}
      <BottomCTA />
    </div>
  )

  // ── Layout 3: Minimalist Elegant ────────────────────────────────────────
  if (layout === 3) return (
    <div>
      {sec.heroBanner !== false && <HeroLayout3 />}
      {sec.featuresBar !== false && <FeaturesBar />}
      {sec.newArrivals !== false && <ProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true" />}
      {sec.categories !== false && <CategoriesSection />}
      {sec.featuredProducts !== false && <ProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true" />}
      {sec.promoBanners !== false && <PromoBanners sec={sec} />}
      {sec.trendingProducts !== false && <ProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true" />}
      <BottomCTA />
    </div>
  )

  // ── Layout 4: Full-Width Professional (default fallback) ───────────────
  return (
    <div>
      {sec.heroBanner !== false && <HeroLayout4 heroBanners={heroBanners} hangingBanners={hangingBanners} />}
      {sec.featuresBar !== false && <FullWidthFeaturesBar />}
      {sec.categories !== false && <HorizontalCategoryScroll categories={categories} />}
      {sec.newArrivals !== false && <FullWidthProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true" />}
      {sec.trendingProducts !== false && <FullWidthProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true" />}
      {sec.promoBanners !== false && <FullWidthPromoBanners sec={sec} />}
      {sec.featuredProducts !== false && <FullWidthProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true" />}
      <FullWidthBottomCTA />
    </div>
  )
}

export default HomePage
