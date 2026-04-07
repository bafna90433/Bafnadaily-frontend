import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import api from '../utils/api'
import { Product } from '../types'
import ProductCard from '../components/product/ProductCard'

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q')||''
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!q) return; setLoading(true); api.get(`/products?search=${encodeURIComponent(q)}&limit=24`).then(r=>setProducts(r.data.products)).finally(()=>setLoading(false)) }, [q])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-2 flex items-center gap-2"><Search size={20}/> "{q}"</h1>
      <p className="text-gray-400 text-sm mb-6">{products.length} results</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {loading ? Array(8).fill(0).map((_,i)=><div key={i} className="h-64 skeleton rounded-2xl"/>) : products.map(p=><ProductCard key={p._id} product={p}/>)}
      </div>
      {!loading&&products.length===0&&q&&<div className="text-center py-20 text-gray-400"><p className="text-4xl mb-3">🔍</p><p>No results for "{q}"</p></div>}
    </div>
  )
}

export default SearchPage
