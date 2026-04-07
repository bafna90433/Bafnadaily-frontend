import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { Product } from '../../types'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import api from '../../utils/api'
import toast from 'react-hot-toast'

interface Props { product: Product }

const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [wishlisted, setWishlisted] = useState(false)
  const [adding, setAdding] = useState(false)

  const img = product.images?.[0]?.url || `https://placehold.co/400x400/FCE4EC/E91E63?text=${encodeURIComponent(product.name)}`

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setAdding(true)
    await addToCart(product._id)
    setAdding(false)
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
      <div className="card overflow-hidden">
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
          <img src={img} alt={product.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/FCE4EC/E91E63?text=Product` }}
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discount > 0 && <span className="badge bg-red-500 text-white">{product.discount}% OFF</span>}
            {product.isTrending && <span className="badge bg-orange-500 text-white">🔥 Hot</span>}
            {product.isNewArrival && <span className="badge bg-green-500 text-white">New ✨</span>}
            {product.isBestSeller && <span className="badge bg-purple-500 text-white">⭐ Best</span>}
          </div>
          {/* Wishlist */}
          <button onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
            <Heart size={15} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
          {/* Quick add */}
          {product.stock > 0 && (
            <button onClick={handleCart} disabled={adding}
              className="absolute bottom-0 inset-x-0 bg-primary text-white py-2.5 text-xs font-bold translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex items-center justify-center gap-1.5">
              <ShoppingCart size={14} />
              {adding ? 'Adding…' : 'Add to Cart'}
            </button>
          )}
          {product.stock === 0 && (
            <div className="absolute bottom-0 inset-x-0 bg-gray-800/80 text-white py-2 text-xs font-semibold text-center">Out of Stock</div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-[11px] text-gray-400 font-medium mb-0.5">{product.category?.name}</p>
          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.name}</h3>
          {product.averageRating > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(product.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />)}</div>
              <span className="text-[11px] text-gray-400">({product.numReviews})</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">₹{product.price}</span>
            {product.mrp > product.price && <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>}
          </div>
          {product.stock > 0 && product.stock < 5 && (
            <p className="text-[11px] text-orange-500 font-semibold mt-1">Only {product.stock} left!</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
