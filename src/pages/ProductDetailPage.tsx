import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, ChevronLeft, ChevronRight, Package, Shield, Truck, Star, Minus, Plus, ThumbsUp, Tag } from 'lucide-react'
import api from '../utils/api'
import { Product } from '../types'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import ProductCard from '../components/product/ProductCard'
import toast from 'react-hot-toast'

// ── Star Rating Display ────────────────────────────────────────────────────────
function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size}
          className={s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

// ── Professional Reviews Section ──────────────────────────────────────────────
function ReviewsSection({ reviews, averageRating, numReviews }: {
  reviews: any[]; averageRating: number; numReviews: number;
}) {
  // Rating distribution
  const dist = [5,4,3,2,1].map(s => ({
    star: s,
    count: reviews.filter(r => Math.round(r.rating) === s).length,
    pct: reviews.length ? Math.round((reviews.filter(r => Math.round(r.rating) === s).length / reviews.length) * 100) : 0,
  }))

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">⭐</div>
        <p className="font-bold text-gray-700 mb-1">No reviews yet</p>
        <p className="text-sm text-gray-400">Be the first to rate this product!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex gap-8 items-center p-6 bg-gray-50 rounded-2xl mb-6">
        <div className="text-center flex-shrink-0">
          <p className="text-5xl font-black text-gray-900">{averageRating.toFixed(1)}</p>
          <StarRow rating={averageRating} size={16} />
          <p className="text-xs text-gray-400 mt-1">{numReviews} review{numReviews !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 w-4">{star}</span>
              <Star size={11} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div key={i} className="border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
                  {(r.user?.name?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">{r.user?.name || 'Verified Buyer'}</p>
                  <StarRow rating={r.rating} size={12} />
                </div>
              </div>
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0">
                <ThumbsUp size={10} />
                Verified
              </div>
            </div>
            {r.comment && <p className="text-sm text-gray-600 leading-relaxed pl-12">{r.comment}</p>}
            <p className="text-[10px] text-gray-400 mt-2 pl-12">
              {new Date(r.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [variant, setVariant] = useState('')
  const [wishlisted, setWishlisted] = useState(false)
  const [tab, setTab] = useState<'desc'|'reviews'|'shipping'>('desc')
  const { addToCart } = useCartStore()
  const { user } = useAuthStore()

  useEffect(() => {
    setLoading(true); setImgIdx(0); setVariant(''); setTab('desc')
    api.get(`/products/${slug}`).then(async r => {
      const p = r.data.product
      setProduct(p)
      setQty(p.minQty || 1)
      if (p.category?._id) {
        const rel = await api.get(`/products?category=${p.category._id}&limit=7`)
        setRelated(rel.data.products.filter((x: Product) => x.slug !== slug).slice(0, 6))
      }
    }).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [slug])

  const handleCart = async () => { if (!user) { navigate('/login'); return }; await addToCart(product!._id, qty, variant) }
  const handleBuyNow = async () => { if (!user) { navigate('/login'); return }; await addToCart(product!._id, qty, variant); navigate('/checkout') }
  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return }
    const res = await api.post(`/wishlist/toggle/${product!._id}`)
    setWishlisted(res.data.wishlisted)
    toast.success(res.data.wishlisted ? '❤️ Added to wishlist' : 'Removed')
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square skeleton rounded-2xl"/>
        <div className="space-y-4">{Array(6).fill(0).map((_,i)=><div key={i} className="h-8 skeleton rounded"/>)}</div>
      </div>
    </div>
  )
  if (!product) return null

  const images = product.images?.length
    ? product.images
    : [{ url: `https://placehold.co/600x600/FCE4EC/E91E63?text=${product.name}` }]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-primary">Home</button><span>/</span>
        <button onClick={() => navigate(`/category/${product.category?.slug}`)} className="hover:text-primary">{product.category?.name}</button><span>/</span>
        <span className="text-gray-700 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* ── Images ── */}
        <div className="max-w-md mx-auto w-full">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
            <img src={images[imgIdx]?.url} alt={product.name} className="w-full h-full object-cover"/>
            {images.length > 1 && <>
              <button onClick={() => setImgIdx(i => (i-1+images.length)%images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform">
                <ChevronLeft size={18}/>
              </button>
              <button onClick={() => setImgIdx(i => (i+1)%images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform">
                <ChevronRight size={18}/>
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`rounded-full transition-all ${i === imgIdx ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-white/70'}`}/>
                ))}
              </div>
            </>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${imgIdx===i?'border-primary scale-105':'border-transparent hover:border-gray-300'}`}>
                <img src={img.url} alt="" className="w-full h-full object-cover"/>
              </button>
            ))}
          </div>
        </div>

        {/* ── Info ── */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-primary font-bold mb-1 uppercase tracking-wide">{product.category?.name}</p>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 leading-tight">{product.name}</h1>
              {(product.sku || product.barcode) && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-lg border border-gray-200">
                    Product Code: #{product.sku || product.barcode}
                  </span>
                </div>
              )}
            </div>
            <button onClick={handleWishlist} className="p-2 hover:bg-red-50 rounded-full flex-shrink-0 transition-colors">
              <Heart size={22} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}/>
            </button>
          </div>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <StarRow rating={product.averageRating} />
              <span className="text-sm font-bold text-gray-700">{product.averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})</span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-xl text-gray-400 line-through">₹{product.mrp}</span>
                <span className="badge bg-red-100 text-red-600 text-sm">{product.discount}% OFF</span>
              </>
            )}
          </div>
          
          {(product.perPiecePrice || product.perPacketText) && (
            <div className="flex flex-wrap gap-3 mt-3">
              {product.perPiecePrice && (
                <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 text-sm font-black px-4 py-1.5 rounded-full shadow-sm">
                  <Tag size={16} className="fill-purple-700/10"/> {product.perPiecePrice}
                </div>
              )}
              {product.perPacketText && (
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-black px-4 py-1.5 rounded-full shadow-sm">
                  <Package size={16} className="fill-blue-700/10"/> {product.perPacketText}
                </div>
              )}
            </div>
          )}

          {product.mrp > product.price && (
            <p className="text-green-600 text-sm font-semibold mt-1">You save ₹{product.mrp - product.price}!</p>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mt-5">
              <p className="font-semibold mb-2 text-sm flex items-center gap-2">
                Choose Color
                {product.images?.[imgIdx]?.colorName && (
                  <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                    {product.images[imgIdx].colorName}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c, i) => (
                  <button key={i} title={c.name}
                    onClick={() => {
                      const idx = images.findIndex(img => img.colorName === c.name)
                      if (idx !== -1) setImgIdx(idx)
                    }}
                    className={`group relative flex flex-col items-center gap-1.5 p-1 rounded-full transition-all ${images[imgIdx]?.colorName === c.name ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'}`}>
                    <div className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c.hex }}/>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mt-5">
              <p className="font-semibold mb-2 text-sm">Choose Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button key={i} onClick={() => setVariant(`${v.name}:${v.value}`)}
                    className={`px-4 py-2 border-2 rounded-xl text-sm font-medium transition-colors ${variant===`${v.name}:${v.value}`?'border-primary bg-primary/5 text-primary':'border-gray-200 hover:border-primary'}`}>
                    {v.name}: {v.value}{v.additionalPrice > 0 && ` (+₹${v.additionalPrice})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="mt-5 flex items-center gap-4">
            <span className="font-semibold text-sm">Qty:</span>
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(product.minQty||1, q - 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors"><Minus size={16}/></button>
              <span className="px-4 py-2 font-bold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors"><Plus size={16}/></button>
            </div>
            <span className="text-xs text-gray-400">{product.stock} in stock</span>
            {(product.minQty||1) > 1 && <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded-full">Min {product.minQty} pcs</span>}
          </div>

          {/* CTA */}
          <div className="flex gap-3 mt-6">
            <button onClick={handleCart} disabled={product.stock===0} className="btn-outline flex-1 flex items-center justify-center gap-2">
              <ShoppingCart size={18}/> Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={product.stock===0} className="btn-primary flex-1">
              Buy Now
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-5 p-4 bg-gray-50 rounded-2xl">
            {[[Truck,'Fast Delivery'],[Shield,'Secure Pay'],[Package,'Easy Returns']].map(([Icon,txt]: any) => (
              <div key={txt} className="text-center">
                <Icon size={18} className="text-primary mx-auto mb-1"/>
                <p className="text-xs text-gray-600 font-medium">{txt}</p>
              </div>
            ))}
          </div>
          {product.giftWrapping && (
            <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-xl text-sm text-pink-700">
              🎁 Gift wrapping available at checkout (+₹29)
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs: Description / Reviews / Shipping ── */}
      <div className="mb-12">
        <div className="flex border-b border-gray-200 mb-6">
          {([['desc','Description'],['reviews',`Reviews${product.numReviews > 0 ? ` (${product.numReviews})` : ''}`],['shipping','Shipping']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${tab===k?'border-primary text-primary':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
        {tab==='desc' && (
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
        )}
        {tab==='reviews' && (
          <ReviewsSection
            reviews={product.reviews || []}
            averageRating={product.averageRating || 0}
            numReviews={product.numReviews || 0}
          />
        )}
        {tab==='shipping' && (
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl"><span>✅</span><span>Free shipping on orders above ₹499</span></div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl"><span>🚚</span><span>Standard delivery: 3–7 business days</span></div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl"><span>💵</span><span>Cash on Delivery available across India</span></div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl"><span>↩️</span><span>Easy 7-day returns</span></div>
          </div>
        )}
      </div>

      {/* ── You May Also Like ── */}
      {related.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-heading font-bold">You May Also Like</h2>
              <p className="text-sm text-gray-400 mt-0.5">More from {product.category?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {related.map(p => <ProductCard key={p._id} product={p}/>)}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
