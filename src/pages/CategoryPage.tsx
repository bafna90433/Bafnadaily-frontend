import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import { Product, Category } from '../types'
import ProductCard from '../components/product/ProductCard'

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{slug:string}>()
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/categories/${slug}`).then(async r => {
      setCategory(r.data.category)
      const subRes = await api.get(`/categories/all`)
      const subs = (subRes.data.categories || []).filter((c: any) => c.parent?._id === r.data.category?._id || c.parent === r.data.category?._id)
      setSubCategories(subs)
      
      if (r.data.category?.layoutType !== 'hanging') {
        const res = await api.get(`/products?category=${r.data.category?._id}&limit=24`)
        setProducts(res.data.products)
      }
    }).catch(console.error).finally(()=>setLoading(false))
  }, [slug])

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><p className="animate-bounce text-4xl">🔑</p><p className="text-gray-400 font-bold mt-4">Loading your collection...</p></div>

  if (category?.layoutType === 'hanging') {
    return (
      <div className="min-h-screen bg-pink-50/30 pb-20">
        {/* Banner Section */}
        {category.banner && (
          <div className="w-full h-[300px] md:h-[450px] relative overflow-hidden mb-8 border-b-4 border-primary/20">
            <img src={category.banner} className="w-full h-full object-cover" alt={category.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-bottom p-8 md:p-16">
               <h1 className="text-white text-4xl md:text-7xl font-heading font-black drop-shadow-2xl mt-auto uppercase">{category.name}</h1>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 pt-12 text-center mb-16">
          <p className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-3">Premium Collection</p>
          <h1 className="text-4xl md:text-6xl font-heading font-black text-gray-900 mb-4">{category.name}</h1>
          <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full"/>
        </div>

        {/* Rope and Hanging Items */}
        <div className="relative mb-20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 shadow-lg z-10"/>
          
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-20 pt-1 relative z-0 px-4">
            {subCategories.map((sub, i) => (
              <Link key={sub._id} to={`/category/${sub.slug}`} className="group flex flex-col items-center">
                {/* String */}
                <div className="w-0.5 h-16 bg-gradient-to-b from-primary to-primary/20 group-hover:h-20 transition-all duration-500"/>
                {/* Card */}
                <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-primary/10 group-hover:border-primary group-hover:-rotate-3 transition-all duration-500 group-hover:scale-110">
                  <div className="w-32 h-40 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                    {sub.image ? (
                      <img src={sub.image} alt={sub.name} className="w-full h-full object-cover"/>
                    ) : (
                      <span className="text-4xl">{sub.icon || '🛍️'}</span>
                    )}
                  </div>
                  <div className="mt-3 bg-primary text-white text-[10px] font-black py-1 px-3 rounded-full text-center uppercase tracking-widest shadow-lg shadow-primary/20 group-hover:bg-primary-dark">
                    {sub.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {subCategories.length === 0 && (
          <div className="text-center py-20 opacity-40">
            <p className="text-6xl mb-4">📦</p>
            <p className="font-bold text-gray-500">Coming soon in this collection</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
      {/* Banner Section for Standard Layout */}
      {category?.banner && (
        <div className="w-full h-48 md:h-80 rounded-3xl overflow-hidden mb-8 shadow-xl">
          <img src={category.banner} className="w-full h-full object-cover" alt={category?.name} />
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-heading font-bold">{category?.icon} {category?.name || slug}</h1>
        {category?.description && <p className="text-gray-500 mt-2 text-lg">{category.description}</p>}
      </div>
      
      {/* Show subcategories as pills if standard layout */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {subCategories.map(sub => (
            <Link key={sub._id} to={`/category/${sub.slug}`} className="px-5 py-2 rounded-full border border-gray-200 hover:border-primary hover:text-primary font-bold text-sm transition-all whitespace-nowrap">
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.map(p => <ProductCard key={p._id} product={p}/>)}
      </div>
      {!loading && products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🛍️</p>
          <p>No products in this category yet</p>
        </div>
      )}
    </div>
  )
}

export default CategoryPage
