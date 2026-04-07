import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Gift, Truck, Shield, Tag } from 'lucide-react'
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

const HomePage: React.FC = () => {
  const { settings } = useSettingsStore()
  const sec = settings.homepageSections
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

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      {sec.heroBanner !== false && (
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
      )}

      {/* ── FEATURES BAR ──────────────────────────────────────────────────────── */}
      {sec.featuresBar !== false && (
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
      )}

      {/* ── CATEGORIES ────────────────────────────────────────────────────────── */}
      {sec.categories !== false && (
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
      )}

      {/* ── PROMO BANNERS ─────────────────────────────────────────────────────── */}
      {sec.promoBanners !== false && (
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
      )}

      {/* ── TRENDING ──────────────────────────────────────────────────────────── */}
      {sec.trendingProducts !== false && (
        <ProductSection title="🔥 Trending Now" products={trending} loading={loading} viewAll="/products?trending=true"/>
      )}

      {/* ── NEW ARRIVALS ──────────────────────────────────────────────────────── */}
      {sec.newArrivals !== false && (
        <ProductSection title="✨ New Arrivals" products={newArrivals} loading={loading} viewAll="/products?newArrival=true"/>
      )}

      {/* ── FEATURED ──────────────────────────────────────────────────────────── */}
      {sec.featuredProducts !== false && (
        <ProductSection title="⭐ Featured Products" products={featured} loading={loading} viewAll="/products?featured=true"/>
      )}

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────────── */}
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
    </div>
  )
}

export default HomePage
