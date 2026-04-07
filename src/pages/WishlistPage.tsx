import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import api from '../utils/api'
import { Product } from '../types'
import useAuthStore from '../store/authStore'
import ProductCard from '../components/product/ProductCard'

const WishlistPage: React.FC = () => {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (!user) return setLoading(false); api.get('/wishlist').then(r => setProducts(r.data.wishlist?.products||[])).finally(()=>setLoading(false)) }, [user])

  if (!user) return <div className="text-center py-24 px-4"><p className="text-lg">Please <Link to="/login" className="text-primary font-bold">login</Link> to view your wishlist</p></div>
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2"><Heart className="text-primary fill-primary" size={24}/> My Wishlist ({products.length})</h1>
      {loading ? <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array(4).fill(0).map((_,i)=><div key={i} className="h-64 skeleton rounded-2xl"/>)}</div> :
        products.length===0 ? <div className="text-center py-24"><Heart size={64} className="text-gray-200 mx-auto mb-4"/><p className="text-gray-400 mb-4">Your wishlist is empty</p><Link to="/products" className="btn-primary">Explore Products</Link></div> :
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{products.map(p=><ProductCard key={p._id} product={p}/>)}</div>
      }
    </div>
  )
}

export default WishlistPage
