import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Tag, Package } from 'lucide-react'
import { Product } from '../../types'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { ik } from '../../utils/imagekit'

interface Props { product: Product }

const ProductCard: React.FC<Props> = ({ product }) => {
  const { cart, addToCart, updateItem } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [wishlisted, setWishlisted] = useState(false)
  const [adding, setAdding] = useState(false)

  const cartItem = cart?.items?.find(i => i.product?._id === product._id)
  const qtyInCart = cartItem?.quantity || 0

  const rawImg = product.images?.[0]?.url || ''
  const img = rawImg ? ik.thumb(rawImg) : `https://placehold.co/300x300/FCE4EC/E91E63?text=${encodeURIComponent(product.name)}`

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (navigator.vibrate) navigator.vibrate(30);
    setAdding(true)
    await addToCart(product._id, product.minQty || 1)
    setAdding(false)
  }

  const handleUpdateQty = async (e: React.MouseEvent, delta: number) => {
    e.preventDefault()
    if (!cartItem) return
    if (navigator.vibrate) navigator.vibrate(30);
    const newQty = cartItem.quantity + delta
    if (newQty < (product.minQty || 1)) return
    await updateItem(cartItem._id, newQty)
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    try {
      const res = await api.post(`/wishlist/toggle/${product._id}`)
      setWishlisted(res.data.wishlisted)
      toast.success(res.data.wishlisted ? '❤️ Wishlisted!' : 'Removed from wishlist')
    } catch {}
  }

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ borderRadius: '1rem' }}>
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
          <img src={img} alt={product.name} loading="lazy"
            width={300} height={300}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x300/FCE4EC/E91E63?text=Product` }}
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discount > 0 && <span className="badge bg-red-500 text-white">{product.discount}% OFF</span>}
            {product.isTrending && <span className="badge bg-orange-500 text-white">🔥 Hot</span>}
            {product.isNewArrival && <span className="badge bg-green-500 text-white">New ✨</span>}
            {product.isBestSeller && <span className="badge bg-purple-500 text-white">⭐ Best</span>}
            {(product.minQty || 1) > 1 && <span className="badge bg-orange-100 text-orange-700">Min {product.minQty} pcs</span>}
          </div>
          {/* Wishlist */}
          <button onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
            <Heart size={15} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
          
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <p className="text-[11px] text-gray-400 font-medium truncate">{product.category?.name}</p>
            {(product.sku || product.barcode) && (
              <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded flex-shrink-0">#{product.sku || product.barcode}</span>
            )}
          </div>
          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.name}</h3>
          
          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-black text-primary">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-xs text-gray-400 line-through font-medium">₹{product.mrp}</span>
            )}
            {product.discount > 0 && (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                {product.discount}% OFF
              </span>
            )}
          </div>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(product.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />)}</div>
              <span className="text-[11px] text-gray-400">({product.numReviews})</span>
            </div>
          )}
          
          {(product.perPiecePrice || product.perPacketText) && (
            <div className="flex flex-col gap-1.5 mb-2">
              {product.perPiecePrice && (
                <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-600 text-[10px] font-black px-2.5 py-1 rounded-full w-fit">
                  <Tag size={10} className="fill-purple-600/10"/> {product.perPiecePrice}
                </div>
              )}
              {product.perPacketText && (
                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black px-2.5 py-1 rounded-full w-fit">
                  <Package size={10} className="fill-blue-600/10"/> {product.perPacketText}
                </div>
              )}
            </div>
          )}

          {(product.minQty || 1) > 1 && (
            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-lg mb-1.5">
              📦 Min {product.minQty} pcs
            </div>
          )}
          {product.stock > 0 && product.stock < 5 && (
            <p className="text-[11px] text-orange-500 font-semibold mb-1.5">Only {product.stock} left!</p>
          )}

          {/* ── Cart Controls ── always visible ── */}
          {product.stock !== 0 ? (
            qtyInCart > 0 ? (
              <div className="flex items-center rounded-xl overflow-hidden border border-primary h-9">
                <button
                  onClick={(e) => handleUpdateQty(e, -1)}
                  disabled={qtyInCart <= (product.minQty || 1)}
                  className="flex-1 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-base font-black text-primary leading-none">−</span>
                </button>
                <div className="flex-[1.5] h-full flex items-center justify-center bg-primary text-white font-black text-sm">
                  {qtyInCart}
                </div>
                <button
                  onClick={(e) => handleUpdateQty(e, 1)}
                  className="flex-1 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-base font-black text-primary leading-none">+</span>
                </button>
              </div>
            ) : (
              <button onClick={handleCart} disabled={adding}
                className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)', color: '#fff', boxShadow: '0 4px 14px rgba(233,30,99,0.25)' }}>
                <ShoppingCart size={13} />
                {adding ? 'Adding…' : 'Add to Cart'}
              </button>
            )
          ) : (
            <div className="w-full py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold text-center">
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
