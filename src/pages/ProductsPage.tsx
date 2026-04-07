import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import api from '../utils/api'
import { Product, Category } from '../types'
import ProductCard from '../components/product/ProductCard'

const SORT_OPTIONS = [
  { label: 'Newest First', value: '' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Top Rated', value: 'rating' },
]

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || '',
    trending: searchParams.get('trending') || '',
    featured: searchParams.get('featured') || '',
    newArrival: searchParams.get('newArrival') || '',
  })

  useEffect(() => {
    api.get('/categories/all').then(r => setCategories(r.data.categories)).catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      params.set('page', String(page)); params.set('limit', '20')
      const res = await api.get(`/products?${params}`)
      setProducts(res.data.products); setTotal(res.data.total)
    } catch {} finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const setF = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }))
  const clear = () => setFilters({ category:'',minPrice:'',maxPrice:'',sort:'',trending:'',featured:'',newArrival:'' })

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-sm mb-3">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="cat" checked={filters.category === ''} onChange={() => setF('category','')} className="accent-primary" /> All Categories
          </label>
          {categories.map(c => (
            <label key={c._id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" name="cat" checked={filters.category === c._id} onChange={() => setF('category',c._id)} className="accent-primary" />
              {c.icon} {c.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-sm mb-3">Price Range</h3>
        <div className="flex gap-2 mb-3">
          <input type="number" placeholder="Min ₹" value={filters.minPrice} onChange={e => setF('minPrice',e.target.value)} className="input py-2 text-sm" />
          <input type="number" placeholder="Max ₹" value={filters.maxPrice} onChange={e => setF('maxPrice',e.target.value)} className="input py-2 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[['Under ₹99','99'],['Under ₹199','199'],['Under ₹299','299'],['Under ₹499','499']].map(([l,mx]) => (
            <button key={l} onClick={() => { setF('minPrice',''); setF('maxPrice',mx) }} className="text-xs px-3 py-1.5 border border-gray-200 rounded-full hover:border-primary hover:text-primary transition-colors">{l}</button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-sm mb-3">Collections</h3>
        {[['trending','🔥 Trending'],['featured','⭐ Featured'],['newArrival','✨ New Arrivals']].map(([k,l]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer mb-2 text-sm">
            <input type="checkbox" checked={filters[k as keyof typeof filters] === 'true'} onChange={e => setF(k, e.target.checked ? 'true' : '')} className="accent-primary" /> {l}
          </label>
        ))}
      </div>
      <button onClick={clear} className="w-full text-xs text-red-500 border border-red-200 py-2 rounded-xl hover:bg-red-50">Clear All Filters</button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-heading font-bold">All Products</h1><p className="text-gray-400 text-sm">{total} products</p></div>
        <div className="flex items-center gap-3">
          <select value={filters.sort} onChange={e => setF('sort',e.target.value)} className="input py-2 text-sm w-44">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilter(true)} className="lg:hidden flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium"><SlidersHorizontal size={16}/> Filters</button>
        </div>
      </div>
      <div className="flex gap-6">
        <aside className="hidden lg:block w-60 flex-shrink-0"><div className="card p-5 sticky top-24"><FilterContent /></div></aside>
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array(12).fill(0).map((_,i) => <div key={i} className="card overflow-hidden"><div className="aspect-square skeleton"/><div className="p-3 space-y-2"><div className="h-3 skeleton rounded"/><div className="h-4 skeleton rounded"/><div className="h-5 skeleton rounded w-1/2"/></div></div>)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-24"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-bold mb-2">No products found</h3><button onClick={clear} className="btn-primary mt-3">Clear Filters</button></div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{products.map(p => <ProductCard key={p._id} product={p}/>)}</div>
              {total > 20 && <div className="flex justify-center gap-2 mt-8">{Array(Math.min(Math.ceil(total/20),7)).fill(0).map((_,i) => <button key={i} onClick={() => setPage(i+1)} className={`w-10 h-10 rounded-full text-sm font-medium ${page===i+1?'bg-primary text-white':'border border-gray-200 hover:border-primary'}`}>{i+1}</button>)}</div>}
            </>
          )}
        </div>
      </div>
      {showFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilter(false)}/>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="font-bold text-lg">Filters</h2><button onClick={() => setShowFilter(false)}><X size={22}/></button></div>
            <FilterContent />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
