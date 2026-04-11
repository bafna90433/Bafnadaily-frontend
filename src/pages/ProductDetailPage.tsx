import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, ChevronLeft, ChevronRight, Package, Shield, Truck, Star, Minus, Plus } from 'lucide-react'
import api from '../utils/api'
import { Product } from '../types'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import ProductCard from '../components/product/ProductCard'
import toast from 'react-hot-toast'

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
    setLoading(true); setImgIdx(0); setVariant('')
    api.get(`/products/${slug}`).then(async r => {
      const p = r.data.product
      setProduct(p)
      setQty(p.minQty || 1)
      if (r.data.product.category?._id) {
        const rel = await api.get(`/products?category=${r.data.product.category._id}&limit=6`)
        setRelated(rel.data.products.filter((p: Product) => p.slug !== slug))
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

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="grid md:grid-cols-2 gap-8"><div className="aspect-square skeleton rounded-2xl"/><div className="space-y-4">{Array(6).fill(0).map((_,i)=><div key={i} className="h-8 skeleton rounded"/>)}</div></div></div>
  if (!product) return null

  const images = product.images?.length ? product.images : [{ url: `https://placehold.co/600x600/FCE4EC/E91E63?text=${product.name}` }]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-primary">Home</button><span>/</span>
        <button onClick={() => navigate(`/category/${product.category?.slug}`)} className="hover:text-primary">{product.category?.name}</button><span>/</span>
        <span className="text-gray-700 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
            <img src={images[imgIdx]?.url} alt={product.name} className="w-full h-full object-cover"/>
            {images.length > 1 && <>
              <button onClick={() => setImgIdx(i => (i-1+images.length)%images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center"><ChevronLeft size={18}/></button>
              <button onClick={() => setImgIdx(i => (i+1)%images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center"><ChevronRight size={18}/></button>
            </>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-colors ${imgIdx===i?'border-primary':'border-transparent'}`}>
                <img src={img.url} alt="" className="w-full h-full object-cover"/>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium mb-1">{product.category?.name}</p>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 leading-tight">{product.name}</h1>
            </div>
            <button onClick={handleWishlist} className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0">
              <Heart size={22} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}/>
            </button>
          </div>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">{[1,2,3,4,5].map(s=><Star key={s} size={15} className={s<=Math.round(product.averageRating)?'fill-yellow-400 text-yellow-400':'text-gray-200'}/>)}</div>
              <span className="text-sm text-gray-500">{product.averageRating.toFixed(1)} ({product.numReviews} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
            {product.mrp > product.price && <><span className="text-xl text-gray-400 line-through">₹{product.mrp}</span><span className="badge bg-red-100 text-red-600 text-sm">{product.discount}% OFF</span></>}
          </div>
          {product.mrp > product.price && <p className="text-green-600 text-sm font-semibold mt-1">You save ₹{product.mrp - product.price}!</p>}

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

          <div className="mt-5 flex items-center gap-4">
            <span className="font-semibold text-sm">Qty:</span>
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(product.minQty||1, q - 1))} className="px-3 py-2 hover:bg-gray-50"><Minus size={16}/></button>
              <span className="px-4 py-2 font-bold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-gray-50"><Plus size={16}/></button>
            </div>
            <span className="text-xs text-gray-400">{product.stock} available</span>
            {(product.minQty||1) > 1 && (
              <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded-full">Min {product.minQty} pcs</span>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleCart} disabled={product.stock===0} className="btn-outline flex-1"><ShoppingCart size={18}/> Add to Cart</button>
            <button onClick={handleBuyNow} disabled={product.stock===0} className="btn-primary flex-1">Buy Now</button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 p-4 bg-gray-50 rounded-2xl">
            {[[Truck,'Fast Delivery'],[Shield,'Secure Pay'],[Package,'Easy Returns']].map(([Icon,txt]: any) => (
              <div key={txt} className="text-center"><Icon size={18} className="text-primary mx-auto mb-1"/><p className="text-xs text-gray-600 font-medium">{txt}</p></div>
            ))}
          </div>
          {product.giftWrapping && <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-xl text-sm text-pink-700">🎁 Gift wrapping available at checkout (+₹29)</div>}
          {product.material && <p className="text-sm text-gray-500 mt-3"><strong>Material:</strong> {product.material}</p>}
          {product.color?.length > 0 && <p className="text-sm text-gray-500 mt-1"><strong>Colors:</strong> {product.color.join(', ')}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-10">
        <div className="flex border-b border-gray-200 mb-6">
          {[['desc','Description'],['reviews','Reviews'],['shipping','Shipping']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)} className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${tab===k?'border-primary text-primary':'border-transparent text-gray-500 hover:text-gray-700'}`}>{l}</button>
          ))}
        </div>
        {tab==='desc' && <p className="text-gray-600 leading-relaxed">{product.description}</p>}
        {tab==='reviews' && (
          product.reviews?.length === 0 ? <p className="text-gray-400 text-sm">No reviews yet.</p> :
          <div className="space-y-4">{product.reviews?.map((r,i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">{r.user?.name?.[0]||'U'}</div>
                <div><p className="font-semibold text-sm">{r.user?.name||'User'}</p><div className="flex">{[1,2,3,4,5].map(s=><Star key={s} size={11} className={s<=r.rating?'fill-yellow-400 text-yellow-400':'text-gray-200'}/>)}</div></div>
              </div>
              <p className="text-sm text-gray-600">{r.comment}</p>
            </div>
          ))}</div>
        )}
        {tab==='shipping' && <div className="space-y-2 text-sm text-gray-600"><p>✅ Free shipping on orders above ₹499</p><p>✅ Standard delivery: 3-7 business days</p><p>✅ Cash on Delivery available across India</p><p>✅ Easy 7-day returns</p></div>}
      </div>

      {related.length > 0 && (
        <div><h2 className="text-2xl font-heading font-bold mb-5">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{related.map(p=><ProductCard key={p._id} product={p}/>)}</div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
