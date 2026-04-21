import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ShoppingBag, Heart, ChevronLeft, ChevronRight, Package, Shield, Truck, Star, Minus, Plus, ThumbsUp, Tag, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { Product } from '../types'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import ProductCard from '../components/product/ProductCard'
import toast from 'react-hot-toast'
import { ik } from '../utils/imagekit'

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
  const [cartQty, setCartQty] = useState(0)  // 0 = not in cart
  const [cartItemId, setCartItemId] = useState<string | null>(null)
  const [variant, setVariant] = useState('')
  const [wishlisted, setWishlisted] = useState(false)
  const [tab, setTab] = useState<'reviews'|'shipping'>('reviews')
  const [descOpen, setDescOpen] = useState(false)
  const { addToCart, cart, updateItem, removeItem, count, getTotal, hasNewItem } = useCartStore()
  const { total } = getTotal()
  const { user } = useAuthStore()

  useEffect(() => {
    setLoading(true); setImgIdx(0); setVariant(''); setTab('reviews'); setCartQty(0); setCartItemId(null)
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

  // Sync cartQty from cart store
  useEffect(() => {
    if (!product || !cart) return
    const item = cart.items?.find(i => i.product?._id === product._id)
    if (item) { setCartQty(item.quantity); setCartItemId(item._id) }
    else { setCartQty(0); setCartItemId(null) }
  }, [cart, product])

  const handleCart = async () => {
    if (!user) { navigate('/login'); return }
    await addToCart(product!, product!.minQty || 1, variant)
  }

  const handleIncrease = async () => {
    if (!cartItemId) return
    await updateItem(cartItemId, cartQty + 1)
  }

  const handleDecrease = async () => {
    if (!cartItemId) return
    if (cartQty <= (product?.minQty || 1)) {
      await removeItem(cartItemId)
    } else {
      await updateItem(cartItemId, cartQty - 1)
    }
  }

  const handleBuyNow = async () => { if (!user) { navigate('/login'); return }; await addToCart(product!, qty, variant); navigate('/checkout') }
  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return }
    const res = await api.post(`/wishlist/toggle/${product!._id}`)
    setWishlisted(res.data.wishlisted)
    toast.success(res.data.wishlisted ? '❤️ Added to wishlist' : 'Removed')
  }

  if (loading) return (
    <div className="w-full px-4 md:px-10 lg:px-16 xl:px-24 py-8">
      <div className="grid md:grid-cols-[1fr_1.2fr] gap-10">
        {/* Image Skeleton */}
        <div className="space-y-3">
          <div className="aspect-square skeleton rounded-2xl"/>
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <div key={i} className="w-16 h-16 skeleton rounded-xl"/>)}
          </div>
        </div>
        {/* Info Skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-20 skeleton rounded"/>
            <div className="h-10 w-3/4 skeleton rounded-xl"/>
            <div className="h-6 w-32 skeleton rounded-lg opacity-50"/>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 skeleton rounded-xl"/>
            <div className="h-8 w-20 skeleton rounded-xl opacity-30"/>
          </div>
          <div className="h-20 w-full skeleton rounded-2xl"/>
          <div className="flex gap-4">
            <div className="h-14 flex-1 skeleton rounded-xl"/>
            <div className="h-14 flex-1 skeleton rounded-xl"/>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-40 skeleton rounded"/>
            <div className="h-4 w-full skeleton rounded"/>
            <div className="h-4 w-full skeleton rounded"/>
            <div className="h-4 w-2/3 skeleton rounded"/>
          </div>
        </div>
      </div>
    </div>
  )
  if (!product) return null

  const images = product.images?.length
    ? product.images
    : [{ url: `https://placehold.co/600x600/FCE4EC/E91E63?text=${product.name}` }]

  return (
    <div className="w-full px-4 md:px-10 lg:px-16 xl:px-24 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-primary">Home</button><span>/</span>
        <button onClick={() => navigate(`/category/${product.category?.slug}`)} className="hover:text-primary">{product.category?.name}</button><span>/</span>
        <span className="text-gray-700 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-[1fr_1.2fr] lg:grid-cols-[1fr_1.4fr] gap-10 mb-12">
        {/* ── Images ── */}
        <div className="w-full">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
            <img src={ik.detail(images[imgIdx]?.url)} alt={product.name} width={600} height={600} loading="eager" fetchPriority="high" className="w-full h-full object-cover"/>
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
                <img src={ik.detailThumb(img.url)} alt="" width={64} height={64} loading="lazy" className="w-full h-full object-cover"/>
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

          {/* CTA — desktop (inline) */}
          <div className="hidden md:flex gap-3 mt-6">
            {cartQty > 0 ? (
              <div className="flex items-center border-2 border-primary rounded-xl overflow-hidden flex-1">
                <button onClick={handleDecrease} disabled={cartItemId?.startsWith('temp-')} className="px-4 py-3 text-primary hover:bg-primary/5 transition-colors font-black text-lg disabled:opacity-30"><Minus size={16}/></button>
                <span className="flex-1 text-center font-black text-primary text-base">{cartQty}</span>
                <button onClick={handleIncrease} disabled={cartQty >= product.stock || cartItemId?.startsWith('temp-')} className="px-4 py-3 text-primary hover:bg-primary/5 transition-colors font-black text-lg disabled:opacity-30"><Plus size={16}/></button>
              </div>
            ) : (
              <button onClick={handleCart} disabled={product.stock===0} className="btn-outline flex-1 flex items-center justify-center gap-2">
                <ShoppingCart size={18}/>
                Add to Cart
              </button>
            )}
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

          {/* ── Description — accordion on mobile, always open on desktop ── */}
          {product.description && (
            <div className="mt-5">
              {/* Mobile accordion */}
              <div className="md:hidden border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setDescOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-pink-50 to-purple-50 active:from-pink-100 active:to-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📋</span>
                    <span className="text-sm font-black text-gray-800 tracking-wide">Product Description</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 ${descOpen ? 'rotate-180' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4L6 8L10 4" stroke="#E91E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-400 ease-in-out ${descOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-4 py-4 bg-white border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                  </div>
                </div>
              </div>

              {/* Desktop — always visible */}
              <div className="hidden md:block border-t border-gray-100 pt-5">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full inline-block"/>
                  Product Description
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            </div>
          )}

          {/* ── Shipping info inline ── */}
          <div className="mt-5 border-t border-gray-100 pt-5 grid grid-cols-2 gap-2">
            {[
              { emoji: '✅', text: 'Free delivery above ₹499' },
              { emoji: '🚚', text: '3–7 business days' },
              { emoji: '💵', text: 'Cash on Delivery available' },
              { emoji: '↩️', text: '7-day easy returns' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                <span>{emoji}</span><span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs: Reviews / Shipping ── */}
      <div className="mb-12">
        <div className="flex border-b border-gray-200 mb-6">
          {([['reviews',`Reviews${product.numReviews > 0 ? ` (${product.numReviews})` : ''}`],['shipping','Shipping Info']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${tab===k?'border-primary text-primary':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
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

      <div className="md:hidden fixed bottom-6 inset-x-4 z-50 bg-white/90 backdrop-blur-xl border border-white/20 px-4 py-3 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-3">
          {/* Price quick view */}
          <div className="flex flex-col flex-shrink-0 min-w-[60px]">
            <p className="text-xl font-black text-gray-900 leading-none">₹{product.price}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Product Price</p>
          </div>

          <div className="flex gap-2 flex-1 items-center justify-end">
            {/* Add to Cart Button */}
            {cartQty > 0 ? (
              <div className="flex-1 flex items-center border-2 border-primary rounded-2xl overflow-hidden bg-white h-[48px]">
                <button onClick={handleDecrease} disabled={cartItemId?.startsWith('temp-')} className="px-3 h-full text-primary active:bg-primary/5 transition-colors disabled:opacity-30"><Minus size={14}/></button>
                <span className="flex-1 text-center font-black text-primary text-sm">{cartQty}</span>
                <button onClick={handleIncrease} disabled={cartQty >= product.stock || cartItemId?.startsWith('temp-')} className="px-3 h-full text-primary active:bg-primary/5 transition-colors disabled:opacity-30"><Plus size={14}/></button>
              </div>
            ) : (
              <button
                onClick={handleCart}
                disabled={product.stock === 0}
                className="flex-[1.5] h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white font-black text-sm active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-gray-200"
              >
                <ShoppingCart size={18}/>
                Add to Cart
              </button>
            )}

            {/* Home-Style Raised Cart Icon Link with Total Calculation */}
            {count > 0 && (
              <Link to="/cart" 
                className={`w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center relative active:scale-90 transition-all shadow-xl shadow-primary/30 -translate-y-6 border-4 border-white ${hasNewItem ? 'animate-cart-pulse' : ''}`}>
                <ShoppingBag size={24} />
                <span className="absolute -top-3 -right-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] rounded-full border-2 border-white font-black shadow-md">
                  ₹{total}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
