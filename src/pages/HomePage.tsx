import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Gift, Truck, Shield, Tag, Sparkles, Crown, Star, ShoppingBag, TrendingUp } from 'lucide-react'
import { Product } from '../types'
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
      <Link to={viewAll} className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRight size={15}/></Link>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
      {loading ? Array(8).fill(0).map((_,i) => <SkeletonCard key={i}/>) : products.map(p => <ProductCard key={p._id} product={p}/>)}
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
          <Zap size={14} className="fill-primary"/> New Collection 2024
        </span>
        <h1 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 leading-tight mb-4">
          Trendy Gifts &<br/><span className="text-primary">Cute Accessories</span>
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto md:mx-0">
          Keychains, jewelry, fashion & gift items — starting at just <strong className="text-primary">₹99!</strong>
        </p>
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          <Link to="/products" className="btn-primary text-base px-8 py-4">Shop Now <ArrowRight size={18}/></Link>
          <Link to="/products?maxPrice=299" className="btn-outline text-base px-8 py-4"><Tag size={16}/> Under ₹299</Link>
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
    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full pointer-events-none"/>
    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-100/40 rounded-full pointer-events-none"/>
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HERO LAYOUT 2 — Full-Width Gradient with Floating Stats
// ═══════════════════════════════════════════════════════════════════════════════
const HeroLayout2 = () => (
  <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
    <div className="max-w-7xl mx-auto px-4 py-16 md:py-28 text-center relative z-10">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Crown size={18} className="text-amber-400"/>
        <span className="text-amber-400 text-sm font-black uppercase tracking-[0.2em]">Premium Collection</span>
        <Crown size={18} className="text-amber-400"/>
      </div>
      <h1 className="text-4xl md:text-7xl font-heading font-black text-white leading-tight mb-5">
        Your Style,<br/><span className="bg-gradient-to-r from-primary via-pink-400 to-purple-400 bg-clip-text text-transparent">Your Story</span>
      </h1>
      <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
        Discover handpicked accessories, unique gifts & trending fashion. Every item tells a story.
      </p>
      <div className="flex flex-wrap gap-4 justify-center mb-12">
        <Link to="/products" className="bg-primary text-white font-bold px-10 py-4 rounded-2xl text-base hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2">
          <ShoppingBag size={18}/> Explore Collection
        </Link>
        <Link to="/products?trending=true" className="bg-white/10 backdrop-blur text-white font-bold px-10 py-4 rounded-2xl text-base border border-white/20 hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2">
          <TrendingUp size={18}/> Trending Now
        </Link>
      </div>
      {/* Floating stat cards */}
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
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none"/>
    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-900/20 rounded-full pointer-events-none"/>
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-900/20 rounded-full pointer-events-none"/>
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HERO LAYOUT 3 — Minimalist Elegant with Icon Grid
// ═══════════════════════════════════════════════════════════════════════════════
const HeroLayout3 = () => (
  <section className="relative overflow-hidden bg-white">
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-100 text-primary text-xs font-black px-5 py-2 rounded-full mb-6 uppercase tracking-wider">
          <Sparkles size={14}/> Curated with Love
        </div>
        <h1 className="text-3xl md:text-5xl font-heading font-black text-gray-900 leading-tight mb-4">
          Discover <span className="text-primary">Beautiful</span> Things
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-lg mx-auto mb-8">
          Handpicked gifts, accessories & fashion — brought to you with love & care ✨
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/products" className="btn-primary text-sm px-8 py-3.5">Shop All Products</Link>
          <Link to="/products?newArrival=true" className="btn-outline text-sm px-8 py-3.5 flex items-center gap-2"><Sparkles size={14}/> New Arrivals</Link>
        </div>
      </div>
      {/* Category scroll strip */}
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
    <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/3 rounded-full pointer-events-none"/>
    <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-purple-50 rounded-full pointer-events-none"/>
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
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0"><Icon size={20} className="text-primary"/></div>
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
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full"/>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"/>
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
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full"/>
      </Link>
    )}
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HERO LAYOUT 4 — Full-Width Professional (Edge-to-Edge)
// ═══════════════════════════════════════════════════════════════════════════════
const HeroLayout4 = () => (
  <section className="relative overflow-hidden min-h-[80vh] flex items-center" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
    {/* Animated orbs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] animate-pulse"/>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}/>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px]"/>
    </div>
    {/* Grid pattern overlay */}
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}/>
    
    <div className="w-full px-6 md:px-12 lg:px-20 py-20 relative z-10">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left: Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black px-5 py-2.5 rounded-full mb-8 uppercase tracking-[0.15em]">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> Now Live — 2024 Collection
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black text-white leading-[0.95] mb-6">
            Shop the<br/>
            <span className="bg-gradient-to-r from-primary via-pink-400 to-violet-400 bg-clip-text text-transparent">Future of</span><br/>
            <span className="text-white/90">Fashion</span>
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
            Premium keychains, trendy accessories & unique gifts — all under one roof. Free delivery on orders above ₹499.
          </p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <Link to="/products" className="group bg-white text-gray-900 font-black px-10 py-4 rounded-2xl text-base hover:shadow-2xl hover:shadow-white/20 active:scale-95 transition-all flex items-center gap-3">
              <ShoppingBag size={20}/> Shop All
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            <Link to="/products?trending=true" className="bg-white/10 backdrop-blur-md text-white font-bold px-10 py-4 rounded-2xl text-base border border-white/20 hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2">
              <TrendingUp size={18}/> Trending
            </Link>
          </div>
        </div>
        {/* Right: Feature cards */}
        <div className="flex-1 w-full max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            {[
              { emoji: '🔑', title: 'Keychains', desc: 'Cute & trendy designs', gradient: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30' },
              { emoji: '👗', title: 'Fashion', desc: 'Latest style collection', gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30' },
              { emoji: '🎁', title: 'Gift Sets', desc: 'Perfect combo packs', gradient: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30' },
              { emoji: '💎', title: 'Premium', desc: 'Exclusive items', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
            ].map(card => (
              <Link key={card.title} to="/products" className={`bg-gradient-to-br ${card.gradient} backdrop-blur-md border ${card.border} rounded-3xl p-6 hover:scale-[1.03] transition-all group`}>
                <span className="text-4xl block mb-3">{card.emoji}</span>
                <p className="text-white font-black text-base mb-1">{card.title}</p>
                <p className="text-white/40 text-xs font-medium">{card.desc}</p>
              </Link>
            ))}
          </div>
          {/* Trust bar */}
          <div className="mt-5 flex items-center justify-between bg-white/5 backdrop-blur border border-white/10 rounded-2xl px-6 py-4">
            {[['🚚','Free Ship'],['🔒','Secure'],['⚡','24h Dispatch'],['↩️','Easy Return']].map(([e,t]) => (
              <div key={t as string} className="text-center">
                <p className="text-lg mb-0.5">{e}</p>
                <p className="text-white/50 text-[10px] font-bold">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
)

// Full-Width Product Section (for Layout 4)
const FullWidthProductSection: React.FC<SectionProps> = ({ title, products, loading, viewAll }) => (
  <section className="px-6 md:px-12 lg:px-20 py-10">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl md:text-3xl font-heading font-bold">{title}</h2>
      <Link to={viewAll} className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRight size={15}/></Link>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {loading ? Array(10).fill(0).map((_,i) => <SkeletonCard key={i}/>) : products.map(p => <ProductCard key={p._id} product={p}/>)}
    </div>
    {!loading && products.length === 0 && (
      <div className="text-center py-14 text-gray-400"><p className="text-4xl mb-3">🛍️</p><p>No products yet — add from admin panel</p></div>
    )}
  </section>
)

// Full-Width Features Bar (for Layout 4)
const FullWidthFeaturesBar = () => (
  <section className="bg-gradient-to-r from-gray-50 to-white border-y border-gray-100">
    <div className="px-6 md:px-12 lg:px-20 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0"><Icon size={22} className="text-primary"/></div>
            <div><p className="font-bold text-sm">{title}</p><p className="text-xs text-gray-500">{desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// Full-Width Categories (for Layout 4)
const FullWidthCategories = () => (
  <section className="px-6 md:px-12 lg:px-20 py-10">
    <h2 className="text-2xl md:text-3xl font-heading font-bold mb-6">Shop by Category</h2>
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {CATEGORIES.map(cat => (
        <Link key={cat.slug} to={`/category/${cat.slug}`} className={`p-5 rounded-2xl border-2 text-center transition-all hover:shadow-lg hover:-translate-y-1 ${cat.bg}`}>
          <div className="text-4xl mb-2">{cat.emoji}</div>
          <p className="text-sm font-bold text-gray-700">{cat.name}</p>
        </Link>
      ))}
    </div>
  </section>
)

// Full-Width Promo Banners (for Layout 4)
const FullWidthPromoBanners: React.FC<{ sec: any }> = ({ sec }) => (
  <section className="px-6 md:px-12 lg:px-20 pb-4 grid md:grid-cols-2 gap-5">
    {sec.underPriceBanner !== false && (
      <Link to="/products?maxPrice=199" className="relative bg-gradient-to-r from-primary to-pink-400 rounded-3xl p-8 text-white overflow-hidden group hover:shadow-2xl transition-shadow">
        <div className="relative z-10">
          <p className="text-sm font-semibold opacity-80 mb-1">Special Section</p>
          <h3 className="text-3xl font-heading font-bold mb-2">Under ₹199 🛍️</h3>
          <p className="text-white/80 text-sm mb-5">Trending items at micro prices</p>
          <span className="bg-white text-primary text-sm font-bold px-5 py-2 rounded-full inline-block">Shop Now →</span>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full"/>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"/>
      </Link>
    )}
    {sec.giftComboBanner !== false && (
      <Link to="/category/gifts" className="relative bg-gradient-to-r from-secondary to-amber-400 rounded-3xl p-8 text-white overflow-hidden group hover:shadow-2xl transition-shadow">
        <div className="relative z-10">
          <p className="text-sm font-semibold opacity-80 mb-1">Most Popular</p>
          <h3 className="text-3xl font-heading font-bold mb-2">Gift Combos 🎁</h3>
          <p className="text-white/80 text-sm mb-5">Keychain + Earrings sets & more</p>
          <span className="bg-white text-secondary text-sm font-bold px-5 py-2 rounded-full inline-block">Explore →</span>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full"/>
      </Link>
    )}
  </section>
)

// Full-Width Bottom CTA (for Layout 4)
const FullWidthBottomCTA = () => (
  <section className="px-6 md:px-12 lg:px-20 py-10">
    <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-[2rem] p-12 md:p-16 text-center text-white relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-sm font-semibold text-gray-400 mb-2">Youth Collection</p>
        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Under ₹299 Store 🛍️</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">Trendy items that won't break your budget. Perfect for gifting!</p>
        <Link to="/products?maxPrice=299" className="bg-primary text-white font-bold px-12 py-4 rounded-full hover:bg-primary-dark transition-colors inline-block shadow-xl shadow-primary/30 text-lg">
          Shop Under ₹299
        </Link>
      </div>
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/10 rounded-full"/>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-900/30 rounded-full"/>
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
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full"/>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-900/30 rounded-full"/>
    </div>
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const HomePage: React.FC = () => {
  const { settings } = useSettingsStore()
  const sec = settings.homepageSections
  const layout = settings.homeLayout || 1
  const [trending, setTrending] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  // ── Layout 1: Classic (default) ─────────────────────────────────────────
  if (layout === 1) return (
    <div>
      {sec.heroBanner !== false && <HeroLayout1 />}
      {sec.featuresBar !== false && <FeaturesBar />}
      {sec.categories !== false && <CategoriesSection />}
      {sec.promoBanners !== false && <PromoBanners sec={sec} />}
      {sec.trendingProducts !== false && <ProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true"/>}
      {sec.newArrivals !== false && <ProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true"/>}
      {sec.featuredProducts !== false && <ProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true"/>}
      <BottomCTA />
    </div>
  )

  // ── Layout 2: Dark Premium Hero ─────────────────────────────────────────
  if (layout === 2) return (
    <div>
      {sec.heroBanner !== false && <HeroLayout2 />}
      {sec.featuresBar !== false && <FeaturesBar />}
      {sec.trendingProducts !== false && <ProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true"/>}
      {sec.promoBanners !== false && <PromoBanners sec={sec} />}
      {sec.categories !== false && <CategoriesSection />}
      {sec.newArrivals !== false && <ProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true"/>}
      {sec.featuredProducts !== false && <ProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true"/>}
      <BottomCTA />
    </div>
  )

  // ── Layout 3: Minimalist Elegant ────────────────────────────────────────
  if (layout === 3) return (
    <div>
      {sec.heroBanner !== false && <HeroLayout3 />}
      {sec.featuresBar !== false && <FeaturesBar />}
      {sec.newArrivals !== false && <ProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true"/>}
      {sec.categories !== false && <CategoriesSection />}
      {sec.featuredProducts !== false && <ProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true"/>}
      {sec.promoBanners !== false && <PromoBanners sec={sec} />}
      {sec.trendingProducts !== false && <ProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true"/>}
      <BottomCTA />
    </div>
  )

  // ── Layout 4: Full-Width Professional (default fallback) ───────────────
  return (
    <div>
      {sec.heroBanner !== false && <HeroLayout4 />}
      {sec.featuresBar !== false && <FullWidthFeaturesBar />}
      {sec.trendingProducts !== false && <FullWidthProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true"/>}
      {sec.promoBanners !== false && <FullWidthPromoBanners sec={sec} />}
      {sec.categories !== false && <FullWidthCategories />}
      {sec.newArrivals !== false && <FullWidthProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true"/>}
      {sec.featuredProducts !== false && <FullWidthProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true"/>}
      <FullWidthBottomCTA />
    </div>
  )
}

export default HomePage
